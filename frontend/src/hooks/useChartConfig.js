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
      } else {
        defaultConfig[key] = schema[key].default
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

