import { useReducer, useCallback, useMemo, useState } from 'react'

const cloneConfig = (value = {}) => JSON.parse(JSON.stringify(value))

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const initialHistory = {
  past: [],
  present: {},
  future: []
}

const historyReducer = (state, action) => {
  switch (action.type) {
    case 'SET': {
      const { payload, options = {} } = action
      const next = cloneConfig(
        typeof payload === 'function' ? payload(cloneConfig(state.present)) : payload
      )

      if (options.resetHistory) {
        return {
          past: [],
          present: next,
          future: []
        }
      }

      if (options.recordHistory === false) {
        return {
          ...state,
          present: next
        }
      }

      if (deepEqual(state.present, next)) {
        return state
      }

      return {
        past: [...state.past, cloneConfig(state.present)],
        present: next,
        future: []
      }
    }
    case 'UPDATE': {
      const { payload, options = {} } = action
      const updates = typeof payload === 'function'
        ? payload(cloneConfig(state.present))
        : payload || {}

      const next = cloneConfig({
        ...state.present,
        ...updates
      })

      if (options.resetHistory) {
        return {
          past: [],
          present: next,
          future: []
        }
      }

      if (options.recordHistory === false) {
        return {
          ...state,
          present: next
        }
      }

      if (deepEqual(state.present, next)) {
        return state
      }

      return {
        past: [...state.past, cloneConfig(state.present)],
        present: next,
        future: []
      }
    }
    case 'RESET': {
      const next = cloneConfig(action.payload || {})
      return {
        past: [],
        present: next,
        future: []
      }
    }
    case 'UNDO': {
      if (state.past.length === 0) {
        return state
      }

      const previous = state.past[state.past.length - 1]
      const newPast = state.past.slice(0, -1)

      return {
        past: newPast,
        present: cloneConfig(previous),
        future: [cloneConfig(state.present), ...state.future]
      }
    }
    case 'REDO': {
      if (state.future.length === 0) {
        return state
      }

      const next = state.future[0]
      const newFuture = state.future.slice(1)

      return {
        past: [...state.past, cloneConfig(state.present)],
        present: cloneConfig(next),
        future: newFuture
      }
    }
    default:
      return state
  }
}

export const useChartConfig = () => {
  const [history, dispatch] = useReducer(historyReducer, initialHistory)
  const [initialConfig, setInitialConfig] = useState({})

  const updateConfig = useCallback((updates, options = {}) => {
    dispatch({ type: 'UPDATE', payload: updates, options })
  }, [])

  const setConfig = useCallback((nextConfig, options = {}) => {
    dispatch({ type: 'SET', payload: nextConfig, options })
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
        defaultConfig[key] = JSON.parse(JSON.stringify(schema[key].default || []))
      } else if (key === 'values' && Array.isArray(schema[key].default)) {
        defaultConfig[key] = JSON.parse(JSON.stringify(schema[key].default))
      } else {
        defaultConfig[key] = Array.isArray(schema[key].default)
          ? [...schema[key].default]
          : schema[key].default
      }
    })

    setInitialConfig(cloneConfig(defaultConfig))
    dispatch({ type: 'RESET', payload: defaultConfig })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [])

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  const isDirty = useMemo(() => !deepEqual(history.present, initialConfig), [history.present, initialConfig])

  return {
    config: history.present,
    updateConfig,
    resetConfig,
    setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty
  }
}

