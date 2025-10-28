import axios from 'axios'

// In dev, prefer Vite's proxy by default to avoid localhost issues on LAN
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

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

