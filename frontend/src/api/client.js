const DEFAULT_API_BASE_URL = 'http://localhost:8000'
const DEFAULT_TIMEOUT_MS = 15000

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { cause, details, status } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.details = details
    this.status = status
  }
}

function getDisplayMessage(status, fallbackMessage) {
  if (status >= 500) {
    return '后端服务暂时不可用，请稍后重试'
  }

  if (status === 404) {
    return '请求的接口尚未开放'
  }

  return fallbackMessage || '请求失败，请重试'
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { message: text } : null
}

export async function apiRequest(
  path,
  { body, headers, method = 'GET', signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      body,
      headers,
      method,
      signal: controller.signal,
    })
    const data = await parseResponse(response)

    if (!response.ok) {
      const fallbackMessage = data?.detail || data?.message
      throw new ApiError(getDisplayMessage(response.status, fallbackMessage), {
        details: data,
        status: response.status,
      })
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后重试', { cause: error })
    }

    throw new ApiError('后端服务不可用，请稍后重试', { cause: error })
  } finally {
    window.clearTimeout(timeout)
  }
}

export function getJson(path, options = {}) {
  return apiRequest(path, options)
}

export function postJson(path, payload, options = {}) {
  return apiRequest(path, {
    ...options,
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    method: 'POST',
  })
}
