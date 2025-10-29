import axios from 'axios'

const getRuntimeApiUrl = () => {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.__CCC_API_URL__ || window.desktopConfig?.apiBaseUrl
}

const normalizeApiBaseUrl = (rawUrl) => {
  if (!rawUrl) {
    return '/api'
  }

  const trimmed = String(rawUrl).trim()
  if (!trimmed) {
    return '/api'
  }

  const ensureApiSuffix = (path) => {
    const withoutTrailingSlash = path.replace(/\/+$/, '')
    if (withoutTrailingSlash.endsWith('/api')) {
      return withoutTrailingSlash
    }
    if (withoutTrailingSlash === '' || withoutTrailingSlash === '/') {
      return '/api'
    }
    return `${withoutTrailingSlash}/api`
  }

  // Handle absolute URLs (including custom ports)
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      url.pathname = ensureApiSuffix(url.pathname || '/')
      return url.toString()
    } catch (error) {
      console.warn('Unable to parse VITE_API_URL, falling back to relative /api path:', error)
      return '/api'
    }
  }

  // Handle relative paths like "/backend" or "backend"
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return ensureApiSuffix(normalized)
}

const runtimeApiUrl = getRuntimeApiUrl()

// In dev, prefer Vite's proxy by default to avoid localhost issues on LAN
const API_BASE_URL = normalizeApiBaseUrl(runtimeApiUrl || import.meta.env.VITE_API_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getChartTypes = async () => {
  try {
    const response = await api.get('/charts')
    return response.data.data
  } catch (error) {
    console.error('Error fetching chart types:', error)
    throw error
  }
}

export const renderChart = async (chartType, config) => {
  try {
    const response = await api.post('/render', { chartType, config })
    return response.data.data
  } catch (error) {
    console.error('Error rendering chart:', error)
    throw error
  }
}

export const exportChart = async (chartType, config, format = 'png', transparent = false) => {
  try {
    const response = await api.post('/export', {
      chartType,
      config,
      format,
      transparent
    })
    return response.data.data
  } catch (error) {
    console.error('Error exporting chart:', error)
    throw error
  }
}

export default api
