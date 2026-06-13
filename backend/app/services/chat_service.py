import asyncio
import logging
import re
from collections import defaultdict

import httpx

from app.config import settings
from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse


logger = logging.getLogger(__name__)


class ConversationMemory:
    def __init__(self, max_messages: int) -> None:
        self._max_messages = max_messages
        self._sessions: dict[str, list[ChatMessage]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def get(self, session_id: str) -> list[ChatMessage]:
        async with self._lock:
            return list(self._sessions.get(session_id, []))

    async def append_turn(
        self,
        session_id: str,
        user_message: str,
        assistant_message: str,
    ) -> int:
        async with self._lock:
            messages = self._sessions[session_id]
            messages.extend(
                [
                    ChatMessage(role="user", content=user_message),
                    ChatMessage(role="assistant", content=assistant_message),
                ]
            )
            self._sessions[session_id] = messages[-self._max_messages :]
            return len(self._sessions[session_id]) // 2

    async def clear(self, session_id: str) -> None:
        async with self._lock:
            self._sessions.pop(session_id, None)


class ChatService:
    def __init__(self) -> None:
        self.memory = ConversationMemory(settings.chat_memory_max_messages)

    async def chat(self, request: ChatRequest) -> ChatResponse:
        stored_history = await self.memory.get(request.session_id)
        history = self._merge_history(stored_history, request.history)
        messages = self._build_model_messages(request, history)

        if (
            settings.mock_mode
            or not settings.model_api_key
            or not settings.chat_model
        ):
            reply = self._mock_reply(request.message, history, request.visual_context)
            mock_mode = True
        else:
            reply = await self._call_chat_model(messages)
            mock_mode = False

        memory_turns = await self.memory.append_turn(
            request.session_id,
            request.message,
            reply,
        )
        return ChatResponse(
            reply=reply,
            emotion="happy",
            action="talking",
            session_id=request.session_id,
            memory_turns=memory_turns,
            mock_mode=mock_mode,
        )

    async def clear_memory(self, session_id: str) -> None:
        await self.memory.clear(session_id)

    @staticmethod
    def _merge_history(
        stored_history: list[ChatMessage],
        client_history: list[ChatMessage],
    ) -> list[ChatMessage]:
        if stored_history:
            return stored_history
        return client_history[-settings.chat_memory_max_messages :]

    @staticmethod
    def _build_model_messages(
        request: ChatRequest,
        history: list[ChatMessage],
    ) -> list[dict[str, str]]:
        messages = [
            {
                "role": "system",
                "content": settings.chat_system_prompt,
            }
        ]
        messages.extend(message.model_dump() for message in history)

        user_content = request.message
        if request.visual_context:
            user_content = (
                "以下内容是视觉模型对用户当前摄像头画面的描述。"
                "请直接基于描述回答用户问题，不要忽略该描述，也不要声称看到描述之外的内容。\n\n"
                f"视觉描述：{request.visual_context}\n"
                f"用户问题：{request.message}"
            )
        messages.append({"role": "user", "content": user_content})
        return messages

    @staticmethod
    def _mock_reply(
        message: str,
        history: list[ChatMessage],
        visual_context: str | None,
    ) -> str:
        if visual_context:
            return f"根据当前画面，我看到：{visual_context}。关于你的问题：{message}"

        if "天气" in message:
            return "我目前无法直接获取实时天气。你可以告诉我城市，或接入天气工具后再查询。"

        if "我叫什么" in message or "我的名字" in message:
            for item in reversed(history):
                if item.role != "user":
                    continue
                match = re.search(r"我叫([\w\u4e00-\u9fff·]{1,20})", item.content)
                if match:
                    return f"你之前告诉我，你叫{match.group(1)}。"
            return "你还没有告诉我你的名字。"

        name_match = re.search(r"我叫([\w\u4e00-\u9fff·]{1,20})", message)
        if name_match:
            return f"记住了，你叫{name_match.group(1)}。很高兴认识你。"

        if "故事" in message:
            return "从前有一盏会记住每次对话的小灯，它最喜欢在人需要答案时亮起来。"

        return f"我收到你的消息了：{message}"

    @staticmethod
    async def _call_chat_model(messages: list[dict[str, str]]) -> str:
        url = f"{settings.model_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.model_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.chat_model,
            "messages": messages,
            "temperature": settings.chat_temperature,
        }

        try:
            async with httpx.AsyncClient(
                timeout=settings.model_timeout_seconds,
                trust_env=settings.model_trust_env,
            ) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.ConnectError as error:
            logger.warning(
                "Chat model connection failed host=%s trust_env=%s",
                settings.model_base_url,
                settings.model_trust_env,
            )
            raise RuntimeError("无法连接聊天模型服务，请检查网络或代理配置") from error
        except httpx.HTTPError as error:
            logger.exception("Chat model request failed")
            raise RuntimeError("聊天模型调用失败") from error

        try:
            reply = data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError, AttributeError) as error:
            raise RuntimeError("聊天模型返回格式无效") from error

        if not reply:
            raise RuntimeError("聊天模型返回了空内容")
        return reply


chat_service = ChatService()
