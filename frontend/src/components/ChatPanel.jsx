import React, { useEffect, useRef, useState } from 'react'

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

function ChatPanel({
  onActivityStateChange,
  onListeningChange,
  onVisionCapture,
  visionAvailable,
}) {
  const [captureFeedback, setCaptureFeedback] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState(initialMessages)
  const activityTimersRef = useRef([])

  const clearActivityTimers = () => {
    activityTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    activityTimersRef.current = []
  }

  const runResponseStatePreview = () => {
    clearActivityTimers()
    onActivityStateChange?.('thinking')

    activityTimersRef.current = [
      window.setTimeout(() => onActivityStateChange?.('talking'), 850),
      window.setTimeout(() => onActivityStateChange?.('idle'), 2450),
    ]
  }

  useEffect(
    () => () => {
      clearActivityTimers()
    },
    [],
  )

  const sendMessage = (content, metadata = {}) => {
    const normalizedContent = content.trim()
    if (!normalizedContent) {
      return
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${Date.now()}-${currentMessages.length}`,
        role: 'user',
        content: normalizedContent,
        time: getMessageTime(),
        ...metadata,
      },
    ])
    setInputValue('')
    runResponseStatePreview()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(inputValue)
  }

  const clearConversation = () => {
    clearActivityTimers()
    onActivityStateChange?.('idle')
    setCaptureFeedback('')
    setMessages(initialMessages)
  }

  const handleVisionSuggestion = async () => {
    setCaptureFeedback('')

    try {
      const result = await onVisionCapture()
      const feedback = `已截取当前画面：${result.width} × ${result.height}，${(
        result.size / 1024
      ).toFixed(1)} KB`

      setCaptureFeedback(feedback)
      sendMessage('你看看桌上有什么？', {
        attachment: feedback,
      })
    } catch (error) {
      setCaptureFeedback(error.message || '截图失败，请重试')
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

        <div className="suggestion-block">
          <p>试着这样问我</p>
          <button
            type="button"
            disabled={!visionAvailable}
            title={visionAvailable ? '使用当前摄像头画面提问' : '请先开启摄像头'}
            onClick={handleVisionSuggestion}
          >
            “你看看桌上有什么？”
          </button>
          <button type="button" onClick={() => sendMessage('给我讲个有趣的故事')}>
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
        <VoiceInput
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
          />
          <button
            className="send-button"
            type="submit"
            aria-label="发送消息"
            disabled={!inputValue.trim()}
          >
            ↑
          </button>
        </form>
        <p className="composer-hint">语音和文本将进入同一对话流程</p>
      </div>
    </section>
  )
}

export default ChatPanel
