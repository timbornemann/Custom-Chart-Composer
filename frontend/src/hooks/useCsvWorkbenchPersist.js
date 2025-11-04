import { useCallback } from 'react'

/**
 * Hook für Persistence-Logik im CSV Workbench
 * Verwaltet das Speichern von State-Änderungen und stellt Wrapper-Callbacks bereit
 */
export const useCsvWorkbenchPersist = ({
  onImportStateChange,
  getImportState,
  savedViews,
  activeSavedViewId,
  validationRules,
  quickAggregationConfig,
  internalReorderColumns,
  internalSetColumnWidth,
  internalSetColumnVisibility,
  internalSetColumnPinned,
  internalSetRowHidden,
  internalSetRowPinned,
  internalUpdateCell,
  internalUpdateCellValue,
  internalSetDuplicateKeyColumns,
  internalResolveDuplicates,
  internalUndoLastManualEdit,
  internalRedoLastManualEdit,
  internalParseFile,
  internalUpdateMapping,
  internalUpdateTransformations,
  internalToggleValueColumn
}) => {
  const schedulePersist = useCallback(
    (extraState = {}) => {
      if (!onImportStateChange) return
      // Use queueMicrotask instead of setTimeout for better timing
      queueMicrotask(() => {
        const state = getImportState()
        onImportStateChange({
          ...state,
          ...extraState,
          savedViews,
          activeSavedViewId,
          validationRules,
          quickAggregationConfig,
          stateVersion: Date.now()
        })
      })
    },
    [
      onImportStateChange,
      getImportState,
      savedViews,
      activeSavedViewId,
      validationRules,
      quickAggregationConfig
    ]
  )

  const reorderColumns = useCallback(
    (orderedKeys) => {
      internalReorderColumns(orderedKeys)
      schedulePersist()
    },
    [internalReorderColumns, schedulePersist]
  )

  const setColumnWidth = useCallback(
    (columnKey, width) => {
      internalSetColumnWidth(columnKey, width)
      schedulePersist()
    },
    [internalSetColumnWidth, schedulePersist]
  )

  const setColumnVisibility = useCallback(
    (columnKey, isVisible) => {
      internalSetColumnVisibility(columnKey, isVisible)
      schedulePersist()
    },
    [internalSetColumnVisibility, schedulePersist]
  )

  const setColumnPinned = useCallback(
    (columnKey, pinned) => {
      internalSetColumnPinned(columnKey, pinned)
      schedulePersist()
    },
    [internalSetColumnPinned, schedulePersist]
  )

  const setRowHidden = useCallback(
    (source, rowIndex, hidden) => {
      internalSetRowHidden(source, rowIndex, hidden)
      schedulePersist()
    },
    [internalSetRowHidden, schedulePersist]
  )

  const setRowPinned = useCallback(
    (source, rowIndex, pinned) => {
      internalSetRowPinned(source, rowIndex, pinned)
      schedulePersist()
    },
    [internalSetRowPinned, schedulePersist]
  )

  const updateCell = useCallback(
    (config, columnKey, value) => {
      internalUpdateCell(config, columnKey, value)
      schedulePersist()
    },
    [internalUpdateCell, schedulePersist]
  )

  const updateCellValue = useCallback(
    (rowIndex, columnKey, value, options) => {
      const changed = internalUpdateCellValue(rowIndex, columnKey, value, options)
      if (changed) {
        schedulePersist()
      }
      return changed
    },
    [internalUpdateCellValue, schedulePersist]
  )

  const setDuplicateKeyColumns = useCallback(
    (updater) => {
      internalSetDuplicateKeyColumns(updater)
      schedulePersist()
    },
    [internalSetDuplicateKeyColumns, schedulePersist]
  )

  const resolveDuplicates = useCallback(
    (mode) => {
      const result = internalResolveDuplicates(mode)
      if (result?.changed) {
        schedulePersist()
      }
      return result
    },
    [internalResolveDuplicates, schedulePersist]
  )

  const undoLastManualEdit = useCallback(() => {
    const result = internalUndoLastManualEdit()
    if (result?.undone) {
      schedulePersist()
    }
    return result
  }, [internalUndoLastManualEdit, schedulePersist])

  const redoLastManualEdit = useCallback(() => {
    const result = internalRedoLastManualEdit()
    if (result?.redone) {
      schedulePersist()
    }
    return result
  }, [internalRedoLastManualEdit, schedulePersist])

  const parseFile = useCallback(
    async (file) => {
      if (!file) return
      await internalParseFile(file)
      schedulePersist()
    },
    [internalParseFile, schedulePersist]
  )

  const updateMapping = useCallback(
    (changes) => {
      internalUpdateMapping(changes)
      schedulePersist()
    },
    [internalUpdateMapping, schedulePersist]
  )

  const updateTransformations = useCallback(
    (updater) => {
      internalUpdateTransformations(updater)
      schedulePersist()
    },
    [internalUpdateTransformations, schedulePersist]
  )

  const toggleValueColumn = useCallback(
    (columnKey) => {
      internalToggleValueColumn(columnKey)
      schedulePersist()
    },
    [internalToggleValueColumn, schedulePersist]
  )

  return {
    schedulePersist,
    reorderColumns,
    setColumnWidth,
    setColumnVisibility,
    setColumnPinned,
    setRowHidden,
    setRowPinned,
    updateCell,
    updateCellValue,
    setDuplicateKeyColumns,
    resolveDuplicates,
    undoLastManualEdit,
    redoLastManualEdit,
    parseFile,
    updateMapping,
    updateTransformations,
    toggleValueColumn
  }
}

