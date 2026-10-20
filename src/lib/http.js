import axios from 'axios'

/**
 * The single Axios instance for the app.
 * - Sends cookies (Sanctum SPA session) and the XSRF token header.
 * - Fetches the CSRF cookie once before the first state-changing request.
 * - Emits auth events for 401 (session gone) and 423 (2FA setup required).
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const http = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

const listeners = { unauthorized: new Set(), twoFactorRequired: new Set() }

export function onAuthEvent(name, fn) {
  listeners[name].add(fn)
  return () => listeners[name].delete(fn)
}

function emit(name, payload) {
  listeners[name].forEach((fn) => fn(payload))
}

let csrfPromise = null

export function ensureCsrfCookie(force = false) {
  if (force) csrfPromise = null
  if (!csrfPromise) {
    csrfPromise = axios
      .get(`${API_URL}/sanctum/csrf-cookie`, { withCredentials: true, withXSRFToken: true })
      .catch((error) => {
        csrfPromise = null
        throw error
      })
  }
  return csrfPromise
}

const MUTATING = ['post', 'put', 'patch', 'delete']

http.interceptors.request.use(async (config) => {
  if (config.url && config.url.startsWith('/api/v1/')) {
    config.url = config.url.replace(/^\/api\/v1/, '')
  } else if (config.url === '/api/v1' || config.url === '/api/v1/') {
    config.url = '/'
  }

  if (MUTATING.includes((config.method || 'get').toLowerCase())) {
    await ensureCsrfCookie()
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const config = error.config || {}

    // 419: CSRF token expired. Refresh it once and retry.
    if (status === 419 && !config._csrfRetried) {
      config._csrfRetried = true
      await ensureCsrfCookie(true)
      return http(config)
    }

    if (status === 401 && !config.skipAuthRedirect) {
      emit('unauthorized', error)
    }

    if (status === 423 && error.response?.data?.code === 'two_factor_setup_required') {
      emit('twoFactorRequired', error)
    }

    return Promise.reject(error)
  },
)

/**
 * Turn an Axios error into { message, errors } for forms.
 */
export function parseError(error) {
  const data = error?.response?.data
  if (!error?.response) {
    return { message: 'We could not reach the server. Check your connection and try again.', errors: {} }
  }
  const errors = {}
  if (data?.errors) {
    for (const [key, value] of Object.entries(data.errors)) {
      errors[key] = Array.isArray(value) ? value[0] : value
    }
  }
  let message = data?.message || 'Something went wrong. Please try again.'
  if (error.response.status === 429) message = 'Too many attempts. Please wait a moment and try again.'
  return { message, errors }
}

export default http
