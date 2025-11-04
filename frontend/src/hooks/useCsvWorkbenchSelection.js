import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { formatCellReference, formatRangeReference } from '../utils/csv/formulas'

/**
 * Hook für Cell Selection im CSV Workbench
 * Verwaltet Zell-Auswahl, Mehrfachauswahl und Tastatur-Navigation
 */
export const useCsvWorkbenchSelection = ({
  previewEntries,
  visibleColumns,
  columnIndexMap,
  getCellFormula,
  createCellTarget
}) => {
  const [selectionState, setSelectionState] = useState({ anchor: null, focus: null })
  const [isSelecting, setIsSelecting] = useState(false)
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const pendingFocusRef = useRef(null)

  useEffect(() => {
    setSelectionState((previous) => {
      if (!previous.anchor || !previous.focus) {
        return previous
      }

      const remapTarget = (target) => {
        const rowPosition = previewEntries.findIndex((entry) => entry.index === target.rowIndex)
        if (rowPosition === -1) {
          return null
        }
        const columnIndex = columnIndexMap.get(target.columnKey)
        if (columnIndex === undefined) {
          return null
        }
        if (rowPosition === target.rowPosition && columnIndex === target.columnIndex) {
          return target
        }
        return { ...target, rowPosition, columnIndex }
      }

      const anchor = remapTarget(previous.anchor)
      const focus = remapTarget(previous.focus)

      if (!anchor || !focus) {
        return { anchor: null, focus: null }
      }

      if (
        anchor === previous.anchor &&
        focus === previous.focus
      ) {
        return previous
      }

      if (
        anchor.rowPosition === previous.anchor.rowPosition &&
        anchor.columnIndex === previous.anchor.columnIndex &&
        focus.rowPosition === previous.focus.rowPosition &&
        focus.columnIndex === previous.focus.columnIndex
      ) {
        return previous
      }

      return { anchor, focus }
    })
  }, [previewEntries, columnIndexMap])

  const selectedRange = useMemo(() => {
    if (!selectionState.anchor || !selectionState.focus) {
      return null
    }
    const rowStart = Math.min(selectionState.anchor.rowPosition, selectionState.focus.rowPosition)
    const rowEnd = Math.max(selectionState.anchor.rowPosition, selectionState.focus.rowPosition)
    const columnStart = Math.min(selectionState.anchor.columnIndex, selectionState.focus.columnIndex)
    const columnEnd = Math.max(selectionState.anchor.columnIndex, selectionState.focus.columnIndex)

    if (rowStart < 0 || columnStart < 0) {
      return null
    }

    return {
      rowStart,
      rowEnd,
      columnStart,
      columnEnd
    }
  }, [selectionState])

  const selectedTargets = useMemo(() => {
    if (!selectedRange) {
      return []
    }
    const targets = []
    for (let rowPosition = selectedRange.rowStart; rowPosition <= selectedRange.rowEnd; rowPosition += 1) {
      const entry = previewEntries[rowPosition]
      if (!entry) continue
      for (let columnIndex = selectedRange.columnStart; columnIndex <= selectedRange.columnEnd; columnIndex += 1) {
        const column = visibleColumns[columnIndex]
        if (!column) continue
        targets.push({
          rowIndex: entry.index,
          rowPosition,
          columnKey: column.key,
          columnIndex
        })
      }
    }
    return targets
  }, [selectedRange, previewEntries, visibleColumns])

  const selectedCellSet = useMemo(() => {
    if (!selectedTargets || selectedTargets.length === 0) {
      return new Set()
    }
    const cellSet = new Set()
    selectedTargets.forEach((target) => {
      cellSet.add(`${target.rowIndex}::${target.columnKey}`)
    })
    return cellSet
  }, [selectedTargets])

  const hasSelection = selectedTargets.length > 0

  const activeCell = useMemo(() => selectionState.focus || selectionState.anchor, [selectionState])

  const activeCellLabel = useMemo(() => {
    if (!activeCell || !Number.isInteger(activeCell.rowIndex) || !Number.isInteger(activeCell.columnIndex)) {
      return ''
    }
    return formatCellReference(activeCell.columnIndex, activeCell.rowIndex)
  }, [activeCell])

  const selectionReference = useMemo(() => {
    if (!selectedTargets || selectedTargets.length === 0) {
      return ''
    }
    let minRow = Infinity
    let maxRow = -Infinity
    let minCol = Infinity
    let maxCol = -Infinity
    selectedTargets.forEach((target) => {
      if (Number.isInteger(target.rowIndex)) {
        minRow = Math.min(minRow, target.rowIndex)
        maxRow = Math.max(maxRow, target.rowIndex)
      }
      if (Number.isInteger(target.columnIndex)) {
        minCol = Math.min(minCol, target.columnIndex)
        maxCol = Math.max(maxCol, target.columnIndex)
      }
    })
    if (!Number.isFinite(minRow) || !Number.isFinite(maxRow) || !Number.isFinite(minCol) || !Number.isFinite(maxCol)) {
      return ''
    }
    return formatRangeReference(minCol, minRow, maxCol, maxRow)
  }, [selectedTargets])

  const getDisplayValueForCell = useCallback(
    (cell) => {
      if (!cell) {
        return ''
      }
      const formula = getCellFormula(cell.rowIndex, cell.columnKey)
      if (formula) {
        return formula
      }
      let entry = null
      if (typeof cell.rowPosition === 'number') {
        entry = previewEntries[cell.rowPosition]
      }
      if (!entry || entry.index !== cell.rowIndex) {
        entry = previewEntries.find((item) => item.index === cell.rowIndex)
      }
      const value = entry?.row?.[cell.columnKey]
      if (value === null || value === undefined) {
        return ''
      }
      return String(value)
    },
    [getCellFormula, previewEntries]
  )

  const moveSelection = useCallback(
    (deltaRow, deltaColumn, extend) => {
      setSelectionState((previous) => {
        const current = previous.focus || previous.anchor
        if (!current) {
          return previous
        }

        const nextRowPosition = Math.max(
          0,
          Math.min(previewEntries.length - 1, current.rowPosition + deltaRow)
        )
        const nextColumnIndex = Math.max(
          0,
          Math.min(visibleColumns.length - 1, current.columnIndex + deltaColumn)
        )

        const entry = previewEntries[nextRowPosition]
        const column = visibleColumns[nextColumnIndex]
        if (!entry || !column) {
          return previous
        }

        const nextTarget = {
          rowIndex: entry.index,
          rowPosition: nextRowPosition,
          columnKey: column.key,
          columnIndex: nextColumnIndex
        }

        pendingFocusRef.current = nextTarget

        if (
          previous.focus &&
          previous.focus.rowIndex === nextTarget.rowIndex &&
          previous.focus.columnKey === nextTarget.columnKey &&
          previous.focus.rowPosition === nextTarget.rowPosition &&
          previous.focus.columnIndex === nextTarget.columnIndex &&
          extend
        ) {
          return previous
        }

        const anchor = extend && previous.anchor ? previous.anchor : nextTarget
        return { anchor, focus: nextTarget }
      })
    },
    [previewEntries, visibleColumns]
  )

  const handleCellMouseDown = useCallback(
    (event, entry, rowPosition, columnKey) => {
      const target = createCellTarget(entry.index, rowPosition, columnKey)
      pendingFocusRef.current = target
      setIsSelecting(true)
      setSelectionState((previous) => {
        const extend = Boolean(event.shiftKey && previous.anchor)
        const anchor = extend && previous.anchor ? previous.anchor : target
        if (
          previous.focus &&
          previous.focus.rowIndex === target.rowIndex &&
          previous.focus.columnKey === target.columnKey &&
          previous.focus.rowPosition === target.rowPosition &&
          previous.focus.columnIndex === target.columnIndex &&
          anchor === previous.anchor
        ) {
          return previous
        }
        return { anchor, focus: target }
      })
    },
    [createCellTarget]
  )

  const handleCellMouseEnter = useCallback(
    (entry, rowPosition, columnKey) => {
      if (!isSelecting) return
      const target = createCellTarget(entry.index, rowPosition, columnKey)
      setSelectionState((previous) => {
        if (!previous.anchor) {
          return previous
        }
        if (
          previous.focus &&
          previous.focus.rowIndex === target.rowIndex &&
          previous.focus.columnKey === target.columnKey &&
          previous.focus.rowPosition === target.rowPosition &&
          previous.focus.columnIndex === target.columnIndex
        ) {
          return previous
        }
        return { anchor: previous.anchor, focus: target }
      })
    },
    [isSelecting, createCellTarget]
  )

  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false)
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return {
    selectionState,
    setSelectionState,
    isSelecting,
    setIsSelecting,
    editingCell,
    setEditingCell,
    editingValue,
    setEditingValue,
    pendingFocusRef,
    selectedRange,
    selectedTargets,
    selectedCellSet,
    hasSelection,
    activeCell,
    activeCellLabel,
    selectionReference,
    getDisplayValueForCell,
    moveSelection,
    handleCellMouseDown,
    handleCellMouseEnter
  }
}

