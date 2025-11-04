import { useCallback, useEffect, useState } from 'react'

/**
 * Hook für Duplicate Detection im CSV Workbench
 * Verwaltet Duplikat-Erkennung und -Bereinigung
 */
export const useCsvWorkbenchDuplicates = ({
  duplicateKeyColumns,
  duplicateInfo,
  setDuplicateKeyColumns,
  resolveDuplicates,
  columns
}) => {
  const [duplicateActionFeedback, setDuplicateActionFeedback] = useState(null)

  const duplicateGroups = duplicateInfo?.groups ?? []
  const duplicateRowCount = duplicateInfo?.flaggedIndices?.length ?? 0
  const duplicateMetaByIndex = duplicateInfo?.indexToGroup ?? new Map()
  const hasDuplicateSelection = duplicateKeyColumns.length > 0
  const hasDuplicates = duplicateGroups.length > 0

  useEffect(() => {
    setDuplicateActionFeedback(null)
  }, [duplicateKeyColumns, duplicateGroups.length])

  const handleDuplicateColumnToggle = useCallback(
    (columnKey, enabled) => {
      setDuplicateKeyColumns((previous) => {
        const current = Array.isArray(previous) ? previous : []
        if (enabled) {
          if (current.includes(columnKey)) {
            return current
          }
          return [...current, columnKey]
        }
        return current.filter((key) => key !== columnKey)
      })
    },
    [setDuplicateKeyColumns]
  )

  const handleDuplicateClear = useCallback(() => {
    setDuplicateKeyColumns([])
  }, [setDuplicateKeyColumns])

  const handleDuplicateSelectAll = useCallback(() => {
    setDuplicateKeyColumns(columns.map((column) => column.key))
  }, [setDuplicateKeyColumns, columns])

  const handleResolveDuplicatesAction = useCallback(
    (mode) => {
      const result = resolveDuplicates(mode)
      if (!result) {
        setDuplicateActionFeedback({ type: 'info', message: 'Keine Duplikate zum Bearbeiten gefunden.' })
        return
      }
      if (result.changed) {
        const parts = []
        if (result.removed > 0) {
          parts.push(
            `${result.removed} ${result.removed === 1 ? 'Zeile entfernt' : 'Zeilen entfernt'}`
          )
        }
        if (result.mode === 'merge' && result.mergedCells > 0) {
          parts.push(
            `${result.mergedCells} ${result.mergedCells === 1 ? 'Wert übernommen' : 'Werte übernommen'}`
          )
        }
        if (parts.length === 0) {
          parts.push('Keine Anpassungen erforderlich')
        }
        setDuplicateActionFeedback({
          type: 'success',
          message: `Duplikatbereinigung abgeschlossen (${parts.join(', ')}).`
        })
      } else {
        setDuplicateActionFeedback({ type: 'info', message: 'Keine Änderungen notwendig.' })
      }
    },
    [resolveDuplicates]
  )

  return {
    duplicateGroups,
    duplicateRowCount,
    duplicateMetaByIndex,
    hasDuplicateSelection,
    hasDuplicates,
    duplicateActionFeedback,
    handleDuplicateColumnToggle,
    handleDuplicateClear,
    handleDuplicateSelectAll,
    handleResolveDuplicatesAction
  }
}

