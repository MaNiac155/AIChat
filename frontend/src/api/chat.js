import { apiRequest, getJson, postJson } from './client'

export function checkBackendHealth(options) {
  return getJson('/api/health', options)
}

export function sendChatMessage(
  { history = [], message, sessionId, visualContext },
  options,
) {
  return postJson(
    '/api/chat',
    {
      history,
      message,
      session_id: sessionId,
      visual_context: visualContext,
    },
    options,
  )
}

export function clearChatMemory(sessionId, options = {}) {
  return apiRequest(`/api/chat/sessions/${encodeURIComponent(sessionId)}`, {
    ...options,
    method: 'DELETE',
  })
}

export function sendVisionQuestion(
  { image },
  options = {},
) {
  const formData = new FormData()
  formData.append('image', image, 'camera-frame.jpg')

  return apiRequest('/api/vision', {
    ...options,
    body: formData,
    method: 'POST',
  })
}
