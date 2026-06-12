import React, { useEffect } from 'react'

import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

function VoiceInput({ onListeningChange, onTranscript }) {
  const { error, isListening, isSupported, toggleListening } =
    useSpeechRecognition({ onTranscript })

  useEffect(() => {
    onListeningChange?.(isListening)
  }, [isListening, onListeningChange])

  return (
    <div className="voice-input">
      <button
        className={`voice-button ${isListening ? 'voice-button-listening' : ''}`}
        type="button"
        aria-label={isListening ? '停止语音输入' : '开始语音输入'}
        aria-pressed={isListening}
        onClick={toggleListening}
      >
        <span className="microphone-icon" aria-hidden="true" />
        <span>{isListening ? '正在倾听，点击结束' : '开始说话'}</span>
        {isListening && <span className="listening-pulse" aria-hidden="true" />}
      </button>

      {!isSupported && !error && (
        <p className="voice-error" role="status">
          当前浏览器不支持语音识别，请使用文字输入
        </p>
      )}

      {error && (
        <p className="voice-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default VoiceInput
