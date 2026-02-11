import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const DEBUG = String(import.meta.env.VITE_DEBUG).toLowerCase() === 'true'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class ApiError extends Error {
  constructor(message, { status, traceId, details, isCanceled } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.traceId = traceId
    this.details = details
    this.isCanceled = isCanceled
  }
}

const parseError = (error) => {
  if (axios.isCancel(error) || error.name === 'CanceledError') {
    return new ApiError('Request canceled', { isCanceled: true })
  }

  const status = error.response?.status
  const payload = error.response?.data?.error || error.response?.data || {}
  const message =
    payload.message ||
    payload.error ||
    error.message ||
    'Unable to reach the server. Please try again.'

  return new ApiError(message, {
    status,
    traceId: payload.trace_id,
    details: payload.details,
  })
}

const shouldRetry = (error) => {
  if (error.isCanceled) return false
  if (!error.status) return true
  return [502, 503, 504].includes(error.status)
}

const requestWithRetry = async (fn, { retries = 2, delay = 600 } = {}) => {
  let attempt = 0
  while (attempt <= retries) {
    try {
      return await fn()
    } catch (error) {
      const apiError = error instanceof ApiError ? error : parseError(error)
      if (!shouldRetry(apiError) || attempt === retries) {
        throw apiError
      }
      if (DEBUG) {
        console.warn(`Retrying request (${attempt + 1}/${retries})`)
      }
      await sleep(delay * (attempt + 1))
      attempt += 1
    }
  }
  throw new ApiError('Request failed after retries')
}

export const sendMessage = async ({ message, threadId, mode, context, verbosity, signal }) => {
  const payload = {
    message,
    thread_id: threadId,
    mode,
    context,
    verbosity,
  }

  const response = await requestWithRetry(() => api.post('/chat', payload, { signal }))

  return {
    answer: response.data.answer || 'No response received.',
    used_retriever: response.data.used_retriever || false,
    thread_id: response.data.thread_id || threadId || `user_${Date.now()}`,
    sources: response.data.sources || [],
  }
}

export const checkHealth = async ({ signal } = {}) => {
  try {
    const response = await api.get('/health', { signal })
    return { ...response.data, status: response.data.status || 'healthy' }
  } catch (error) {
    throw parseError(error)
  }
}

export const getDocuments = async ({ signal } = {}) => {
  try {
    const response = await api.get('/documents', { signal })
    return response.data
  } catch (error) {
    throw parseError(error)
  }
}

export default api
