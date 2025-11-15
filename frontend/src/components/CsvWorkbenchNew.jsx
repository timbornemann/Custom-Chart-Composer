import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Papa from 'papaparse'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import useDataImport, { createSearchConfig, rowMatchesQuery } from '../hooks/useDataImport'
import CsvFindReplaceModal from './CsvFindReplaceModal'
import SortableHeaderCell from './csv/SortableHeaderCell'
import { AVAILABLE_FORMULAS, formatCellReference, formatRangeReference } from '../utils/csv/formulas'
import {
  ACTION_COLUMN_WIDTH,
  AGGREGATION_OPTIONS,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_PIVOT_CONFIG,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_UNPIVOT_CONFIG,
  MIN_COLUMN_WIDTH
} from './csv/constants'
import {
  applyReplacementToText,
  formatCellValue,
  formatCorrelationValue,
  formatSamplePreview,
  formatStatNumber,
  formatStatPercentage,
  isCellValueEmpty,
  renderHighlightedValue
} from './csv/formatting'
import { createUniqueId } from './csv/utils'

/**
 * CsvWorkbenchNew - Redesigned CSV Editor
 * 
 * Neues Design-Konzept:
 * - Tabelle immer im Fokus (Hauptbereich)
 * - Toolbar oben für schnellen Zugriff
 * - Collapsible Side-Panels für erweiterte Funktionen
 * - Keine Tab-Navigation mehr
 */
