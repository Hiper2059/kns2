import axios from 'axios'

const TOKEN_KEYS = {
  access: 'zmate_access_token',
  refresh: 'zmate_refresh_token',
  signature: 'zmate_signature_token'
}

export const getAccessToken = () => localStorage.getItem(TOKEN_KEYS.access)
export const getRefreshToken = () => localStorage.getItem(TOKEN_KEYS.refresh)
export const getSignatureToken = () => localStorage.getItem(TOKEN_KEYS.signature)

export const setTokens = ({ accessToken, refreshToken, signatureToken }) => {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEYS.access, accessToken)
  }
  if (refreshToken) {
    localStorage.setItem(TOKEN_KEYS.refresh, refreshToken)
  }
  if (signatureToken) {
    localStorage.setItem(TOKEN_KEYS.signature, signatureToken)
  }
}

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEYS.access)
  localStorage.removeItem(TOKEN_KEYS.refresh)
  localStorage.removeItem(TOKEN_KEYS.signature)
}

export const createApiClient = baseURL => {
  const api = axios.create({ baseURL })
  let refreshPromise = null

  api.interceptors.request.use(config => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  api.interceptors.response.use(
    response => response,
    async error => {
      const response = error?.response
      const originalRequest = error?.config

      if (!response || response.status !== 401 || originalRequest?._retry) {
        return Promise.reject(error)
      }

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = axios.post(`${baseURL}/api/auth/refresh`, { refreshToken })
        }

        const refreshResponse = await refreshPromise
        refreshPromise = null

        const { accessToken, refreshToken: nextRefreshToken, signatureToken } = refreshResponse.data || {}
        if (!accessToken || !nextRefreshToken) {
          clearTokens()
          return Promise.reject(error)
        }

        setTokens({ accessToken, refreshToken: nextRefreshToken, signatureToken })
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        refreshPromise = null
        clearTokens()
        return Promise.reject(refreshError)
      }
    }
  )

  return api
}
