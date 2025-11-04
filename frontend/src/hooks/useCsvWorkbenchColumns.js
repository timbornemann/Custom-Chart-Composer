import { useMemo, useCallback, useRef, useLayoutEffect, useState } from 'react'
import { MIN_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH, ACTION_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '../components/csv/constants'

/**
 * Hook für Column-Management im CSV Workbench
 * Verwaltet Column-Ordering, Visibility, Pinning, Sizing, etc.
 */
export const useCsvWorkbenchColumns = ({
  rawColumns,
  visibleColumns,
  columnByKey,
  previewEntries,
  transformedPreviewEntries,
  setColumnPinned,
  setColumnVisibility,
  reorderColumns,
  setColumnWidth
}) => {
  const [columnMeasurements, setColumnMeasurements] = useState({})
  const [rowMeasurements, setRowMeasurements] = useState({})
  const [headerHeight, setHeaderHeight] = useState(0)
  const [transformedHeaderHeight, setTransformedHeaderHeight] = useState(0)
  const [resizingColumn, setResizingColumn] = useState(null)
  const columnRefs = useRef(new Map())
  const rowRefs = useRef(new Map())
  const headerRef = useRef(null)
  const transformedHeaderRef = useRef(null)

  const orderedColumns = useMemo(() => {
    if (!rawColumns || rawColumns.length === 0) {
      return []
    }
    return [...rawColumns].sort((a, b) => {
      const orderA = typeof a.display?.order === 'number' ? a.display.order : 0
      const orderB = typeof b.display?.order === 'number' ? b.display.order : 0
      if (orderA === orderB) {
        return a.key.localeCompare(b.key)
      }
      return orderA - orderB
    })
  }, [rawColumns])

  const columns = orderedColumns

  const availableColumnsForModal = useMemo(
    () => columns.map((column) => ({ key: column.key, label: column.key })),
    [columns]
  )

  const hiddenColumns = useMemo(
    () => columns.filter((column) => column.display?.isVisible === false),
    [columns]
  )

  const columnIndexMap = useMemo(() => {
    const map = new Map()
    visibleColumns.forEach((column, index) => {
      map.set(column.key, index)
    })
    return map
  }, [visibleColumns])

  const registerColumnRef = useCallback((key, node) => {
    if (!key) return
    if (node) {
      columnRefs.current.set(key, node)
    } else {
      columnRefs.current.delete(key)
    }
  }, [])

  const registerRowRef = useCallback((source, index, node) => {
    const key = `${source}-${index}`
    if (node) {
      rowRefs.current.set(key, node)
    } else {
      rowRefs.current.delete(key)
    }
  }, [])

  useLayoutEffect(() => {
    const measurements = {}
    columnRefs.current.forEach((node, key) => {
      const rect = node.getBoundingClientRect()
      measurements[key] = Math.ceil(rect.width)
    })
    setColumnMeasurements((prev) => {
      let changed = false
      const next = {}
      Object.entries(measurements).forEach(([key, value]) => {
        next[key] = value
        if (prev[key] !== value) {
          changed = true
        }
      })
      Object.keys(prev).forEach((key) => {
        if (!(key in measurements)) {
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [visibleColumns, previewEntries, transformedPreviewEntries])

  useLayoutEffect(() => {
    const measurements = {}
    rowRefs.current.forEach((node, key) => {
      const rect = node.getBoundingClientRect()
      measurements[key] = Math.ceil(rect.height)
    })
    setRowMeasurements((prev) => {
      let changed = false
      const next = {}
      Object.entries(measurements).forEach(([key, value]) => {
        next[key] = value
        if (prev[key] !== value) {
          changed = true
        }
      })
      Object.keys(prev).forEach((key) => {
        if (!(key in measurements)) {
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [previewEntries, transformedPreviewEntries])

  useLayoutEffect(() => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect()
      setHeaderHeight(Math.ceil(rect.height))
    }
  }, [visibleColumns, columnMeasurements])

  useLayoutEffect(() => {
    if (transformedHeaderRef.current) {
      const rect = transformedHeaderRef.current.getBoundingClientRect()
      setTransformedHeaderHeight(Math.ceil(rect.height))
    }
  }, [visibleColumns, columnMeasurements, transformedPreviewEntries])

  const getColumnWidth = useCallback(
    (columnKey) => {
      const column = columnByKey.get(columnKey)
      if (!column) {
        return DEFAULT_COLUMN_WIDTH
      }
      if (typeof column.display?.width === 'number' && Number.isFinite(column.display.width)) {
        return Math.max(MIN_COLUMN_WIDTH, column.display.width)
      }
      return columnMeasurements[columnKey] ?? DEFAULT_COLUMN_WIDTH
    },
    [columnByKey, columnMeasurements]
  )

  const handleColumnResizeStart = useCallback(
    (columnKey, event) => {
      event.preventDefault()
      event.stopPropagation()
      const startWidth = getColumnWidth(columnKey)
      setResizingColumn({ columnKey, startX: event.clientX, startWidth })
    },
    [getColumnWidth]
  )

  const handleToggleColumnPinned = useCallback(
    (columnKey) => {
      const column = columnByKey.get(columnKey)
      const current = column?.display?.pinned
      const nextPinned = current === 'left' ? 'right' : current === 'right' ? null : 'left'
      setColumnPinned(columnKey, nextPinned)
    },
    [columnByKey, setColumnPinned]
  )

  const handleHideColumn = useCallback(
    (columnKey) => {
      setColumnVisibility(columnKey, false)
    },
    [setColumnVisibility]
  )

  const handleShowColumn = useCallback(
    (columnKey) => {
      setColumnVisibility(columnKey, true)
    },
    [setColumnVisibility]
  )

  const pinnedLeftOffsets = useMemo(() => {
    let offset = ACTION_COLUMN_WIDTH
    const offsets = new Map()
    visibleColumns.forEach((column) => {
      if (column.display?.pinned === 'left') {
        offsets.set(column.key, offset)
        offset += getColumnWidth(column.key)
      }
    })
    return offsets
  }, [visibleColumns, getColumnWidth])

  const pinnedRightOffsets = useMemo(() => {
    let offset = 0
    const offsets = new Map()
    const reversed = [...visibleColumns].reverse()
    reversed.forEach((column) => {
      if (column.display?.pinned === 'right') {
        offsets.set(column.key, offset)
        offset += getColumnWidth(column.key)
      }
    })
    return offsets
  }, [visibleColumns, getColumnWidth])

  return {
    columns,
    orderedColumns,
    availableColumnsForModal,
    hiddenColumns,
    columnIndexMap,
    columnMeasurements,
    rowMeasurements,
    headerHeight,
    transformedHeaderHeight,
    resizingColumn,
    setResizingColumn,
    columnRefs,
    rowRefs,
    headerRef,
    transformedHeaderRef,
    registerColumnRef,
    registerRowRef,
    getColumnWidth,
    handleColumnResizeStart,
    handleToggleColumnPinned,
    handleHideColumn,
    handleShowColumn,
    pinnedLeftOffsets,
    pinnedRightOffsets
  }
}

