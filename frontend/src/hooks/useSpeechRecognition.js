import { useCallback, useEffect, useRef, useState } from 'react'

const ERROR_MESSAGES = {
  'audio-capture': '无法访问麦克风，请检查浏览器权限',
  'not-allowed': '无法访问麦克风，请检查浏览器权限',
  'service-not-allowed': '无法访问麦克风，请检查浏览器权限',
}

export function useSpeechRecognition({ onTranscript } = {}) {
  const recognitionRef = useRef(null)
  const onTranscriptRef = useRef(onTranscript)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null
  const isSupported = Boolean(SpeechRecognition)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    if (!SpeechRecognition) {
      return undefined
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setError('')
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim()
      if (transcript) {
        onTranscriptRef.current?.(transcript)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'aborted') {
        return
      }

      setError(
        ERROR_MESSAGES[event.error] || '语音识别失败，请重试或使用文字输入',
      )
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.abort()
      recognitionRef.current = null
    }
  }, [SpeechRecognition])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('当前浏览器不支持语音识别，请使用文字输入')
      return
    }

    try {
      setError('')
      recognitionRef.current?.start()
    } catch (recognitionError) {
      if (recognitionError.name !== 'InvalidStateError') {
        setError('语音识别失败，请重试或使用文字输入')
      }
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
      return
    }

    startListening()
  }, [isListening, startListening, stopListening])

  return {
    error,
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  }
}
