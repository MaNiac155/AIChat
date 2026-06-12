import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { captureVideoFrame } from '../utils/image'

const CAMERA_ERROR_MESSAGE = '无法访问摄像头，请检查浏览器权限'

const statusLabels = {
  idle: '未开启',
  requesting: '请求权限中',
  active: '画面已连接',
  error: '连接失败',
  unsupported: '浏览器不支持',
}

const CameraView = forwardRef(function CameraView({ onStatusChange }, ref) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [capturePreviewUrl, setCapturePreviewUrl] = useState('')
  const [captureResult, setCaptureResult] = useState(null)

  const updateStatus = (nextStatus) => {
    setStatus(nextStatus)
    onStatusChange?.(nextStatus)
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setErrorMessage('')
    setCaptureResult(null)
    setCapturePreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
      return ''
    })
    updateStatus('idle')
  }

  const captureFrame = async () => {
    if (
      status !== 'active' ||
      !videoRef.current?.videoWidth ||
      !videoRef.current?.videoHeight
    ) {
      throw new Error('请先开启摄像头')
    }

    return captureVideoFrame(videoRef.current)
  }

  const testCapture = async () => {
    setErrorMessage('')

    try {
      const result = await captureFrame()
      const previewUrl = URL.createObjectURL(result.blob)

      setCapturePreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl)
        }
        return previewUrl
      })
      setCaptureResult(result)
      console.info('capture frame success', {
        height: result.height,
        size: result.size,
        type: result.type,
        width: result.width,
      })
    } catch (error) {
      setErrorMessage(error.message || '截图失败，请重试')
    }
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('当前浏览器不支持摄像头访问，请使用最新版浏览器')
      updateStatus('unsupported')
      return
    }

    setErrorMessage('')
    updateStatus('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = stream

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        streamRef.current = null
        updateStatus('idle')
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      updateStatus('active')
    } catch (error) {
      console.error('Unable to start camera:', error)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setErrorMessage(CAMERA_ERROR_MESSAGE)
      updateStatus('error')
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      getVideoElement: () => videoRef.current,
      captureFrame,
      isReady: () =>
        status === 'active' &&
        Boolean(videoRef.current?.videoWidth && videoRef.current?.videoHeight),
      startCamera,
      stopCamera,
    }),
    [status],
  )

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    },
    [],
  )

  useEffect(
    () => () => {
      if (capturePreviewUrl) {
        URL.revokeObjectURL(capturePreviewUrl)
      }
    },
    [capturePreviewUrl],
  )

  const isActive = status === 'active'
  const isRequesting = status === 'requesting'

  return (
    <section className="panel camera-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Visual context</p>
          <h2>摄像头画面</h2>
        </div>
        <span className={`badge ${isActive ? 'badge-active' : 'badge-muted'}`}>
          {isActive && <span className="status-dot" aria-hidden="true" />}
          {statusLabels[status]}
        </span>
      </div>

      <div className={`camera-preview ${isActive ? 'camera-preview-active' : ''}`}>
        <video ref={videoRef} autoPlay muted playsInline />

        {!isActive && (
          <div className="camera-placeholder">
            <div className="camera-icon" aria-hidden="true">
              <span />
            </div>
            <div>
              <strong>
                {isRequesting ? '正在等待摄像头授权' : '等待摄像头授权'}
              </strong>
              <p>开启后，AI 可以在你提问时查看当前画面。</p>
            </div>
          </div>
        )}

        {isActive && (
          <div className="camera-live-indicator">
            <span className="status-dot" aria-hidden="true" />
            LIVE
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="camera-error" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        className={`button ${isActive ? 'button-secondary' : 'button-primary'}`}
        type="button"
        onClick={isActive ? stopCamera : startCamera}
        disabled={isRequesting}
      >
        <span className="button-icon" aria-hidden="true">
          ◉
        </span>
        {isRequesting ? '正在请求权限...' : isActive ? '关闭摄像头' : '开启摄像头'}
      </button>

      <button
        className="button button-debug"
        type="button"
        onClick={testCapture}
        disabled={!isActive}
        title={isActive ? '截取当前摄像头画面' : '请先开启摄像头'}
      >
        截图测试
      </button>

      {captureResult && (
        <div className="capture-result" role="status">
          <img src={capturePreviewUrl} alt="最近一次摄像头截图预览" />
          <div>
            <strong>截图成功</strong>
            <span>
              {captureResult.width} × {captureResult.height} ·{' '}
              {(captureResult.size / 1024).toFixed(1)} KB · {captureResult.type}
            </span>
          </div>
        </div>
      )}

      <div className="privacy-note">
        <span aria-hidden="true">◇</span>
        <p>仅在视觉问题触发时截取当前画面，不会持续上传视频。</p>
      </div>
    </section>
  )
})

export default CameraView
