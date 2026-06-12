import { apiRequest, getJson, postJson } from './client'

export function checkBackendHealth(options) {
  return getJson('/api/health', options)
}

export function sendChatMessage({ history = [], message }, options) {
  return postJson(
    '/api/chat',
    {
      history,
      message,
    },
    options,
  )
}

export function sendVisionQuestion(
  { history = [], image, message },
  options = {},
) {
  const formData = new FormData()
  formData.append('image', image, 'camera-frame.jpg')
  formData.append('message', message)
  formData.append('history', JSON.stringify(history))

  return apiRequest('/api/vision', {
    ...options,
    body: formData,
    method: 'POST',
  })
}
