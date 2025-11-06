import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Papa from 'papaparse'
import { arrayMove } from '@dnd-kit/sortable'
import useDataImport from '../hooks/useDataImport'
import { useCsvWorkbenchColumns } from '../hooks/useCsvWorkbenchColumns'
import CsvToolbar from './csv-workbench/CsvToolbar'
import CsvTable from './csv-workbench/CsvTable'
import CsvMappingPanel from './csv-workbench/CsvMappingPanel'
import CsvTransformPanelFull from './csv-workbench/CsvTransformPanelFull'
import CsvProfilingPanel from './csv-workbench/CsvProfilingPanel'
import CsvToolsPanel from './csv-workbench/CsvToolsPanel'
import CsvFindReplaceModal from './CsvFindReplaceModal'
import { createSearchConfig, rowMatchesQuery } from '../hooks/useDataImport'
import { applyReplacementToText, formatCellValue, isCellValueEmpty } from './csv/formatting'
import { createUniqueId } from './csv/utils'
import { DEFAULT_ROW_HEIGHT } from './csv/constants'

/**
 * CSV Workbench - Redesigned für bessere Übersichtlichkeit
 * 
 * Neues 3-Panel Layout:
 * - Links: Mapping & Transformationen
 * - Mitte: Tabelle (Hauptfokus)
 * - Rechts: Tools (Search, Duplikate, Validation)
 */