export default function CsvWorkbenchNew({
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
  // ============================================================================
  // SECTION 1: BASE DATA IMPORT HOOK
  // ============================================================================
  const {
    fileName,
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
    previewRows,
    totalRows,
    transformedPreviewRows,
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

  // ============================================================================
  // SECTION 2: LOCAL UI STATE
  // ============================================================================
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [activeLeftPanel, setActiveLeftPanel] = useState('mapping') // mapping, transformations, profiling
  const [activeRightPanel, setActiveRightPanel] = useState('search') // search, duplicates, validation

  // Quick toolbar state
  const [showQuickSearch, setShowQuickSearch] = useState(false)
  const [showColumnSelector, setShowColumnSelector] = useState(false)

  // File input refs to reset after processing
  const fileInputRef = useRef(null)
  const fileInputCenterRef = useRef(null)
  // Store file being processed to prevent loss during re-renders
  const processingFileRef = useRef(null)

  // ============================================================================
  // SECTION 3: SAVED VIEWS, VALIDATION, AGGREGATION STATE
  // ============================================================================
  const [savedViews, setSavedViews] = useState(() => [])
  const [activeSavedViewId, setActiveSavedViewId] = useState(null)
  const [savedViewDraftName, setSavedViewDraftName] = useState('')
  const [validationRules, setValidationRules] = useState(() => [])
  const [validationComputed, setValidationComputed] = useState({ issues: [], summary: [] })
  const [quickAggregationConfig, setQuickAggregationConfig] = useState(() => ({
    scope: 'raw',
    valueColumns: [],
    groupBy: '',
    operations: ['sum', 'average']
  }))
  const [quickAggregationResult, setQuickAggregationResult] = useState(null)

  // Load initial saved state
  useEffect(() => {
    if (!initialData) {
      return
    }
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
        groupBy:
          typeof initialData.quickAggregationConfig.groupBy === 'string'
            ? initialData.quickAggregationConfig.groupBy
            : prev.groupBy,
        operations: Array.isArray(initialData.quickAggregationConfig.operations) && initialData.quickAggregationConfig.operations.length > 0
          ? initialData.quickAggregationConfig.operations
          : prev.operations
      }))
    }
  }, [initialData])

  const registerVersionEvent = useCallback(
    (event) => {
      if (typeof internalRegisterVersionEvent === 'function') {
        internalRegisterVersionEvent(event)
      }
    },
    [internalRegisterVersionEvent]
  )

  // ============================================================================
  // SECTION 4: PERSISTENCE LAYER (WICHTIG: MUSS ZUERST KOMMEN!)
  // ============================================================================
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

  // Wrapper callbacks that persist changes
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
      // Delay schedulePersist to ensure all state updates are complete
      // This prevents race conditions where initialData gets updated before states are set
      setTimeout(() => {
        schedulePersist()
      }, 50)
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

  // ============================================================================
  // SECTION 5: COLUMN MANAGEMENT
  // ============================================================================
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

  const visibleColumns = useMemo(
    () => columns.filter((column) => column.display?.isVisible !== false),
    [columns]
  )

  const hiddenColumns = useMemo(
    () => columns.filter((column) => column.display?.isVisible === false),
    [columns]
  )

  const columnByKey = useMemo(() => {
    const map = new Map()
    columns.forEach((column) => {
      map.set(column.key, column)
    })
    return map
  }, [columns])

  const columnIndexMap = useMemo(() => {
    const map = new Map()
    visibleColumns.forEach((column, index) => {
      map.set(column.key, index)
    })
    return map
  }, [visibleColumns])

  // ============================================================================
  // SECTION 6: FILE HANDLING
  // ============================================================================
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    
    // Prevent processing if a file is already being processed
    if (processingFileRef.current) {
      // Reset input to allow retry
      event.target.value = ''
      return
    }
    
    // Store file reference and input element to prevent loss during re-renders
    const fileToProcess = file
    const inputElement = event.target
    processingFileRef.current = fileToProcess
    
    // Process the file
    try {
      await parseFile(fileToProcess)
      
      // Reset input value after successful processing to allow selecting the same file again
      // Use setTimeout to ensure this happens after React has processed the state updates
      setTimeout(() => {
        if (inputElement) {
          inputElement.value = ''
        }
        // Also reset the other file input if it exists
        if (fileInputRef.current && fileInputRef.current !== inputElement) {
          fileInputRef.current.value = ''
        }
        if (fileInputCenterRef.current && fileInputCenterRef.current !== inputElement) {
          fileInputCenterRef.current.value = ''
        }
        processingFileRef.current = null
      }, 100)
    } catch (error) {
      console.error('Error processing file:', error)
      // Reset input even on error to allow retry
      setTimeout(() => {
        if (inputElement) {
          inputElement.value = ''
        }
        processingFileRef.current = null
      }, 100)
    }
  }, [parseFile])

  const handleResetWorkbench = useCallback(() => {
    reset()
    if (onImportStateChange) {
      onImportStateChange(null)
    }
    if (onResetWorkbench) {
      onResetWorkbench()
    }
  }, [reset, onImportStateChange, onResetWorkbench])

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

  // ============================================================================
  // SECTION 7: RENDER - NEW UI LAYOUT
  // ============================================================================
  
  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* TOOLBAR - Always visible at top */}
      <div className="flex-none border-b border-gray-700 bg-dark-secondary">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-dark-textLight">CSV Editor</h2>
            {fileName && (
              <span className="text-sm text-dark-textGray">
                {fileName} · {totalRows} Zeilen
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xls,.xlsx,.ods"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="cursor-pointer rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-dark-accent1"
            >
              📁 Datei laden
            </label>
            
            {totalRows > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowQuickSearch(!showQuickSearch)}
                  className="rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-dark-accent1"
                >
                  🔍 Suchen
                </button>
                
                <button
                  type="button"
                  onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  className="rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-dark-accent1"
                >
                  ⚙️ Mapping
                </button>
                
                <button
                  type="button"
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className="rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-dark-accent1"
                >
                  🛠️ Tools
                </button>
                
                <button
                  type="button"
                  onClick={handleApplyToChart}
                  className="rounded-lg bg-dark-accent1 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-accent1/90"
                >
                  ✓ An Diagramm senden
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Quick Search Bar (collapsible) */}
        {showQuickSearch && totalRows > 0 && (
          <div className="border-t border-gray-700 bg-dark-bg/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="flex-1 rounded-lg border border-gray-700 bg-dark-secondary px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value)}
                className="rounded-lg border border-gray-700 bg-dark-secondary px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="whole">Ganzwort</option>
                <option value="regex">Regex</option>
              </select>
              {searchError && (
                <span className="text-xs text-red-300">{searchError}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL - Mapping & Transformations */}
        {leftPanelOpen && totalRows > 0 && (
          <div className="w-80 flex-none border-r border-gray-700 bg-dark-secondary overflow-y-auto">
            <div className="p-4">
              <div className="flex gap-1 mb-4">
                <button
                  onClick={() => setActiveLeftPanel('mapping')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeLeftPanel === 'mapping'
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                >
                  Mapping
                </button>
                <button
                  onClick={() => setActiveLeftPanel('transformations')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeLeftPanel === 'transformations'
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                >
                  Transform
                </button>
                <button
                  onClick={() => setActiveLeftPanel('profiling')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeLeftPanel === 'profiling'
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                >
                  Profil
                </button>
              </div>

              {/* Panel Content */}
              {activeLeftPanel === 'mapping' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-dark-textLight">Spalten-Mapping</h3>
                  <p className="text-xs text-dark-textGray">
                    Ordne CSV-Spalten den Diagramm-Feldern zu
                  </p>
                  {/* Mapping controls will go here */}
                  <div className="text-xs text-dark-textGray">
                    (Mapping-UI folgt in nächster Iteration)
                  </div>
                </div>
              )}

              {activeLeftPanel === 'transformations' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-dark-textLight">Transformationen</h3>
                  <p className="text-xs text-dark-textGray">
                    Filter, Gruppierung, Pivot/Unpivot
                  </p>
                  {/* Transformation controls will go here */}
                  <div className="text-xs text-dark-textGray">
                    (Transform-UI folgt in nächster Iteration)
                  </div>
                </div>
              )}

              {activeLeftPanel === 'profiling' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-dark-textLight">Spaltenprofil</h3>
                  <p className="text-xs text-dark-textGray">
                    Statistiken und Korrelation
                  </p>
                  {/* Profiling UI will go here */}
                  <div className="text-xs text-dark-textGray">
                    (Profiling-UI folgt in nächster Iteration)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CENTER - TABLE (Main Focus!) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {totalRows === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-dark-textLight mb-2">
                  Keine Daten geladen
                </h3>
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
                  ref={fileInputCenterRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xls,.xlsx,.ods"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input-center"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Table Header Info */}
              <div className="flex-none border-b border-gray-700 bg-dark-bg/40 px-4 py-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-dark-textGray">
                    <span>
                      {filteredRowCount} von {totalRows} Zeilen
                    </span>
                    {manualEdits?.count > 0 && (
                      <span className="text-dark-accent1">
                        {manualEdits.count} Änderung{manualEdits.count !== 1 ? 'en' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={undoLastManualEdit}
                      disabled={!canUndoManualEdit}
                      className="rounded px-2 py-1 text-xs text-dark-textGray transition-colors hover:text-dark-textLight disabled:cursor-not-allowed disabled:opacity-50"
                      title="Rückgängig"
                    >
                      ↶
                    </button>
                    <button
                      onClick={redoLastManualEdit}
                      disabled={!canRedoManualEdit}
                      className="rounded px-2 py-1 text-xs text-dark-textGray transition-colors hover:text-dark-textLight disabled:cursor-not-allowed disabled:opacity-50"
                      title="Wiederholen"
                    >
                      ↷
                    </button>
                  </div>
                </div>
              </div>

              {/* TABLE - Main Focus Area */}
              <div className="flex-1 overflow-auto">
                <div className="min-w-full">
                  <p className="p-8 text-center text-dark-textGray">
                    Tabellen-Rendering wird in nächster Iteration implementiert
                  </p>
                  {/* Full table rendering will go here */}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANEL - Tools & Features */}
        {rightPanelOpen && totalRows > 0 && (
          <div className="w-80 flex-none border-l border-gray-700 bg-dark-secondary overflow-y-auto">
            <div className="p-4">
              <div className="flex gap-1 mb-4">
                <button
                  onClick={() => setActiveRightPanel('search')}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    activeRightPanel === 'search'
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                >
                  Suche
                </button>
                <button
                  onClick={() => setActiveRightPanel('duplicates')}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    activeRightPanel === 'duplicates'
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                >
                  Duplikate
                </button>
                <button
                  onClick={() => setActiveRightPanel('validation')}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    activeRightPanel === 'validation'
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                >
                  Validation
                </button>
              </div>

              {/* Right Panel Content */}
              {activeRightPanel === 'search' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-dark-textLight">Erweiterte Suche</h3>
                  <p className="text-xs text-dark-textGray">
                    Suchen & Ersetzen mit Regex-Support
                  </p>
                  <div className="text-xs text-dark-textGray">
                    (Such-UI folgt in nächster Iteration)
                  </div>
                </div>
              )}

              {activeRightPanel === 'duplicates' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-dark-textLight">Duplikate</h3>
                  <p className="text-xs text-dark-textGray">
                    Duplikate erkennen und bereinigen
                  </p>
                  <div className="text-xs text-dark-textGray">
                    (Duplikat-UI folgt in nächster Iteration)
                  </div>
                </div>
              )}

              {activeRightPanel === 'validation' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-dark-textLight">Validierung</h3>
                  <p className="text-xs text-dark-textGray">
                    Validierungsregeln definieren
                  </p>
                  <div className="text-xs text-dark-textGray">
                    (Validierungs-UI folgt in nächster Iteration)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {totalRows > 0 && (
        <div className="flex-none border-t border-gray-700 bg-dark-bg px-4 py-2">
          <div className="flex items-center justify-between text-xs text-dark-textGray">
            <div>
              {columns.length} Spalten · {hiddenColumns.length} versteckt
            </div>
            <button
              onClick={handleResetWorkbench}
              className="text-dark-textGray transition-colors hover:text-red-400"
            >
              Zurücksetzen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

CsvWorkbenchNew.propTypes = {
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

