import { useState, useCallback } from 'react'

export const useChartConfig = () => {
  const [config, setConfig] = useState({})

  const updateConfig = useCallback((updates) => {
    setConfig(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  const resetConfig = useCallback((chartType) => {
    if (!chartType || !chartType.configSchema) return

    const defaultConfig = {}
    const schema = chartType.configSchema

    Object.keys(schema).forEach(key => {
      if (key === 'options' && schema[key]) {
        defaultConfig.options = {}
        Object.keys(schema[key]).forEach(optKey => {
          defaultConfig.options[optKey] = schema[key][optKey].default
        })
      } else if (key === 'datasets') {
        // Ensure datasets is properly initialized with default
        defaultConfig[key] = JSON.parse(JSON.stringify(schema[key].default || []))
      } else if (key === 'values' && Array.isArray(schema[key].default)) {
        // Deep copy for arrays of objects (scatter/bubble)
        defaultConfig[key] = JSON.parse(JSON.stringify(schema[key].default))
      } else {
        defaultConfig[key] = Array.isArray(schema[key].default) 
          ? [...schema[key].default] 
          : schema[key].default
      }
    })

    setConfig(defaultConfig)
  }, [])

  return {
    config,
    updateConfig,
    resetConfig,
    setConfig
  }
}