export default function CsvWorkbench({
  onApplyToChart,
  onImportStateChange,
  onResetWorkbench,
  allowMultipleValueColumns = true,
  requireDatasets = false,
  initialData = null,
  chartType = null,
  isScatterBubble = false,
  isCoordinate = false
}) {
  // ==========================================================================
  // BASE DATA IMPORT HOOK
  // ==========================================================================
  const {
    fileName,
    rows: originalRows,
    columns: rawColumns,
    mapping,
    transformations,
    updateMapping: internalUpdateMapping,
    updateTransformations: internalUpdateTransformations,
    toggleValueColumn: internalToggleValueColumn,
    reorderColumns: internalReorderColumns,
    setColumnWidth: internalSetColumnWidth,
    setColumnVisibility: internalSetColumnVisibility,
    setColumnPinned: internalSetColumnPinned,
    rowDisplay,
    setRowHidden: internalSetRowHidden,
    setRowPinned: internalSetRowPinned,
    parseFile: internalParseFile,
    reset,
    totalRows,
    transformedRowCount,
    transformationWarnings,
    transformationMeta,
    isLoading,
    parseError,
    validationErrors,
    warnings,
    previewLimit,
    setPreviewLimit,
    getImportResult,
    getImportState,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    searchColumns,
    setSearchColumns,
    searchError,
    sortConfig,
    setSortConfig,
    previewEntries,
    filteredRowCount,
    transformedPreviewEntries,
    transformedFilteredRowCount,
    transformedRows,
    updateCell: internalUpdateCell,
    updateCellValue: internalUpdateCellValue,
    profilingMeta,
    duplicateKeyColumns,
    setDuplicateKeyColumns: internalSetDuplicateKeyColumns,
    duplicateInfo,
    resolveDuplicates: internalResolveDuplicates,
    manualEdits,
    canUndoManualEdit,
    canRedoManualEdit,
    undoLastManualEdit: internalUndoLastManualEdit,
    redoLastManualEdit: internalRedoLastManualEdit,
    versionTimeline,
    activeVersionId,
    setActiveVersionId: internalSetActiveVersionId,
    registerVersionEvent: internalRegisterVersionEvent,
    formulaErrors,
    setCellFormula: internalSetCellFormula,
    clearCellFormula: internalClearCellFormula,
    getCellFormula: internalGetCellFormula
  } = useDataImport({ allowMultipleValueColumns, requireDatasets, initialData, chartType, isScatterBubble, isCoordinate })

  // ==========================================================================
  // LOCAL UI STATE
  // ==========================================================================
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(320) // w-80 = 320px
  const [rightPanelWidth, setRightPanelWidth] = useState(320)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const [dataScope, setDataScope] = useState('transformed') // 'raw' or 'transformed'
  const [rowsPerPage, setRowsPerPage] = useState('50')
  const [showLargeDatasetWarning, setShowLargeDatasetWarning] = useState(false)
  const [activeLeftTab, setActiveLeftTab] = useState('mapping')
  const [activeRightTab, setActiveRightTab] = useState('search')
  const [showSearch, setShowSearch] = useState(false)
  const [showMappingHelper, setShowMappingHelper] = useState(true)
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [selectionState, setSelectionState] = useState({ anchor: null, focus: null })
  const [isSelecting, setIsSelecting] = useState(false)
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false)
  const [findReplaceData, setFindReplaceData] = useState({ raw: { matches: [], total: 0 }, transformed: { matches: [], total: 0 } })
  const [findReplaceDefaultScope, setFindReplaceDefaultScope] = useState('raw')
  const [chartPreviewHighlight, setChartPreviewHighlight] = useState(null)
  const [activeSearchMatchIndex, setActiveSearchMatchIndex] = useState(-1)
  const [duplicateActionFeedback, setDuplicateActionFeedback] = useState(null)
  const [validationRules, setValidationRules] = useState(() => [])
  const [validationComputed, setValidationComputed] = useState({ issues: [], summary: [] })
  const [quickAggregationConfig, setQuickAggregationConfig] = useState(() => ({
    scope: 'raw',
    valueColumns: [],
    groupBy: '',
    operations: ['sum', 'average']
  }))
  const [quickAggregationResult, setQuickAggregationResult] = useState(null)
  const [savedViews, setSavedViews] = useState(() => [])
  const [activeSavedViewId, setActiveSavedViewId] = useState(null)
  const [savedViewDraftName, setSavedViewDraftName] = useState('')

  const pendingFocusRef = useRef(null)
  const searchMatchSignatureRef = useRef('')
  const findReplaceHistoryRef = useRef([])
  const isInitialMountRef = useRef(true)
  const schedulePersistRef = useRef(null)

  // Load saved state from initialData
  useEffect(() => {
    if (!initialData) return
    // Set flag to prevent persistence during initial load
    isInitialMountRef.current = true
    
    if (Array.isArray(initialData.savedViews)) {
      setSavedViews(initialData.savedViews)
      const activeView = initialData.savedViews.find((view) => view.id === initialData.activeSavedViewId)
      setSavedViewDraftName(activeView ? activeView.name || '' : '')
    }
    if (Object.prototype.hasOwnProperty.call(initialData, 'activeSavedViewId')) {
      setActiveSavedViewId(initialData.activeSavedViewId || null)
    }
    if (Array.isArray(initialData.validationRules)) {
      setValidationRules(initialData.validationRules)
    }
    if (initialData.quickAggregationConfig && typeof initialData.quickAggregationConfig === 'object') {
      setQuickAggregationConfig((prev) => ({
        scope: initialData.quickAggregationConfig.scope === 'transformed' ? 'transformed' : 'raw',
        valueColumns: Array.isArray(initialData.quickAggregationConfig.valueColumns)
          ? initialData.quickAggregationConfig.valueColumns
          : prev.valueColumns,
        groupBy: typeof initialData.quickAggregationConfig.groupBy === 'string'
          ? initialData.quickAggregationConfig.groupBy
          : prev.groupBy,
        operations: Array.isArray(initialData.quickAggregationConfig.operations) && initialData.quickAggregationConfig.operations.length > 0
          ? initialData.quickAggregationConfig.operations
          : prev.operations
      }))
    }
    // Load UI state (panels, scope, pagination)
    if (initialData.uiState && typeof initialData.uiState === 'object') {
      if (typeof initialData.uiState.leftPanelOpen === 'boolean') {
        setLeftPanelOpen(initialData.uiState.leftPanelOpen)
      }
      if (typeof initialData.uiState.rightPanelOpen === 'boolean') {
        setRightPanelOpen(initialData.uiState.rightPanelOpen)
      }
      if (typeof initialData.uiState.leftPanelWidth === 'number' && initialData.uiState.leftPanelWidth >= 200) {
        setLeftPanelWidth(initialData.uiState.leftPanelWidth)
      }
      if (typeof initialData.uiState.rightPanelWidth === 'number' && initialData.uiState.rightPanelWidth >= 200) {
        setRightPanelWidth(initialData.uiState.rightPanelWidth)
      }
      if (initialData.uiState.dataScope === 'raw' || initialData.uiState.dataScope === 'transformed') {
        setDataScope(initialData.uiState.dataScope)
      }
      if (typeof initialData.uiState.rowsPerPage === 'string') {
        setRowsPerPage(initialData.uiState.rowsPerPage)
      }
      if (typeof initialData.uiState.activeLeftTab === 'string') {
        setActiveLeftTab(initialData.uiState.activeLeftTab)
      }
      if (typeof initialData.uiState.activeRightTab === 'string') {
        setActiveRightTab(initialData.uiState.activeRightTab)
      }
    }
    
    // Reset flag after a short delay to allow state to settle
    setTimeout(() => {
      isInitialMountRef.current = false
    }, 100)
  }, [initialData])

  // ==========================================================================
  // PANEL RESIZE HANDLERS
  // ==========================================================================
  useEffect(() => {
    if (!isResizingLeft && !isResizingRight) return

    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = Math.max(200, Math.min(800, e.clientX))
        setLeftPanelWidth(newWidth)
      }
      if (isResizingRight) {
        // For right panel, calculate from right edge
        const rightEdge = window.innerWidth - e.clientX
        const newWidth = Math.max(200, Math.min(800, rightEdge))
        setRightPanelWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
      setIsResizingRight(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingLeft, isResizingRight])

  // ==========================================================================
  // PAGINATION & SCOPE HANDLERS
  // ==========================================================================
  useEffect(() => {
    // Update previewLimit in useDataImport when rowsPerPage changes
    if (typeof setPreviewLimit === 'function') {
      setPreviewLimit(rowsPerPage === 'all' ? 'all' : Number(rowsPerPage) || 50)
    }
  }, [rowsPerPage, setPreviewLimit])

  useEffect(() => {
    // Show warning for large datasets when "all" is selected
    if (rowsPerPage === 'all' && totalRows > 1000) {
      setShowLargeDatasetWarning(true)
    } else {
      setShowLargeDatasetWarning(false)
    }
  }, [rowsPerPage, totalRows])

  const registerVersionEvent = useCallback(
    (event) => {
      if (typeof internalRegisterVersionEvent === 'function') {
        internalRegisterVersionEvent(event)
      }
    },
    [internalRegisterVersionEvent]
  )

  // ==========================================================================
  // PERSISTENCE LAYER
  // ==========================================================================
  const schedulePersist = useCallback(
    (extraState = {}) => {
      if (!onImportStateChange) return
      queueMicrotask(() => {
        const state = getImportState()
        onImportStateChange({
          ...state,
          ...extraState,
          savedViews,
          activeSavedViewId,
          validationRules,
          quickAggregationConfig,
          uiState: {
            leftPanelOpen,
            rightPanelOpen,
            leftPanelWidth,
            rightPanelWidth,
            dataScope,
            rowsPerPage,
            activeLeftTab,
            activeRightTab
          },
          stateVersion: Date.now()
        })
      })
    },
    [onImportStateChange, getImportState, savedViews, activeSavedViewId, validationRules, quickAggregationConfig, leftPanelOpen, rightPanelOpen, leftPanelWidth, rightPanelWidth, dataScope, rowsPerPage, activeLeftTab, activeRightTab]
  )

  // Keep schedulePersist ref up to date
  useEffect(() => {
    schedulePersistRef.current = schedulePersist
  }, [schedulePersist])

  // ==========================================================================
  // UI STATE PERSISTENCE
  // ==========================================================================
  useEffect(() => {
    // Skip on initial mount to avoid triggering on load
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }

    // Persist UI state changes (debounced)
    const timeoutId = setTimeout(() => {
      if (schedulePersistRef.current) {
        schedulePersistRef.current()
      }
    }, 300)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftPanelOpen, rightPanelOpen, leftPanelWidth, rightPanelWidth, dataScope, rowsPerPage, activeLeftTab, activeRightTab])

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
      if (changed) schedulePersist()
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
      if (result?.changed) schedulePersist()
      return result
    },
    [internalResolveDuplicates, schedulePersist]
  )

  const undoLastManualEdit = useCallback(() => {
    const result = internalUndoLastManualEdit()
    if (result?.undone) schedulePersist()
    return result
  }, [internalUndoLastManualEdit, schedulePersist])

  const redoLastManualEdit = useCallback(() => {
    const result = internalRedoLastManualEdit()
    if (result?.redone) schedulePersist()
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

  // ==========================================================================
  // COLUMN MANAGEMENT HOOK
  // ==========================================================================
  const columnsHook = useCsvWorkbenchColumns({
    rawColumns,
    previewEntries,
    transformedPreviewEntries,
    setColumnPinned,
    setColumnVisibility,
    reorderColumns,
    setColumnWidth
  })

  const {
    columns,
    visibleColumns: baseVisibleColumns,
    hiddenColumns,
    columnByKey,
    columnIndexMap,
    columnMeasurements,
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
  } = columnsHook

  // Create dynamic columns for grouped view or use base columns
  const visibleColumns = useMemo(() => {
    // In raw scope, always use base columns
    if (dataScope !== 'transformed') {
      return baseVisibleColumns
    }

    // Check if grouping is active
    const groupingCols = transformationMeta?.groupingColumns || []
    const hasGrouping = groupingCols.length > 0 && transformations?.grouping?.enabled
    
    if (!hasGrouping) {
      return baseVisibleColumns
    }

    // Create new columns for grouped view
    const aggregationsConfig = transformations?.aggregations || {}
    // Use aggregations.valueColumns if available, otherwise fall back to mapping.valueColumns
    const valueCols = Array.isArray(aggregationsConfig?.valueColumns) && aggregationsConfig.valueColumns.length > 0
      ? aggregationsConfig.valueColumns
      : (mapping?.valueColumns || [])
    const datasetCol = mapping?.datasetLabel
    const operationLabelMap = {
      sum: 'Summe',
      average: 'Durchschnitt',
      min: 'Minimum',
      max: 'Maximum',
      count: 'Anzahl',
      countRows: 'Anzahl Datenpunkte',
      countValid: 'Anzahl (nach Kriterien)',
      median: 'Median',
      stdDev: 'Standardabweichung',
      variance: 'Varianz',
      product: 'Produkt',
      first: 'Erster Wert',
      last: 'Letzter Wert'
    }

    const newColumns = []
    
    // 1. Add grouping columns first
    groupingCols.forEach((colKey, index) => {
      const originalCol = columnByKey.get(colKey)
      if (originalCol) {
        newColumns.push({
          ...originalCol,
          key: colKey,
          display: {
            ...originalCol.display,
            order: index
          },
          isGroupingColumn: true
        })
      } else {
        // Create new column if it doesn't exist in base columns
        const transformedRows = transformedPreviewEntries?.map(e => e.row) || []
        const sampleValue = transformedRows[0]?.[colKey]
        const isNumeric = typeof sampleValue === 'number' || (!isNaN(parseFloat(sampleValue)) && isFinite(sampleValue))
        newColumns.push({
          key: colKey,
          type: isNumeric ? 'number' : 'text',
          display: {
            order: index,
            width: null,
            isVisible: true,
            pinned: null
          },
          isGroupingColumn: true
        })
      }
    })

    // 2. Add aggregated value columns with descriptive names
    valueCols.forEach((colKey, index) => {
      const operation = aggregationsConfig?.perColumn?.[colKey] || aggregationsConfig?.defaultOperation || 'sum'
      const operationLabel = operationLabelMap[operation] || operation
      const originalCol = columnByKey.get(colKey)
      const baseType = originalCol?.type || 'number'
      
      // Create new column name based on aggregation
      const newColumnKey = `${colKey}_${operation}`
      const newColumnName = `${colKey} (${operationLabel})`
      
      newColumns.push({
        key: newColumnKey,
        originalKey: colKey,
        displayName: newColumnName,
        type: baseType,
        display: {
          order: groupingCols.length + index,
          width: null,
          isVisible: true,
          pinned: null
        },
        isAggregatedValue: true,
        aggregationOperation: operation
      })
    })

    // 3. Add dataset column if present
    if (datasetCol) {
      const originalCol = columnByKey.get(datasetCol)
      if (originalCol) {
        newColumns.push({
          ...originalCol,
          key: datasetCol,
          display: {
            ...originalCol.display,
            order: groupingCols.length + valueCols.length
          }
        })
      }
    }

    return newColumns
  }, [baseVisibleColumns, dataScope, transformationMeta, mapping, transformations, columnByKey, transformedPreviewEntries])

  // ==========================================================================
  // SEARCH & FIND/REPLACE
  // ==========================================================================
  const activeSearchConfig = useMemo(
    () => createSearchConfig({ query: searchQuery, mode: searchMode, columns: searchColumns }),
    [searchQuery, searchMode, searchColumns]
  )

  const computeMatchesForRows = useCallback(
    (rowsSource, scopeLabel) => {
      if (!activeSearchConfig?.isActive || !Array.isArray(rowsSource)) {
        return { matches: [], total: 0 }
      }
      const columnKeys = new Set(columns.map((column) => column.key))
      const columnOrder = new Map()
      columns.forEach((column, index) => {
        columnOrder.set(column.key, index)
      })
      const matches = []
      rowsSource.forEach((row, rowIndex) => {
        if (!row) return
        const result = rowMatchesQuery(row, activeSearchConfig)
        const entries = Object.entries(result.matchesByColumn || {})
        entries.forEach(([columnKey, positions]) => {
          if (!columnKeys.has(columnKey)) return
          if (!Array.isArray(positions) || positions.length === 0) return
          const rawValue = row[columnKey]
          const formattedRaw = formatCellValue(rawValue)
          const formattedValue =
            formattedRaw === null || formattedRaw === undefined
              ? ''
              : typeof formattedRaw === 'string'
                ? formattedRaw
                : String(formattedRaw)
          matches.push({
            scope: scopeLabel,
            rowIndex,
            columnKey,
            positions,
            formattedValue,
            rawValue
          })
        })
      })
      matches.sort((a, b) => {
        if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex
        const orderA = columnOrder.has(a.columnKey) ? columnOrder.get(a.columnKey) : Number.MAX_SAFE_INTEGER
        const orderB = columnOrder.has(b.columnKey) ? columnOrder.get(b.columnKey) : Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) return orderA - orderB
        return a.columnKey.localeCompare(b.columnKey, undefined, { sensitivity: 'base' })
      })
      const total = matches.reduce((sum, entry) => sum + (entry.positions?.length || 0), 0)
      return { matches, total }
    },
    [activeSearchConfig, columns]
  )

  const transformedScopeDisabledReason = useMemo(() => {
    if (!Array.isArray(transformedRows) || transformedRows.length === 0) {
      if (totalRows === 0) return 'Keine Daten vorhanden.'
      return 'Transformationsvorschau enthält keine Zeilen.'
    }
    if (!transformationMeta) return ''
    if ((transformationMeta.filteredOut ?? 0) > 0) {
      return 'Aktive Filter verändern die Zeilenanzahl.'
    }
    if (transformedRows.length !== totalRows && totalRows > 0) {
      return 'Transformationsdaten und Originalzeilen stimmen nicht überein.'
    }
    return ''
  }, [transformationMeta, transformedRows, totalRows])

  const canReplaceInTransformed = transformedScopeDisabledReason === ''

  useEffect(() => {
    if (!isFindReplaceOpen) return
    if (!activeSearchConfig?.isActive) {
      setFindReplaceData({ raw: { matches: [], total: 0 }, transformed: { matches: [], total: 0 } })
      return
    }
    const state = getImportState()
    const rawRows = Array.isArray(state?.rows) ? state.rows : []
    const rawResult = computeMatchesForRows(rawRows, 'raw')
    const transformedResult = canReplaceInTransformed
      ? computeMatchesForRows(transformedRows || [], 'transformed')
      : { matches: [], total: 0 }
    setFindReplaceData({ raw: rawResult, transformed: transformedResult })
  }, [isFindReplaceOpen, activeSearchConfig, getImportState, computeMatchesForRows, canReplaceInTransformed, transformedRows])

  const searchMatches = useMemo(() => {
    if (!activeSearchConfig?.isActive) return []
    const columnOrder = new Map()
    visibleColumns.forEach((column, index) => {
      columnOrder.set(column.key, index)
    })
    const collectMatches = (entries, scope) => {
      if (!Array.isArray(entries) || entries.length === 0) return []
      const result = []
      entries.forEach((entry, rowPosition) => {
        const matchInfo = entry?.matchInfo || null
        if (!matchInfo) return
        Object.entries(matchInfo).forEach(([columnKey, positions]) => {
          if (!Array.isArray(positions) || positions.length === 0) return
          result.push({
            scope,
            rowIndex: entry.index,
            rowPosition,
            columnKey,
            positions,
            rowRefKey: `${scope}-${entry.index}`
          })
        })
      })
      return result
    }
    const rawMatches = collectMatches(previewEntries, 'raw')
    const transformedMatches = collectMatches(transformedPreviewEntries, 'transformed')
    const combined = [...rawMatches, ...transformedMatches]
    combined.sort((a, b) => {
      if (a.scope !== b.scope) {
        if (a.scope === 'raw') return -1
        if (b.scope === 'raw') return 1
        return a.scope.localeCompare(b.scope)
      }
      if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex
      const orderA = columnOrder.has(a.columnKey) ? columnOrder.get(a.columnKey) : Number.MAX_SAFE_INTEGER
      const orderB = columnOrder.has(b.columnKey) ? columnOrder.get(b.columnKey) : Number.MAX_SAFE_INTEGER
      if (orderA !== orderB) return orderA - orderB
      return a.columnKey.localeCompare(b.columnKey, undefined, { sensitivity: 'base' })
    })
    return combined
  }, [activeSearchConfig, previewEntries, transformedPreviewEntries, visibleColumns])

  const activeSearchMatch = activeSearchMatchIndex >= 0 ? searchMatches[activeSearchMatchIndex] : null
  const hasSearchMatches = searchMatches.length > 0
  const searchMatchSummary = hasSearchMatches && activeSearchMatchIndex >= 0
    ? `${activeSearchMatchIndex + 1}/${searchMatches.length}`
    : `0/${searchMatches.length}`

  useEffect(() => {
    if (!activeSearchConfig?.isActive) {
      searchMatchSignatureRef.current = ''
      setActiveSearchMatchIndex(-1)
      return
    }
    const columnsKey = Array.isArray(activeSearchConfig.columns) && activeSearchConfig.columns.length > 0
      ? activeSearchConfig.columns.join('|')
      : 'ALL'
    const signature = `${activeSearchConfig.mode || 'normal'}|${activeSearchConfig.query || ''}|${columnsKey}`
    if (signature !== searchMatchSignatureRef.current) {
      searchMatchSignatureRef.current = signature
      setActiveSearchMatchIndex(searchMatches.length > 0 ? 0 : -1)
      return
    }
    if (searchMatches.length === 0) {
      setActiveSearchMatchIndex(-1)
      return
    }
    setActiveSearchMatchIndex((previous) => {
      if (previous >= 0 && previous < searchMatches.length) return previous
      return 0
    })
  }, [activeSearchConfig, searchMatches.length])

  const handleSearchMatchNavigate = useCallback(
    (direction) => {
      if (!Array.isArray(searchMatches) || searchMatches.length === 0) return
      setActiveSearchMatchIndex((previous) => {
        if (previous === -1) {
          return direction >= 0 ? 0 : searchMatches.length - 1
        }
        const next = (previous + direction + searchMatches.length) % searchMatches.length
        return next
      })
    },
    [searchMatches]
  )

  const canOpenFindReplace = activeSearchConfig?.isActive && totalRows > 0

  const handleSearchModeChange = useCallback(
    (event) => {
      setSearchMode(event.target.value)
      schedulePersist()
    },
    [setSearchMode, schedulePersist]
  )

  const handleSearchColumnToggle = useCallback(
    (columnKey, enabled) => {
      setSearchColumns((previous) => {
        if (enabled) return [...previous, columnKey]
        return previous.filter((key) => key !== columnKey)
      })
      schedulePersist()
    },
    [setSearchColumns, schedulePersist]
  )

  const handleSearchColumnsReset = useCallback(() => {
    setSearchColumns([])
    schedulePersist()
  }, [setSearchColumns, schedulePersist])

  const handleOpenFindReplace = useCallback(() => {
    if (!canOpenFindReplace) return
    const scope = activeSearchMatch?.scope === 'transformed' && canReplaceInTransformed ? 'transformed' : 'raw'
    setFindReplaceDefaultScope(scope)
    setIsFindReplaceOpen(true)
  }, [canOpenFindReplace, activeSearchMatch, canReplaceInTransformed])

  const handleModalMatchFocus = useCallback(
    (match) => {
      if (!match) return
      const index = searchMatches.findIndex(
        (candidate) =>
          candidate.scope === match.scope &&
          candidate.rowIndex === match.rowIndex &&
          candidate.columnKey === match.columnKey
      )
      if (index >= 0) {
        setActiveSearchMatchIndex(index)
      }
    },
    [searchMatches]
  )

  const handleFindReplaceConfirm = useCallback(
    ({ scope, replacement }) => {
      if (!activeSearchConfig?.isActive) {
        return { applied: false, reason: 'Suchkonfiguration ist inaktiv.' }
      }
      const targetScope = scope === 'transformed' && canReplaceInTransformed ? 'transformed' : 'raw'
      const scopeMatches = targetScope === 'transformed' ? findReplaceData.transformed.matches : findReplaceData.raw.matches
      if (!Array.isArray(scopeMatches) || scopeMatches.length === 0) {
        return { applied: false, reason: 'Keine Treffer im ausgewählten Pfad.' }
      }
      const state = getImportState()
      const rawRows = Array.isArray(state?.rows) ? state.rows : []
      if (rawRows.length === 0) {
        return { applied: false, reason: 'Keine Datenzeilen vorhanden.' }
      }
      const updates = []
      scopeMatches.forEach((match) => {
        const { rowIndex, columnKey } = match
        if (rowIndex < 0 || rowIndex >= rawRows.length) return
        const formattedCurrent = match.formattedValue === null || match.formattedValue === undefined
          ? ''
          : typeof match.formattedValue === 'string'
            ? match.formattedValue
            : String(match.formattedValue)
        const nextValue = applyReplacementToText(formattedCurrent, activeSearchConfig, replacement)
        if (nextValue === formattedCurrent) return
        updates.push({ rowIndex, columnKey, value: nextValue })
      })
      if (updates.length === 0) {
        return { applied: false, reason: 'Keine ersetzbaren Werte gefunden.' }
      }
      updateCell({ type: 'set', updates })
      setIsFindReplaceOpen(false)
      registerVersionEvent({
        type: 'find-replace',
        description: `Suchen & Ersetzen: ${updates.length} Zellen angepasst`,
        meta: { scope: targetScope, updatedCells: updates.length, replacement }
      })
      return { applied: true, updatedCells: updates.length }
    },
    [activeSearchConfig, canReplaceInTransformed, findReplaceData, getImportState, updateCell, registerVersionEvent]
  )

  // ==========================================================================
  // SELECTION & EDITING
  // ==========================================================================
  const createCellTarget = useCallback(
    (rowIndex, rowPosition, columnKey) => {
      const columnIndex = columnIndexMap.get(columnKey)
      return {
        rowIndex,
        rowPosition,
        columnKey,
        columnIndex: columnIndex === undefined ? visibleColumns.findIndex((column) => column.key === columnKey) : columnIndex
      }
    },
    [columnIndexMap, visibleColumns]
  )

  useEffect(() => {
    setSelectionState((previous) => {
      if (!previous.anchor || !previous.focus) return previous
      const remapTarget = (target) => {
        const rowPosition = previewEntries.findIndex((entry) => entry.index === target.rowIndex)
        if (rowPosition === -1) return null
        const columnIndex = columnIndexMap.get(target.columnKey)
        if (columnIndex === undefined) return null
        if (rowPosition === target.rowPosition && columnIndex === target.columnIndex) return target
        return { ...target, rowPosition, columnIndex }
      }
      const anchor = remapTarget(previous.anchor)
      const focus = remapTarget(previous.focus)
      if (!anchor || !focus) return { anchor: null, focus: null }
      if (anchor === previous.anchor && focus === previous.focus) return previous
      return { anchor, focus }
    })
  }, [previewEntries, columnIndexMap])

  useEffect(() => {
    if (!activeSearchMatch || activeSearchMatch.scope !== 'raw') return
    const rowPosition = previewEntries.findIndex((entry) => entry.index === activeSearchMatch.rowIndex)
    if (rowPosition === -1) return
    const target = createCellTarget(activeSearchMatch.rowIndex, rowPosition, activeSearchMatch.columnKey)
    setSelectionState((previous) => {
      const focus = previous.focus || previous.anchor
      if (
        focus &&
        focus.rowIndex === target.rowIndex &&
        focus.columnKey === target.columnKey &&
        focus.rowPosition === target.rowPosition &&
        focus.columnIndex === target.columnIndex
      ) return previous
      return { anchor: target, focus: target }
    })
    pendingFocusRef.current = { rowIndex: target.rowIndex, columnKey: target.columnKey }
  }, [activeSearchMatch, createCellTarget, previewEntries])

  useEffect(() => {
    if (!activeSearchMatch) return
    const key = activeSearchMatch.rowRefKey || `${activeSearchMatch.scope}-${activeSearchMatch.rowIndex}`
    const node = rowRefs.current.get(key)
    if (node && typeof node.scrollIntoView === 'function') {
      try {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } catch (_error) {
        node.scrollIntoView()
      }
    }
  }, [activeSearchMatch, rowRefs])

  // F3 key navigation for search
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return
      if (event.key === 'F3') {
        if (!activeSearchConfig?.isActive) return
        event.preventDefault()
        handleSearchMatchNavigate(event.shiftKey ? -1 : 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeSearchConfig, handleSearchMatchNavigate])

  const selectedRange = useMemo(() => {
    if (!selectionState.anchor || !selectionState.focus) return null
    const rowStart = Math.min(selectionState.anchor.rowPosition, selectionState.focus.rowPosition)
    const rowEnd = Math.max(selectionState.anchor.rowPosition, selectionState.focus.rowPosition)
    const columnStart = Math.min(selectionState.anchor.columnIndex, selectionState.focus.columnIndex)
    const columnEnd = Math.max(selectionState.anchor.columnIndex, selectionState.focus.columnIndex)
    if (rowStart < 0 || columnStart < 0) return null
    return { rowStart, rowEnd, columnStart, columnEnd }
  }, [selectionState])

  const selectedTargets = useMemo(() => {
    if (!selectedRange) return []
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
    if (!selectedTargets || selectedTargets.length === 0) return new Set()
    const cellSet = new Set()
    selectedTargets.forEach((target) => {
      cellSet.add(`${target.rowIndex}::${target.columnKey}`)
    })
    return cellSet
  }, [selectedTargets])

  const hasSelection = selectedTargets.length > 0

  const moveSelection = useCallback(
    (deltaRow, deltaColumn, extend) => {
      setSelectionState((previous) => {
        const current = previous.focus || previous.anchor
        if (!current) return previous
        const nextRowPosition = Math.max(0, Math.min(previewEntries.length - 1, current.rowPosition + deltaRow))
        const nextColumnIndex = Math.max(0, Math.min(visibleColumns.length - 1, current.columnIndex + deltaColumn))
        const entry = previewEntries[nextRowPosition]
        const column = visibleColumns[nextColumnIndex]
        if (!entry || !column) return previous
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
        ) return previous
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
        ) return previous
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
        if (!previous.anchor) return previous
        if (
          previous.focus &&
          previous.focus.rowIndex === target.rowIndex &&
          previous.focus.columnKey === target.columnKey &&
          previous.focus.rowPosition === target.rowPosition &&
          previous.focus.columnIndex === target.columnIndex
        ) return previous
        return { anchor: previous.anchor, focus: target }
      })
    },
    [isSelecting, createCellTarget]
  )

  const startEditCell = useCallback(
    (entry, columnKey, rowPosition = 0) => {
      if (!entry) return
      const target = createCellTarget(entry.index, rowPosition, columnKey)
      pendingFocusRef.current = target
      setSelectionState({ anchor: target, focus: target })
      setEditingCell({ rowIndex: entry.index, columnKey })
      const currentValue = entry.row?.[columnKey]
      setEditingValue(currentValue === undefined || currentValue === null ? '' : String(currentValue))
    },
    [createCellTarget]
  )

  const cancelEdit = useCallback(() => {
    setEditingCell(null)
    setEditingValue('')
  }, [])

  const confirmEdit = useCallback(() => {
    if (!editingCell) return
    updateCellValue(editingCell.rowIndex, editingCell.columnKey, editingValue)
    cancelEdit()
  }, [editingCell, editingValue, updateCellValue, cancelEdit])

  const handleCellKeyDown = useCallback(
    (event, entry, rowPosition, columnKey) => {
      if (event.key === 'Enter') {
        startEditCell(entry, columnKey, rowPosition)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveSelection(-1, 0, event.shiftKey)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveSelection(1, 0, event.shiftKey)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        moveSelection(0, -1, event.shiftKey)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        moveSelection(0, 1, event.shiftKey)
      }
    },
    [moveSelection, startEditCell]
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

  // ==========================================================================
  // DUPLICATES
  // ==========================================================================
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
          if (current.includes(columnKey)) return current
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
          parts.push(`${result.removed} ${result.removed === 1 ? 'Zeile entfernt' : 'Zeilen entfernt'}`)
        }
        if (result.mode === 'merge' && result.mergedCells > 0) {
          parts.push(`${result.mergedCells} ${result.mergedCells === 1 ? 'Wert übernommen' : 'Werte übernommen'}`)
        }
        if (parts.length === 0) parts.push('Keine Anpassungen erforderlich')
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

  // ==========================================================================
  // VALIDATION
  // ==========================================================================
  const handleAddValidationRule = useCallback(() => {
    const defaultColumn = columns[0]?.key || ''
    const createdAt = Date.now()
    let createdRule = null
    setValidationRules((prev) => {
      const base = Array.isArray(prev) ? [...prev] : []
      createdRule = {
        id: createUniqueId('rule'),
        name: `Regel ${base.length + 1}`,
        column: defaultColumn,
        type: 'required',
        scope: 'raw',
        message: '',
        createdAt,
        updatedAt: createdAt
      }
      base.push(createdRule)
      schedulePersist({ validationRules: base })
      return base
    })
    if (createdRule) {
      registerVersionEvent({
        type: 'validation-rule',
        description: `Validierungsregel „${createdRule.name}" erstellt`,
        meta: { ruleId: createdRule.id }
      })
    }
  }, [columns, schedulePersist, registerVersionEvent])

  const handleUpdateValidationRule = useCallback(
    (ruleId, changes) => {
      if (!ruleId || !changes) return
      setValidationRules((prev) => {
        const base = Array.isArray(prev) ? [...prev] : []
        const index = base.findIndex((rule) => rule.id === ruleId)
        if (index === -1) return prev
        const updated = { ...base[index], ...changes, updatedAt: Date.now() }
        base[index] = updated
        schedulePersist({ validationRules: base })
        return base
      })
    },
    [schedulePersist]
  )

  const handleRemoveValidationRule = useCallback(
    (ruleId) => {
      if (!ruleId) return
      setValidationRules((prev) => {
        const base = Array.isArray(prev) ? prev.filter((rule) => rule.id !== ruleId) : []
        schedulePersist({ validationRules: base })
        return base
      })
      registerVersionEvent({
        type: 'validation-rule-delete',
        description: 'Validierungsregel entfernt',
        meta: { ruleId }
      })
    },
    [schedulePersist, registerVersionEvent]
  )

  useEffect(() => {
    if (!Array.isArray(validationRules) || validationRules.length === 0) {
      if (validationComputed.issues.length > 0 || validationComputed.summary.length > 0) {
        setValidationComputed({ issues: [], summary: [] })
      }
      return
    }
    const state = getImportState()
    const rawRows = Array.isArray(state?.rows) ? state.rows : []
    const transformed = Array.isArray(transformedRows) ? transformedRows : []
    const columnSet = new Set(columns.map((column) => column.key))
    const issues = []
    const summaryMap = new Map()
    validationRules.forEach((rule) => {
      if (!rule || !rule.id) return
      const columnKey = typeof rule.column === 'string' ? rule.column : ''
      if (!columnKey || !columnSet.has(columnKey)) return
      const scope = rule.scope === 'transformed' ? 'transformed' : 'raw'
      const sourceRows = scope === 'transformed' ? transformed : rawRows
      if (!Array.isArray(sourceRows) || sourceRows.length === 0) return
      const summaryEntry = summaryMap.get(rule.id) || {
        id: rule.id,
        name: rule.name || 'Regel',
        column: columnKey,
        scope,
        failures: 0,
        total: sourceRows.length
      }
      sourceRows.forEach((row, rowIndex) => {
        const value = row?.[columnKey]
        let isValid = true
        let message = ''
        if (rule.type === 'required') {
          isValid = !isCellValueEmpty(value)
          if (!isValid) message = rule.message || 'Pflichtfeld darf nicht leer sein.'
        }
        if (!isValid) {
          summaryEntry.failures += 1
          issues.push({ id: `${rule.id}-${scope}-${rowIndex}`, ruleId: rule.id, columnKey, scope, rowIndex, value, message })
        }
      })
      summaryMap.set(rule.id, summaryEntry)
    })
    const summary = Array.from(summaryMap.values())
    setValidationComputed({ issues, summary })
  }, [validationRules, columns, getImportState, transformedRows])

  const handleValidationIssueFocus = useCallback(
    (issue) => {
      if (!issue) return
      const { rowIndex, columnKey, scope } = issue
      if (!Number.isInteger(rowIndex) || rowIndex < 0 || !columnKey) return
      const entries = scope === 'transformed' ? transformedPreviewEntries : previewEntries
      const rowPosition = entries.findIndex((entry) => entry.index === rowIndex)
      if (rowPosition === -1) return
      const target = createCellTarget(rowIndex, rowPosition, columnKey)
      setSelectionState({ anchor: target, focus: target })
      pendingFocusRef.current = { rowIndex, columnKey }
    },
    [previewEntries, transformedPreviewEntries, createCellTarget]
  )

  // ==========================================================================
  // QUICK AGGREGATION
  // ==========================================================================
  const numericColumns = useMemo(() => columns.filter((col) => col.type === 'number'), [columns])
  const textColumns = useMemo(() => columns.filter((col) => col.type !== 'number'), [columns])

  const handleQuickAggregationConfigChange = useCallback(
    (changes) => {
      if (!changes || typeof changes !== 'object') return
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
    const operationLabelMap = {
      sum: 'Summe',
      average: 'Durchschnitt',
      min: 'Minimum',
      max: 'Maximum',
      count: 'Anzahl'
    }
    const headers = ['Kennzahl']
    operations.forEach((operation) => {
      headers.push(operationLabelMap[operation] || operation)
    })
    const rows = valueColumns.map((columnKey) => {
      let sum = 0
      let count = 0
      let min = Number.POSITIVE_INFINITY
      let max = Number.NEGATIVE_INFINITY
      sourceRows.forEach((row) => {
        const rawValue = row?.[columnKey]
        if (rawValue === null || rawValue === undefined) return
        const text = typeof rawValue === 'string' ? rawValue.trim() : rawValue
        if (text === '') return
        const numeric = typeof text === 'number' ? text : Number(String(text).replace(',', '.'))
        if (!Number.isFinite(numeric)) return
        sum += numeric
        count += 1
        if (numeric < min) min = numeric
        if (numeric > max) max = numeric
      })
      const cells = [columnKey]
      operations.forEach((operation) => {
        if (operation === 'sum') cells.push(sum)
        else if (operation === 'average') cells.push(count > 0 ? sum / count : '')
        else if (operation === 'min') cells.push(count > 0 ? min : '')
        else if (operation === 'max') cells.push(count > 0 ? max : '')
        else if (operation === 'count') cells.push(count)
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
      meta: { scope: quickAggregationConfig.scope, valueColumns }
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

  // ==========================================================================
  // ROW MANAGEMENT
  // ==========================================================================
  const rowDisplayRaw = rowDisplay?.raw || {}
  const rowDisplayTransformed = rowDisplay?.transformed || {}
  const manualEditMap = manualEdits?.map || {}

  const pinnedRawRowOffsets = useMemo(() => {
    let offset = headerHeight
    const offsets = new Map()
    previewEntries.forEach((entry) => {
      if (rowDisplayRaw[entry.index]?.pinned) {
        const height = DEFAULT_ROW_HEIGHT
        offsets.set(entry.index, offset)
        offset += height
      }
    })
    return offsets
  }, [previewEntries, rowDisplayRaw, headerHeight])

  const pinnedTransformedRowOffsets = useMemo(() => {
    let offset = headerHeight
    const offsets = new Map()
    transformedPreviewEntries.forEach((entry) => {
      if (rowDisplayTransformed[entry.index]?.pinned) {
        const height = DEFAULT_ROW_HEIGHT
        offsets.set(entry.index, offset)
        offset += height
      }
    })
    return offsets
  }, [transformedPreviewEntries, rowDisplayTransformed, headerHeight])

  const handleToggleRowHidden = useCallback(
    (source, rowIndex) => {
      const sourceState = source === 'transformed' ? rowDisplayTransformed : rowDisplayRaw
      const isHidden = sourceState[rowIndex]?.hidden === true
      setRowHidden(source, rowIndex, !isHidden)
    },
    [rowDisplayRaw, rowDisplayTransformed, setRowHidden]
  )

  const handleToggleRowPinned = useCallback(
    (source, rowIndex) => {
      const sourceState = source === 'transformed' ? rowDisplayTransformed : rowDisplayRaw
      const isPinned = sourceState[rowIndex]?.pinned === true
      setRowPinned(source, rowIndex, !isPinned)
    },
    [rowDisplayRaw, rowDisplayTransformed, setRowPinned]
  )

  // ==========================================================================
  // COLUMN RESIZE
  // ==========================================================================
  useEffect(() => {
    if (!resizingColumn) return undefined

    const handlePointerMove = (event) => {
      event.preventDefault()
      const delta = event.clientX - resizingColumn.startX
      const nextWidth = resizingColumn.startWidth + delta
      setColumnWidth(resizingColumn.columnKey, nextWidth)
    }

    const handlePointerUp = () => {
      setResizingColumn(null)
    }

    if (typeof document !== 'undefined') {
      const previous = document.body.style.userSelect
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp, { once: true })
      return () => {
        document.body.style.userSelect = previous
        window.removeEventListener('pointermove', handlePointerMove)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [resizingColumn, setColumnWidth, setResizingColumn])

  // ==========================================================================
  // COLUMN DRAG & DROP
  // ==========================================================================
  const handleColumnDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      if (!active || !over || active.id === over.id) return
      const currentIndex = visibleColumns.findIndex((column) => column.key === active.id)
      const newIndex = visibleColumns.findIndex((column) => column.key === over.id)
      if (currentIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(visibleColumns.map((column) => column.key), currentIndex, newIndex)
      reorderColumns(reordered)
    },
    [visibleColumns, reorderColumns]
  )

  // ==========================================================================
  // SORT HANDLING
  // ==========================================================================
  const activeSorts = useMemo(() => (Array.isArray(sortConfig) ? sortConfig : []), [sortConfig])

  const handleSortToggle = useCallback(
    (columnKey, event) => {
      if (!columnKey) return
      const isMultiSort = Boolean(event?.shiftKey || event?.metaKey || event?.ctrlKey)
      setSortConfig((previous) => {
        const current = Array.isArray(previous) ? previous : []
        const existingIndex = current.findIndex((entry) => entry.column === columnKey)
        const existing = existingIndex >= 0 ? current[existingIndex] : null
        const currentDirection = existing?.direction || 'none'
        const nextDirection = currentDirection === 'asc' ? 'desc' : currentDirection === 'desc' ? 'none' : 'asc'
        if (!isMultiSort) {
          if (nextDirection === 'none') return []
          return [{ column: columnKey, direction: nextDirection }]
        }
        const next = [...current]
        if (nextDirection === 'none') {
          if (existingIndex >= 0) next.splice(existingIndex, 1)
        } else if (existingIndex >= 0) {
          next[existingIndex] = { column: columnKey, direction: nextDirection }
        } else {
          next.push({ column: columnKey, direction: nextDirection })
        }
        return next
      })
      schedulePersist()
    },
    [setSortConfig, schedulePersist]
  )

  // ==========================================================================
  // FILE & ACTIONS
  // ==========================================================================
  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0]
    if (file) parseFile(file)
  }, [parseFile])

  const handleResetWorkbench = useCallback(() => {
    reset()
    if (onImportStateChange) onImportStateChange(null)
    if (onResetWorkbench) onResetWorkbench()
  }, [reset, onImportStateChange, onResetWorkbench])

  const downloadCsv = useCallback((rowsToExport, fileBaseName = 'daten') => {
    try {
      if (!Array.isArray(rowsToExport)) return
      const fields = columns.map((c) => c.key)
      const csv = Papa.unparse({ fields, data: rowsToExport.map((row) => fields.map((f) => row[f])) })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${fileBaseName}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (_) {}
  }, [columns])

  const fileHandleRef = useRef(null)

  const saveBlobToHandle = useCallback(async (handle, blob) => {
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
  }, [])

  const saveRowsViaPicker = useCallback(async (rowsToExport, suggestedName) => {
    const fields = columns.map((c) => c.key)
    const csv = Papa.unparse({ fields, data: rowsToExport.map((row) => fields.map((f) => row[f])) })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${suggestedName}.csv`,
        types: [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }]
      })
      await saveBlobToHandle(handle, blob)
      fileHandleRef.current = handle
      return true
    }
    // Fallback to download
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${suggestedName}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    return true
  }, [columns, saveBlobToHandle])

  const handleSaveOriginalCsv = useCallback(async () => {
    const state = getImportState()
    const baseRows = state?.rows || []
    if (!baseRows || baseRows.length === 0) return
    const base = (state?.fileName ? state.fileName.replace(/\.[^.]+$/, '') : 'daten') + '-bearbeitet'
    // Try to overwrite existing handle if available
    if (fileHandleRef.current && fileHandleRef.current.createWritable) {
      const fields = columns.map((c) => c.key)
      const csv = Papa.unparse({ fields, data: baseRows.map((row) => fields.map((f) => row[f])) })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      try {
        await saveBlobToHandle(fileHandleRef.current, blob)
        return
      } catch (_) { /* fall back to picker */ }
    }
    await saveRowsViaPicker(baseRows, base)
  }, [getImportState, columns, saveBlobToHandle, saveRowsViaPicker])

  const handleExportTransformedCsv = useCallback(async () => {
    if (!transformedRows || transformedRows.length === 0) return
    const base = (fileName ? fileName.replace(/\.[^.]+$/, '') : 'daten') + '-ansicht'
    await saveRowsViaPicker(transformedRows, base)
  }, [transformedRows, fileName, saveRowsViaPicker])

  const handleApplyToChart = useCallback(() => {
    const result = getImportResult()
    if (!result) return
    if (!onApplyToChart) return
    const importState = getImportState()
    onApplyToChart({
      ...result,
      importState: { ...importState, stateVersion: Date.now() }
    })
  }, [getImportResult, getImportState, onApplyToChart])

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-dark-bg border border-gray-700 rounded-lg overflow-hidden">
      <CsvFindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        onConfirm={handleFindReplaceConfirm}
        searchQuery={searchQuery}
        searchMode={searchMode}
        onSearchModeChange={handleSearchModeChange}
        searchColumns={searchColumns}
        onToggleColumn={handleSearchColumnToggle}
        onResetColumns={handleSearchColumnsReset}
        availableColumns={columns.map((col) => ({ key: col.key, label: col.key }))}
        searchConfig={activeSearchConfig}
        rawMatches={findReplaceData.raw.matches}
        transformedMatches={findReplaceData.transformed.matches}
        totalRawMatches={findReplaceData.raw.total}
        totalTransformedMatches={findReplaceData.transformed.total}
        canReplaceInTransformed={canReplaceInTransformed}
        transformedScopeDisabledReason={transformedScopeDisabledReason}
        defaultScope={findReplaceDefaultScope}
        activeMatch={activeSearchMatch}
        onPreviewMatchFocus={handleModalMatchFocus}
      />

      <CsvToolbar
        fileName={fileName}
        totalRows={totalRows}
        filteredRowCount={filteredRowCount}
        searchQuery={searchQuery}
        searchMode={searchMode}
        searchError={searchError}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        onSearchModeChange={(e) => setSearchMode(e.target.value)}
        onFileChange={handleFileChange}
        onApply={handleApplyToChart}
        onReset={handleResetWorkbench}
        onSave={handleSaveOriginalCsv}
        onExportTransformed={handleExportTransformedCsv}
        canApply={totalRows > 0}
        manualEditCount={manualEdits?.count || 0}
        canUndo={canUndoManualEdit}
        canRedo={canRedoManualEdit}
        onUndo={undoLastManualEdit}
        onRedo={redoLastManualEdit}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch(!showSearch)}
        leftPanelOpen={leftPanelOpen}
        onToggleLeftPanel={() => setLeftPanelOpen(!leftPanelOpen)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        dataScope={dataScope}
        onDataScopeChange={setDataScope}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        showLargeDatasetWarning={showLargeDatasetWarning}
        onDismissWarning={() => setShowLargeDatasetWarning(false)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL - Mapping & Transformations */}
        {!isFullscreen && leftPanelOpen && totalRows > 0 && (
          <>
            <div
              className="flex-none border-r border-gray-700 bg-dark-secondary overflow-y-auto"
              style={{ width: `${leftPanelWidth}px` }}
            >
              <div className="p-4">
              <div className="flex gap-1 mb-4">
                <button
                  onClick={() => setActiveLeftTab('mapping')}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                    activeLeftTab === 'mapping' ? 'bg-dark-accent1 text-white' : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setActiveLeftTab('transform')}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                    activeLeftTab === 'transform' ? 'bg-dark-accent1 text-white' : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                >
                  Transform
                </button>
                <button
                  onClick={() => setActiveLeftTab('profiling')}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                    activeLeftTab === 'profiling' ? 'bg-dark-accent1 text-white' : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                >
                  Profil
                </button>
              </div>

              {activeLeftTab === 'mapping' && (
                <CsvMappingPanel
                  columns={columns}
                  mapping={mapping}
                  chartType={chartType}
                  isScatterBubble={isScatterBubble}
                  isCoordinate={isCoordinate}
                  allowMultipleValueColumns={allowMultipleValueColumns}
                  onUpdateMapping={updateMapping}
                  onToggleValueColumn={toggleValueColumn}
                />
              )}

              {activeLeftTab === 'transform' && (
                <CsvTransformPanelFull
                  columns={columns}
                  mapping={mapping}
                  transformations={transformations}
                  rawRows={originalRows}
                  transformedRows={transformedRows}
                  onUpdateTransformations={updateTransformations}
                  registerVersionEvent={registerVersionEvent}
                />
              )}

              {activeLeftTab === 'profiling' && (
                <CsvProfilingPanel
                  columns={columns}
                  profilingMeta={profilingMeta}
                />
              )}
              </div>
            </div>
            <div
              className="w-1 cursor-col-resize bg-transparent hover:bg-dark-accent1 transition-colors"
              onMouseDown={() => setIsResizingLeft(true)}
            />
          </>
        )}

        {/* CENTER - TABLE (Main Focus!) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-dark-bg relative">
          {totalRows === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-dark-textLight mb-2">Keine Daten geladen</h3>
                <p className="text-sm text-dark-textGray mb-6">
                  Laden Sie eine CSV, TSV oder Excel-Datei um zu starten
                </p>
                <label
                  htmlFor="csv-file-input-center"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-600 bg-dark-secondary px-6 py-3 text-sm font-medium text-dark-textLight transition-colors hover:border-dark-accent1 hover:bg-dark-accent1/10"
                >
                  📁 Datei auswählen
                </label>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt,.xls,.xlsx,.ods"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input-center"
                />
              </div>
            </div>
          ) : (
            <CsvTable
              entries={dataScope === 'transformed' ? transformedPreviewEntries : previewEntries}
              visibleColumns={visibleColumns}
              rowDisplay={dataScope === 'transformed' ? rowDisplayTransformed : rowDisplayRaw}
              duplicateMetaByIndex={duplicateMetaByIndex}
              chartPreviewHighlight={chartPreviewHighlight}
              editingCell={editingCell}
              editingValue={editingValue}
              selectedCellSet={selectedCellSet}
              activeSearchMatch={activeSearchMatch}
              manualEditMap={manualEditMap}
              scope={dataScope}
              activeSorts={activeSorts}
              headerRef={headerRef}
              pinnedRowOffsets={dataScope === 'transformed' ? pinnedTransformedRowOffsets : pinnedRawRowOffsets}
              headerHeight={headerHeight}
              pinnedLeftOffsets={pinnedLeftOffsets}
              pinnedRightOffsets={pinnedRightOffsets}
              getColumnWidth={getColumnWidth}
              registerColumnRef={registerColumnRef}
              registerRowRef={registerRowRef}
              onSortToggle={handleSortToggle}
              onHideColumn={handleHideColumn}
              onTogglePinned={handleToggleColumnPinned}
              onColumnResizeStart={handleColumnResizeStart}
              onColumnDragEnd={handleColumnDragEnd}
              onCellMouseDown={handleCellMouseDown}
              onCellMouseEnter={handleCellMouseEnter}
              onCellKeyDown={handleCellKeyDown}
              onStartEdit={startEditCell}
              onEditingValueChange={(e) => setEditingValue(e.target.value)}
              onConfirmEdit={confirmEdit}
              onCancelEdit={cancelEdit}
              onToggleRowHidden={handleToggleRowHidden}
              onToggleRowPinned={handleToggleRowPinned}
              transformationMeta={dataScope === 'transformed' ? transformationMeta : null}
              groupingColumns={dataScope === 'transformed' && transformationMeta?.groupingColumns ? transformationMeta.groupingColumns : []}
              mapping={mapping}
              aggregations={transformations?.aggregations}
            />
          )}
        </div>

        {/* RIGHT PANEL - Tools */}
        {!isFullscreen && rightPanelOpen && totalRows > 0 && (
          <>
            <div
              className="w-1 cursor-col-resize bg-transparent hover:bg-dark-accent1 transition-colors"
              onMouseDown={() => setIsResizingRight(true)}
            />
            <div
              className="flex-none border-l border-gray-700 bg-dark-secondary overflow-y-auto"
              style={{ width: `${rightPanelWidth}px` }}
            >
              <div className="p-4">
                <CsvToolsPanel
                activeTab={activeRightTab}
                onTabChange={setActiveRightTab}
                columns={columns}
                duplicateKeyColumns={duplicateKeyColumns}
                hasDuplicateSelection={hasDuplicateSelection}
                hasDuplicates={hasDuplicates}
                duplicateGroups={duplicateGroups}
                duplicateRowCount={duplicateRowCount}
                duplicateActionFeedback={duplicateActionFeedback}
                onDuplicateToggle={handleDuplicateColumnToggle}
                onDuplicateSelectAll={handleDuplicateSelectAll}
                onDuplicateClear={handleDuplicateClear}
                onDuplicateResolve={handleResolveDuplicatesAction}
                validationRules={validationRules}
                validationIssues={validationComputed.issues}
                validationSummary={validationComputed.summary}
                onAddValidationRule={handleAddValidationRule}
                onUpdateValidationRule={handleUpdateValidationRule}
                onRemoveValidationRule={handleRemoveValidationRule}
                onFocusValidationIssue={handleValidationIssueFocus}
                numericColumns={numericColumns}
                textColumns={textColumns}
                quickAggregationConfig={quickAggregationConfig}
                quickAggregationResult={quickAggregationResult}
                onAggregationConfigChange={handleQuickAggregationConfigChange}
                onRunAggregation={runQuickAggregation}
                onExportAggregation={handleQuickAggregationExport}
                searchMatches={searchMatches}
                searchMatchSummary={searchMatchSummary}
                hasSearchMatches={hasSearchMatches}
                onNavigateMatch={handleSearchMatchNavigate}
                onOpenFindReplace={handleOpenFindReplace}
                transformations={transformations}
                onUpdateTransformations={updateTransformations}
              />
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}

CsvWorkbench.propTypes = {
  onApplyToChart: PropTypes.func,
  onImportStateChange: PropTypes.func,
  onResetWorkbench: PropTypes.func,
  allowMultipleValueColumns: PropTypes.bool,
  requireDatasets: PropTypes.bool,
  initialData: PropTypes.object,
  chartType: PropTypes.string,
  isScatterBubble: PropTypes.bool,
  isCoordinate: PropTypes.bool
}

