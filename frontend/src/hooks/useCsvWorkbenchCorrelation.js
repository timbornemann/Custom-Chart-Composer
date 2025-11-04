import { useMemo, useCallback, useEffect, useState } from 'react'

/**
 * Hook für Correlation Matrix im CSV Workbench
 * Verwaltet Korrelationsmatrix-Anzeige und -Interaktionen
 */
export const useCsvWorkbenchCorrelation = ({ profilingMeta }) => {
  const [correlationSelectedColumns, setCorrelationSelectedColumns] = useState([])
  const [correlationThreshold, setCorrelationThreshold] = useState(0)
  const [correlationSortKey, setCorrelationSortKey] = useState('')
  const [hoveredCorrelationCell, setHoveredCorrelationCell] = useState(null)

  const correlationMatrix = profilingMeta?.correlationMatrix || null

  useEffect(() => {
    if (!correlationMatrix || !Array.isArray(correlationMatrix.columns) || correlationMatrix.columns.length === 0) {
      setCorrelationSelectedColumns([])
      setCorrelationSortKey('')
      return
    }

    const availableColumns = correlationMatrix.columns
    setCorrelationSelectedColumns((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) {
        return [...availableColumns]
      }
      const availableSet = new Set(availableColumns)
      const filtered = prev.filter((key) => availableSet.has(key))
      if (filtered.length === prev.length && filtered.length > 0) {
        return filtered
      }
      return filtered.length > 0 ? filtered : [...availableColumns]
    })
    setCorrelationSortKey((prev) => (prev && availableColumns.includes(prev) ? prev : ''))
  }, [correlationMatrix])

  const correlationDisplayIndices = useMemo(() => {
    if (!correlationMatrix || !Array.isArray(correlationMatrix.columns) || correlationMatrix.columns.length === 0) {
      return []
    }

    const availableColumns = correlationMatrix.columns
    const selectedColumns =
      Array.isArray(correlationSelectedColumns) && correlationSelectedColumns.length > 0
        ? correlationSelectedColumns.filter((key) => availableColumns.includes(key))
        : availableColumns

    if (selectedColumns.length === 0) {
      return []
    }

    const uniqueIndices = Array.from(
      new Set(selectedColumns.map((key) => availableColumns.indexOf(key)).filter((index) => index >= 0))
    )

    if (!Array.isArray(correlationMatrix.matrix) || correlationMatrix.matrix.length === 0) {
      return uniqueIndices
    }

    if (correlationSortKey && availableColumns.includes(correlationSortKey)) {
      const sortIndex = availableColumns.indexOf(correlationSortKey)
      uniqueIndices.sort((a, b) => {
        const valueA = correlationMatrix.matrix?.[a]?.[sortIndex] ?? null
        const valueB = correlationMatrix.matrix?.[b]?.[sortIndex] ?? null
        const absA = valueA === null ? -1 : Math.abs(valueA)
        const absB = valueB === null ? -1 : Math.abs(valueB)
        if (absA === absB) {
          return availableColumns[a].localeCompare(availableColumns[b], undefined, { sensitivity: 'base' })
        }
        return absB - absA
      })
    } else {
      uniqueIndices.sort((a, b) =>
        availableColumns[a].localeCompare(availableColumns[b], undefined, { sensitivity: 'base' })
      )
    }

    return uniqueIndices
  }, [correlationMatrix, correlationSelectedColumns, correlationSortKey])

  const correlationDisplayColumns = useMemo(() => {
    if (!correlationMatrix || !Array.isArray(correlationMatrix.columns)) {
      return []
    }
    return correlationDisplayIndices.map((index) => correlationMatrix.columns[index]).filter(Boolean)
  }, [correlationMatrix, correlationDisplayIndices])

  const hasCorrelationData = Boolean(correlationMatrix && correlationDisplayIndices.length > 0)
  const correlationAvailableColumns = correlationMatrix?.columns || []
  
  const correlationSelectionSummary = useMemo(() => {
    if (!correlationMatrix || !Array.isArray(correlationMatrix.columns) || correlationMatrix.columns.length === 0) {
      return '–'
    }
    const selectedCount = Array.isArray(correlationSelectedColumns) && correlationSelectedColumns.length > 0
      ? correlationSelectedColumns.filter((key) => correlationMatrix.columns.includes(key)).length
      : correlationMatrix.columns.length
    return `${selectedCount}/${correlationMatrix.columns.length}`
  }, [correlationMatrix, correlationSelectedColumns])

  const correlationTruncatedColumns = correlationMatrix?.truncatedColumns || []
  const correlationPairCounts = correlationMatrix?.pairCounts || []

  const handleCorrelationColumnToggle = useCallback(
    (columnKey, isSelected) => {
      setCorrelationSelectedColumns((prev) => {
        const availableSet = new Set(correlationAvailableColumns)
        if (!availableSet.has(columnKey)) {
          return prev
        }

        const previous = Array.isArray(prev) ? prev : []

        if (previous.length === 0) {
          if (isSelected) {
            return previous
          }
          return correlationAvailableColumns.filter((key) => key !== columnKey)
        }

        if (isSelected) {
          if (previous.includes(columnKey)) {
            return previous
          }
          return [...previous, columnKey]
        }

        return previous.filter((key) => key !== columnKey)
      })
    },
    [correlationAvailableColumns]
  )

  const handleCorrelationSelectionReset = useCallback(() => {
    if (!correlationAvailableColumns || correlationAvailableColumns.length === 0) {
      setCorrelationSelectedColumns([])
      return
    }
    setCorrelationSelectedColumns([...correlationAvailableColumns])
  }, [correlationAvailableColumns])

  const handleCorrelationSelectionClear = useCallback(() => {
    setCorrelationSelectedColumns([])
  }, [])

  const clampCorrelationThreshold = useCallback((value) => {
    if (!Number.isFinite(value)) {
      return 0
    }
    if (value < 0) {
      return 0
    }
    if (value > 1) {
      return 1
    }
    return value
  }, [])

  const handleCorrelationThresholdChange = useCallback(
    (nextValue) => {
      setCorrelationThreshold(clampCorrelationThreshold(nextValue))
    },
    [clampCorrelationThreshold]
  )

  const handleCorrelationThresholdInput = useCallback(
    (event) => {
      const raw = Number.parseFloat(event.target.value)
      handleCorrelationThresholdChange(Number.isNaN(raw) ? 0 : raw)
    },
    [handleCorrelationThresholdChange]
  )

  const handleCorrelationSortChange = useCallback((event) => {
    setCorrelationSortKey(event.target.value)
  }, [])

  const hoveredCorrelationRow = hoveredCorrelationCell?.row ?? null
  const hoveredCorrelationColumn = hoveredCorrelationCell?.column ?? null

  const correlationColorForValue = useCallback((value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'transparent'
    }
    const intensity = Math.min(1, Math.abs(value))
    const opacity = 0.12 + intensity * 0.35
    if (value > 0) {
      return `rgba(34, 197, 94, ${opacity})`
    }
    if (value < 0) {
      return `rgba(239, 68, 68, ${opacity})`
    }
    return 'transparent'
  }, [])

  return {
    correlationSelectedColumns,
    correlationThreshold,
    correlationSortKey,
    hoveredCorrelationCell,
    setHoveredCorrelationCell,
    correlationMatrix,
    correlationDisplayIndices,
    correlationDisplayColumns,
    hasCorrelationData,
    correlationAvailableColumns,
    correlationSelectionSummary,
    correlationTruncatedColumns,
    correlationPairCounts,
    hoveredCorrelationRow,
    hoveredCorrelationColumn,
    handleCorrelationColumnToggle,
    handleCorrelationSelectionReset,
    handleCorrelationSelectionClear,
    handleCorrelationThresholdChange,
    handleCorrelationThresholdInput,
    handleCorrelationSortChange,
    correlationColorForValue
  }
}

