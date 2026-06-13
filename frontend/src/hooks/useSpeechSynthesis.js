import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeechSynthesis({ lang = 'zh-CN', onEnd, onStart } = {}) {
  const onEndRef = useRef(onEnd)
  const onStartRef = useRef(onStart)
  const utteranceRef = useRef(null)
  const [error, setError] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const synthesis =
    typeof window !== 'undefined' ? window.speechSynthesis : undefined
  const isSupported =
    Boolean(synthesis) &&
    typeof window !== 'undefined' &&
    'SpeechSynthesisUtterance' in window

  useEffect(() => {
    onEndRef.current = onEnd
    onStartRef.current = onStart
  }, [onEnd, onStart])

  const cancel = useCallback(() => {
    if (!isSupported) {
      return
    }

    synthesis.cancel()
    utteranceRef.current = null
    setIsSpeaking(false)
  }, [isSupported, synthesis])

  const speak = useCallback(
    (text) => {
      const normalizedText = text?.trim()
      if (!normalizedText) {
        return false
      }

      if (!isSupported) {
        setError('当前浏览器不支持语音播放')
        return false
      }

      synthesis.cancel()

      const utterance = new window.SpeechSynthesisUtterance(normalizedText)
      const voices = synthesis.getVoices()
      const chineseVoice = voices.find((voice) =>
        voice.lang?.toLowerCase().startsWith('zh'),
      )

      utterance.lang = lang
      utterance.rate = 2
      utterance.pitch = 5
      if (chineseVoice) {
        utterance.voice = chineseVoice
      }

      utterance.onstart = () => {
        setError('')
        setIsSpeaking(true)
        onStartRef.current?.()
      }
      utterance.onend = () => {
        utteranceRef.current = null
        setIsSpeaking(false)
        onEndRef.current?.()
      }
      utterance.onerror = (event) => {
        utteranceRef.current = null
        setIsSpeaking(false)

        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          setError('语音播放失败，回复文本仍可正常查看')
        }
        onEndRef.current?.()
      }

      utteranceRef.current = utterance
      synthesis.speak(utterance)
      return true
    },
    [isSupported, lang, synthesis],
  )

  useEffect(
    () => () => {
      synthesis?.cancel()
    },
    [synthesis],
  )

  return {
    cancel,
    error,
    isSpeaking,
    isSupported,
    speak,
  }
}
