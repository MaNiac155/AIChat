import React, { useEffect, useRef, useState } from 'react'

import {
  clearChatMemory,
  sendChatMessage,
  sendVisionQuestion,
} from '../api/chat'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { needsVisionContext } from '../utils/intent'
import VoiceInput from './VoiceInput'

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content:
      '你好，我是露米娅。你可以直接和我说话，也可以让我看看镜头里的东西。',
    time: '刚刚',
  },
]

function getMessageTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function getSessionId() {
  const storageKey = 'ai-chat-session-id'
  const existingId = window.sessionStorage.getItem(storageKey)
  if (existingId) {
    return existingId
  }

  const sessionId =
    window.crypto?.randomUUID?.() ||
    `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
  window.sessionStorage.setItem(storageKey, sessionId)
  return sessionId
}

function ChatPanel({
  onActivityStateChange,
  onListeningChange,
  onVisionCapture,
  visionAvailable,
}) {
  const [captureFeedback, setCaptureFeedback] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true)
  const [isVisionEnabled, setIsVisionEnabled] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [workflowStatus, setWorkflowStatus] = useState('等待你的问题')
  const sessionIdRef = useRef(getSessionId())
  const {
    cancel: cancelSpeech,
    error: speechError,
    isSpeaking,
    isSupported: isSpeechSupported,
    speak,
  } = useSpeechSynthesis({
    onEnd: () => {
      setWorkflowStatus('回答完成')
      onActivityStateChange?.('idle')
    },
    onStart: () => {
      setWorkflowStatus('正在播放 AI 回复')
      onActivityStateChange?.('talking')
    },
  })

  useEffect(() => {
    if (!visionAvailable) {
      setIsVisionEnabled(false)
      setCaptureFeedback('')
    }
  }, [visionAvailable])

  const sendMessage = async (content, metadata = {}) => {
    const normalizedContent = content.trim()
    if (!normalizedContent || isLoading) {
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: normalizedContent,
      time: getMessageTime(),
      ...metadata,
    }

    setMessages((currentMessages) => [...currentMessages, userMessage])
    setInputValue('')
    setErrorMessage('')
    setIsLoading(true)
    cancelSpeech()
    setWorkflowStatus('正在生成回答')
    onActivityStateChange?.('thinking')

    try {
      let visualContext = metadata.visualContext

      const hasVisualIntent = needsVisionContext(normalizedContent)
      const shouldUseVision = isVisionEnabled && hasVisualIntent

      if (hasVisualIntent && !visionAvailable) {
        throw new Error('请先开启摄像头')
      }

      if (shouldUseVision) {
        setWorkflowStatus('正在理解当前画面')
        const result = await onVisionCapture()
        const feedback = `已截取当前画面：${result.width} × ${result.height}，${(
          result.size / 1024
        ).toFixed(1)} KB`
        let vision
        try {
          vision = await sendVisionQuestion({ image: result.blob })
        } catch (error) {
          throw new Error('图片上传失败，请重试', { cause: error })
        }

        visualContext = vision.description
        const costFeedback = vision.cache_reused
          ? `复用视觉缓存 · 模型调用 ${vision.model_call_count} 次`
          : `视觉模型调用 ${vision.model_call_count} 次`
        setCaptureFeedback(`${feedback} · ${costFeedback} · ${vision.description}`)
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === userMessage.id
              ? { ...message, attachment: feedback }
              : message,
          ),
        )
        setWorkflowStatus('正在结合画面生成回答')
      }

      const response = await sendChatMessage({
        message: normalizedContent,
        sessionId: sessionIdRef.current,
        visualContext,
      })
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          time: getMessageTime(),
        },
      ])

      if (!isSpeechEnabled || !speak(response.reply)) {
        setWorkflowStatus('回答完成')
        onActivityStateChange?.('idle')
      }
    } catch (error) {
      setErrorMessage(error.message || '后端服务不可用，请稍后重试')
      setWorkflowStatus('处理失败，可以继续提问')
      onActivityStateChange?.('idle')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(inputValue)
  }

  const clearConversation = async () => {
    cancelSpeech()
    onActivityStateChange?.('idle')
    setCaptureFeedback('')
    setErrorMessage('')
    setMessages(initialMessages)
    setWorkflowStatus('等待你的问题')

    try {
      await clearChatMemory(sessionIdRef.current)
    } catch (error) {
      setErrorMessage(error.message || '清除后端记忆失败')
    }
  }

  return (
    <section className="panel chat-panel">
      <div className="panel-heading chat-heading">
        <div>
          <p className="panel-kicker">Conversation</p>
          <h2>对话</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="清空对话"
          onClick={clearConversation}
        >
          ↻
        </button>
      </div>

      <div className="message-list" aria-live="polite">
        <div className="conversation-date">
          <span>现在</span>
        </div>

        {messages.map((message) => (
          <article className={`message message-${message.role}`} key={message.id}>
            <div className="message-avatar">
              {message.role === 'assistant' ? 'L' : '你'}
            </div>
            <div>
              <div className="message-meta">
                <strong>{message.role === 'assistant' ? '露米娅' : '你'}</strong>
                <span>{message.time}</span>
              </div>
              <p>{message.content}</p>
              {message.attachment && (
                <span className="message-attachment">{message.attachment}</span>
              )}
            </div>
          </article>
        ))}

        {isLoading && (
          <div className="chat-loading" role="status">
            <span />
            <span />
            <span />
            露米娅正在思考
          </div>
        )}

        <div className="suggestion-block">
          <p>试着这样问我</p>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => sendMessage('你看看桌上有什么？')}
          >
            “你看看桌上有什么？”
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => sendMessage('给我讲个有趣的故事')}
          >
            “给我讲个有趣的故事”
          </button>
          {captureFeedback && (
            <span className="capture-feedback" role="status">
              {captureFeedback}
            </span>
          )}
        </div>
      </div>

      <div className="chat-composer">
        <div className="workflow-status" role="status">
          <span aria-hidden="true" />
          {workflowStatus}
        </div>
        <button
          className={`speech-toggle ${isSpeechEnabled ? 'speech-toggle-active' : ''}`}
          type="button"
          aria-pressed={isSpeechEnabled}
          disabled={!isSpeechSupported || isLoading}
          onClick={() => {
            setIsSpeechEnabled((current) => {
              if (current) {
                cancelSpeech()
                onActivityStateChange?.('idle')
              }
              return !current
            })
          }}
          title={
            isSpeechSupported
              ? '控制 AI 回复是否自动播放语音'
              : '当前浏览器不支持语音播放'
          }
        >
          <span className="speech-toggle-indicator" aria-hidden="true" />
          <span>
            回复语音
            <strong>
              {isSpeaking ? '播放中' : isSpeechEnabled ? '已开启' : '已关闭'}
            </strong>
          </span>
        </button>
        <button
          className={`vision-toggle ${isVisionEnabled ? 'vision-toggle-active' : ''}`}
          type="button"
          aria-pressed={isVisionEnabled}
          disabled={!visionAvailable || isLoading}
          onClick={() => setIsVisionEnabled((current) => !current)}
          title={visionAvailable ? '控制发送消息时是否调用视觉理解' : '请先开启摄像头'}
        >
          <span className="vision-toggle-indicator" aria-hidden="true" />
          <span>
            自动视觉理解
            <strong>{isVisionEnabled ? '已开启' : '已关闭'}</strong>
          </span>
        </button>
        <VoiceInput
          disabled={isLoading}
          onListeningChange={onListeningChange}
          onTranscript={sendMessage}
        />
        <form className="text-composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="输入消息，或使用语音提问..."
            aria-label="消息内容"
            disabled={isLoading}
          />
          <button
            className="send-button"
            type="submit"
            aria-label="发送消息"
            disabled={!inputValue.trim() || isLoading}
          >
            ↑
          </button>
        </form>
        {errorMessage && (
          <p className="chat-error" role="alert">
            {errorMessage}
          </p>
        )}
        {!isSpeechSupported && (
          <p className="speech-error" role="status">
            当前浏览器不支持语音播放
          </p>
        )}
        {speechError && isSpeechSupported && (
          <p className="speech-error" role="alert">
            {speechError}
          </p>
        )}
        <p className="composer-hint">
          {isVisionEnabled
            ? '仅在问题需要查看画面时，才会截图并调用视觉理解'
            : '语音和文本将进入普通对话流程'}
        </p>
      </div>
    </section>
  )
}

export default ChatPanel
