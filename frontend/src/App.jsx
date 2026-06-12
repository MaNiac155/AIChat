import React, { useEffect, useRef, useState } from 'react'

import { checkBackendHealth } from './api/chat'
import Avatar from './components/Avatar'
import CameraView from './components/CameraView'
import ChatPanel from './components/ChatPanel'

function App() {
  const cameraRef = useRef(null)
  const [cameraStatus, setCameraStatus] = useState('idle')
  const [isListening, setIsListening] = useState(false)
  const [interactionState, setInteractionState] = useState('idle')
  const [backendState, setBackendState] = useState({
    error: '',
    status: 'checking',
  })
  const avatarState = isListening ? 'listening' : interactionState

  const refreshBackendHealth = async () => {
    setBackendState({ error: '', status: 'checking' })

    try {
      const health = await checkBackendHealth({ timeoutMs: 5000 })
      setBackendState({
        error: '',
        mockMode: health.mock_mode,
        status: health.status === 'ok' ? 'online' : 'offline',
      })
    } catch (error) {
      setBackendState({
        error: error.message,
        status: 'offline',
      })
    }
  }

  useEffect(() => {
    refreshBackendHealth()
  }, [])

  const captureCurrentFrame = () => {
    if (!cameraRef.current?.captureFrame) {
      return Promise.reject(new Error('请先开启摄像头'))
    }

    return cameraRef.current.captureFrame()
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <div>
            <p className="eyebrow">AI Visual Companion</p>
            <h1>视觉对话助手</h1>
          </div>
        </div>

        <button
          className={`connection-status connection-status-${backendState.status} ${
            isListening ? 'is-listening' : ''
          }`}
          type="button"
          onClick={refreshBackendHealth}
          title={backendState.error || '点击重新检查后端连接'}
        >
          <span className="status-dot" aria-hidden="true" />
          <span>
            {isListening
              ? '正在倾听'
              : backendState.status === 'checking'
                ? '正在连接后端'
                : backendState.status === 'online'
                  ? `后端已连接${backendState.mockMode ? ' · Mock' : ''}`
                  : '后端未连接'}
          </span>
        </button>
      </header>

      <section className="workspace" aria-label="AI 视觉对话工作区">
        <CameraView ref={cameraRef} onStatusChange={setCameraStatus} />
        <Avatar state={avatarState} />
        <ChatPanel
          onActivityStateChange={setInteractionState}
          onListeningChange={setIsListening}
          visionAvailable={cameraStatus === 'active'}
          onVisionCapture={captureCurrentFrame}
        />
      </section>
    </main>
  )
}

export default App
