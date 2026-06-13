import base64
import logging

import httpx

from app.config import settings
from app.schemas.vision import VisionResponse
from app.services.cost_control import vision_cost_control


logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/webp"}
MAX_IMAGE_BYTES = 500 * 1024
JPEG_SIGNATURE = b"\xff\xd8\xff"
WEBP_RIFF_SIGNATURE = b"RIFF"
WEBP_FORMAT_SIGNATURE = b"WEBP"


class VisionService:
    async def describe(self, image: bytes, image_type: str) -> VisionResponse:
        self._validate_image(image, image_type)
        cached_description = await vision_cost_control.get_cached_description()
        if cached_description:
            return VisionResponse(
                description=cached_description.description,
                image_size=len(image),
                image_type=image_type,
                mock_mode=cached_description.mock_mode,
                cache_reused=True,
                model_call_count=await vision_cost_control.get_model_call_count(),
            )

        model_call_count = await vision_cost_control.record_model_call()
        if (
            settings.mock_mode
            or not settings.model_api_key
            or not settings.vision_model
        ):
            description = "我看到了摄像头当前画面，这是一张用于视觉问答的测试图片。"
            mock_mode = True
        else:
            description = await self._call_vision_model(image, image_type)
            mock_mode = False

        await vision_cost_control.store_description(description, mock_mode)
        return VisionResponse(
            description=description,
            image_size=len(image),
            image_type=image_type,
            mock_mode=mock_mode,
            cache_reused=False,
            model_call_count=model_call_count,
        )

    @staticmethod
    def _validate_image(image: bytes, image_type: str) -> None:
        if not image:
            raise ValueError("图片不能为空")
        if image_type not in ALLOWED_IMAGE_TYPES:
            raise ValueError("仅支持 image/jpeg 或 image/webp 格式")
        if len(image) > MAX_IMAGE_BYTES:
            raise ValueError("图片大小不能超过 500KB")

        is_jpeg = image_type == "image/jpeg" and image.startswith(JPEG_SIGNATURE)
        is_webp = (
            image_type == "image/webp"
            and image.startswith(WEBP_RIFF_SIGNATURE)
            and image[8:12] == WEBP_FORMAT_SIGNATURE
        )
        if not (is_jpeg or is_webp):
            raise ValueError("图片内容与声明格式不匹配")

    @staticmethod
    async def _call_vision_model(image: bytes, image_type: str) -> str:
        image_base64 = base64.b64encode(image).decode("ascii")
        url = f"{settings.model_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.model_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": settings.vision_system_prompt,
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{image_type};base64,{image_base64}",
                            },
                        },
                    ],
                }
            ],
            "max_tokens": settings.vision_max_tokens,
            "temperature": 0.1,
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
                "Vision model connection failed host=%s trust_env=%s",
                settings.model_base_url,
                settings.model_trust_env,
            )
            raise RuntimeError("无法连接视觉模型服务，请检查网络或代理配置") from error
        except httpx.HTTPError as error:
            logger.exception("Vision model request failed")
            raise RuntimeError("视觉模型调用失败") from error

        try:
            description = data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError, AttributeError) as error:
            raise RuntimeError("视觉模型返回格式无效") from error

        if not description:
            raise RuntimeError("视觉模型返回了空描述")
        return description


vision_service = VisionService()
