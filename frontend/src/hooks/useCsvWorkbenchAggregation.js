import { useCallback, useState } from 'react'
import Papa from 'papaparse'

/**
 * Hook für Quick Aggregation im CSV Workbench
 * Verwaltet schnelle Aggregationen ohne Transformations-Pipeline
 */
export const useCsvWorkbenchAggregation = ({
  getImportState,
  transformedRows,
  schedulePersist,
  registerVersionEvent
}) => {
  const [quickAggregationConfig, setQuickAggregationConfig] = useState(() => ({
    scope: 'raw',
    valueColumns: [],
    groupBy: '',
    operations: ['sum', 'average']
  }))
  const [quickAggregationResult, setQuickAggregationResult] = useState(null)

  const handleQuickAggregationConfigChange = useCallback(
    (changes) => {
      if (!changes || typeof changes !== 'object') {
        return
      }
      setQuickAggregationConfig((prev) => {
        const next = { ...prev, ...changes }
        if (!Array.isArray(next.operations) || next.operations.length === 0) {
          next.operations = ['sum']
        }
        schedulePersist({ quickAggregationConfig: next })
        return next
      })
    },
    [schedulePersist]
  )

  const runQuickAggregation = useCallback(() => {
    const state = getImportState()
    const rawRows = Array.isArray(state?.rows) ? state.rows : []
    const sourceRows = quickAggregationConfig.scope === 'transformed' ? transformedRows || [] : rawRows
    const valueColumns = Array.isArray(quickAggregationConfig.valueColumns)
      ? quickAggregationConfig.valueColumns.filter((key) => typeof key === 'string' && key)
      : []
    const operations = Array.isArray(quickAggregationConfig.operations) && quickAggregationConfig.operations.length > 0
      ? quickAggregationConfig.operations.filter((op) => ['sum', 'average', 'min', 'max', 'count'].includes(op))
      : ['sum']

    if (sourceRows.length === 0 || valueColumns.length === 0) {
      setQuickAggregationResult({ type: 'empty', scope: quickAggregationConfig.scope, rows: [], columns: [] })
      return { computed: false, reason: 'Keine Daten oder Zielspalten ausgewählt.' }
    }

    const ensureAccumulator = (container, columnKey) => {
      if (!container[columnKey]) {
        container[columnKey] = {
          sum: 0,
          count: 0,
          min: Number.POSITIVE_INFINITY,
          max: Number.NEGATIVE_INFINITY
        }
      }
      return container[columnKey]
    }

    const applyValue = (acc, rawValue) => {
      if (rawValue === null || rawValue === undefined) {
        return
      }
      const text = typeof rawValue === 'string' ? rawValue.trim() : rawValue
      if (text === '') {
        return
      }
      const numeric = typeof text === 'number' ? text : Number(String(text).replace(',', '.'))
      if (!Number.isFinite(numeric)) {
        return
      }
      acc.sum += numeric
      acc.count += 1
      if (numeric < acc.min) acc.min = numeric
      if (numeric > acc.max) acc.max = numeric
    }

    const groupByKey = typeof quickAggregationConfig.groupBy === 'string' && quickAggregationConfig.groupBy.trim()
      ? quickAggregationConfig.groupBy.trim()
      : ''

    const operationLabelMap = {
      sum: 'Summe',
      average: 'Durchschnitt',
      min: 'Minimum',
      max: 'Maximum',
      count: 'Anzahl'
    }

    if (groupByKey) {
      const groups = new Map()
      sourceRows.forEach((row) => {
        const rawGroup = row?.[groupByKey]
        const key = rawGroup === null || rawGroup === undefined || rawGroup === '' ? '(leer)' : String(rawGroup)
        if (!groups.has(key)) {
          groups.set(key, { label: rawGroup, counters: {} })
        }
        const entry = groups.get(key)
        valueColumns.forEach((columnKey) => {
          const accumulator = ensureAccumulator(entry.counters, columnKey)
          applyValue(accumulator, row?.[columnKey])
        })
      })

      const headers = [groupByKey]
      valueColumns.forEach((columnKey) => {
        operations.forEach((operation) => {
          const label = `${columnKey} (${operationLabelMap[operation] || operation})`
          headers.push(label)
        })
      })

      const rows = Array.from(groups.entries()).map(([key, entry]) => {
        const cells = [key]
        valueColumns.forEach((columnKey) => {
          const accumulator = entry.counters[columnKey] || { sum: 0, count: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
          operations.forEach((operation) => {
            let value = ''
            if (operation === 'sum') {
              value = accumulator.sum
            } else if (operation === 'average') {
              value = accumulator.count > 0 ? accumulator.sum / accumulator.count : ''
            } else if (operation === 'min') {
              value = accumulator.count > 0 ? accumulator.min : ''
            } else if (operation === 'max') {
              value = accumulator.count > 0 ? accumulator.max : ''
            } else if (operation === 'count') {
              value = accumulator.count
            }
            cells.push(value)
          })
        })
        return cells
      })

      setQuickAggregationResult({
        type: 'grouped',
        scope: quickAggregationConfig.scope,
        groupBy: groupByKey,
        columns: headers,
        rows,
        operations,
        valueColumns,
        totalRows: sourceRows.length
      })
      registerVersionEvent({
        type: 'quick-aggregation',
        description: `Quick-Aggregation (${operations.join(', ')}) aktualisiert`,
        meta: { scope: quickAggregationConfig.scope, groupBy: groupByKey, valueColumns }
      })
      return { computed: true, rows: rows.length }
    }

    const accumulatorByColumn = {}
    sourceRows.forEach((row) => {
      valueColumns.forEach((columnKey) => {
        const accumulator = ensureAccumulator(accumulatorByColumn, columnKey)
        applyValue(accumulator, row?.[columnKey])
      })
    })

    const headers = ['Kennzahl']
    operations.forEach((operation) => {
      headers.push(operationLabelMap[operation] || operation)
    })

    const rows = valueColumns.map((columnKey) => {
      const accumulator = accumulatorByColumn[columnKey] || { sum: 0, count: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
      const cells = [columnKey]
      operations.forEach((operation) => {
        if (operation === 'sum') {
          cells.push(accumulator.sum)
        } else if (operation === 'average') {
          cells.push(accumulator.count > 0 ? accumulator.sum / accumulator.count : '')
        } else if (operation === 'min') {
          cells.push(accumulator.count > 0 ? accumulator.min : '')
        } else if (operation === 'max') {
          cells.push(accumulator.count > 0 ? accumulator.max : '')
        } else if (operation === 'count') {
          cells.push(accumulator.count)
        }
      })
      return cells
    })

    setQuickAggregationResult({
      type: 'summary',
      scope: quickAggregationConfig.scope,
      columns: headers,
      rows,
      operations,
      valueColumns,
      totalRows: sourceRows.length
    })
    registerVersionEvent({
      type: 'quick-aggregation',
      description: `Quick-Aggregation (${operations.join(', ')}) aktualisiert`,
      meta: { scope: quickAggregationConfig.scope, groupBy: groupByKey || null, valueColumns }
    })
    return { computed: true, rows: rows.length }
  }, [getImportState, quickAggregationConfig, transformedRows, registerVersionEvent])

  const handleQuickAggregationExport = useCallback(() => {
    if (!quickAggregationResult || !Array.isArray(quickAggregationResult.rows) || quickAggregationResult.rows.length === 0) {
      return { exported: false }
    }
    const data = [quickAggregationResult.columns, ...quickAggregationResult.rows]
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `aggregation-${quickAggregationResult.scope || 'raw'}-${Date.now()}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    return { exported: true }
  }, [quickAggregationResult])

  return {
    quickAggregationConfig,
    quickAggregationResult,
    handleQuickAggregationConfigChange,
    runQuickAggregation,
    handleQuickAggregationExport,
    setQuickAggregationConfig
  }
}

