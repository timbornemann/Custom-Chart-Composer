import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import useDataImport from '../hooks/useDataImport'

const formatCellValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') {
    return value.trim()
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : ''
  }
  return String(value)
}

const FILTER_OPERATORS = [
  { value: 'equals', label: 'ist gleich' },
  { value: 'notEquals', label: 'ist ungleich' },
  { value: 'contains', label: 'enthält' },
  { value: 'greaterThan', label: 'größer als' },
  { value: 'lessThan', label: 'kleiner als' }
]

const AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Summe' },
  { value: 'average', label: 'Durchschnitt' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Anzahl gültiger Werte' }
]

const createUniqueId = (prefix) => {
  const globalCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function DataImportModal({
  isOpen,
  onClose,
  onImport,
  allowMultipleValueColumns = true,
  requireDatasets = false
}) {
  const [activeTab, setActiveTab] = useState('mapping')

  const {
    fileName,
    columns,
    mapping,
    transformations,
    updateMapping,
    updateTransformations,
    toggleValueColumn,
    parseFile,
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
    getImportResult
  } = useDataImport({ allowMultipleValueColumns, requireDatasets })

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('mapping')
      reset()
    }
  }, [isOpen, reset])

  // Ensure all hooks above are always called before any early return

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      parseFile(file)
    }
  }

  const handleImport = () => {
    const result = getImportResult()
    if (!result) {
      return
    }
    onImport(result)
    reset()
  }

  const availableDatasetColumns = columns.filter(
    (column) =>
      column.key !== mapping.label &&
      !mapping.valueColumns.includes(column.key) &&
      column.type !== 'number'
  )

  const groupingColumns = useMemo(
    () => columns.filter((column) => column.type !== 'number'),
    [columns]
  )

  const transformedColumns = useMemo(() => {
    const keys = []
    if (mapping.label) {
      keys.push(mapping.label)
    }
    if (mapping.datasetLabel && !keys.includes(mapping.datasetLabel)) {
      keys.push(mapping.datasetLabel)
    }
    mapping.valueColumns.forEach((column) => {
      if (column && !keys.includes(column)) {
        keys.push(column)
      }
    })
    if (keys.length === 0 && transformedPreviewRows.length > 0) {
      Object.keys(transformedPreviewRows[0] || {}).forEach((key) => {
        if (!keys.includes(key)) {
          keys.push(key)
        }
      })
    }
    return keys
  }, [mapping, transformedPreviewRows])

  if (!isOpen) {
    return null
  }

  const filters = transformations.filters || []
  const grouping = transformations.grouping || {}
  const aggregations = transformations.aggregations || {}

  const handleAddFilter = () => {
    const id = createUniqueId('filter')
    updateTransformations((prev) => ({
      ...prev,
      filters: [...(prev.filters || []), { id, column: '', operator: 'equals', value: '', enabled: true }]
    }))
  }

  const handleFilterChange = (id, changes) => {
    updateTransformations((prev) => ({
      ...prev,
      filters: (prev.filters || []).map((filter) => (filter.id === id ? { ...filter, ...changes } : filter))
    }))
  }

  const handleRemoveFilter = (id) => {
    updateTransformations((prev) => ({
      ...prev,
      filters: (prev.filters || []).filter((filter) => filter.id !== id)
    }))
  }

  const handleToggleFilter = (id, enabled) => {
    handleFilterChange(id, { enabled })
  }

  const handleToggleGrouping = (enabled) => {
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        enabled,
        column: enabled ? prev.grouping.column || mapping.label || '' : prev.grouping.column
      }
    }))
  }

  const handleGroupingColumnChange = (column) => {
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        column
      }
    }))
  }

  const handleGroupingFallbackChange = (fallbackLabel) => {
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        fallbackLabel
      }
    }))
  }

  const handleAddGroup = () => {
    const id = createUniqueId('group')
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        customGroups: [...(prev.grouping?.customGroups || []), { id, label: '', values: [] }]
      }
    }))
  }

  const handleGroupChange = (id, changes) => {
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        customGroups: (prev.grouping?.customGroups || []).map((group) =>
          group.id === id ? { ...group, ...changes } : group
        )
      }
    }))
  }

  const handleGroupLabelChange = (id, label) => {
    handleGroupChange(id, { label })
  }

  const handleGroupValuesChange = (id, valueString) => {
    const values = valueString
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
    handleGroupChange(id, { values })
  }

  const handleRemoveGroup = (id) => {
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        customGroups: (prev.grouping?.customGroups || []).filter((group) => group.id !== id)
      }
    }))
  }

  const handleAggregationDefaultChange = (operation) => {
    updateTransformations((prev) => {
      const previousDefault = prev.aggregations?.defaultOperation || 'sum'
      const updatedPerColumn = Object.fromEntries(
        Object.entries(prev.aggregations?.perColumn || {}).map(([column, value]) => [
          column,
          value === previousDefault ? operation : value
        ])
      )
      return {
        ...prev,
        aggregations: {
          ...prev.aggregations,
          defaultOperation: operation,
          perColumn: updatedPerColumn
        }
      }
    })
  }

  const handleAggregationChange = (column, operation) => {
    updateTransformations((prev) => ({
      ...prev,
      aggregations: {
        ...prev.aggregations,
        perColumn: {
          ...(prev.aggregations?.perColumn || {}),
          [column]: operation
        }
      }
    }))
  }

  const transformationMetaInfo = transformationMeta || {
    originalCount: 0,
    filteredOut: 0,
    aggregatedFrom: 0,
    aggregatedTo: 0
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-5xl rounded-xl bg-dark-secondary shadow-2xl border border-gray-700">
        <div className="flex items-start justify-between border-b border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-textLight">CSV/Excel-Daten importieren</h2>
            <p className="text-sm text-dark-textGray">
              Laden Sie eine Datei hoch, ordnen Sie die Spalten zu und konfigurieren Sie optionale Transformationen.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md bg-transparent p-2 text-dark-textGray hover:text-dark-textLight"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-5">
          <section className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-dark-textLight mb-2">Datei auswählen</label>
              <input
                type="file"
                accept=".csv,.tsv,.txt,.xls,.xlsx,.ods"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-lg border border-gray-700 bg-dark-bg px-4 py-3 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
              <p className="mt-2 text-xs text-dark-textGray">
                Unterstützte Formate: CSV, TSV sowie Excel-Dateien (.xls, .xlsx, .ods)
              </p>
              {fileName && (
                <p className="mt-1 text-xs text-dark-textLight/80">
                  Ausgewählte Datei: <span className="font-medium">{fileName}</span>
                </p>
              )}
              {parseError && (
                <div className="mt-3 rounded-md border border-red-600/40 bg-red-900/30 px-3 py-2 text-xs text-red-200">
                  {parseError}
                </div>
              )}
            </div>
            {isLoading && (
              <div className="rounded-md border border-blue-500/40 bg-blue-900/20 px-3 py-2 text-xs text-blue-200">
                Datei wird verarbeitet …
              </div>
            )}
          </section>

          {totalRows > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-700 bg-dark-bg/40 p-2">
                {[
                  { key: 'mapping', label: 'Zuordnung' },
                  { key: 'transformations', label: 'Transformation' }
                ].map((step, index) => {
                  const isActive = activeTab === step.key
                  const isDisabled = step.key === 'transformations' && totalRows === 0
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => setActiveTab(step.key)}
                      disabled={isDisabled}
                      className={`flex-1 min-w-[140px] rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-dark-accent1 text-white shadow-lg'
                          : 'bg-transparent text-dark-textGray hover:text-dark-textLight'
                      } ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-600 text-xs">
                        {index + 1}
                      </span>
                      {step.label}
                    </button>
                  )
                })}
              </div>

              {activeTab === 'mapping' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-dark-textLight">Spalten zuordnen</h3>
                    <p className="text-xs text-dark-textGray">
                      Wählen Sie aus, welche Spalten Beschriftungen, Werte und optionale Datensatz-Kennungen enthalten.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                        Beschriftungs-Spalte
                      </label>
                      <select
                        value={mapping.label}
                        onChange={(event) => updateMapping({ label: event.target.value })}
                        className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                      >
                        <option value="">Spalte wählen …</option>
                        {columns.map((column) => (
                          <option key={column.key} value={column.key}>
                            {column.key} {column.type === 'number' ? '(Zahl)' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-dark-textGray">
                        Diese Werte werden als Kategorien bzw. X-Achsen-Beschriftungen verwendet.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                        Werte-Spalten
                      </label>
                      {allowMultipleValueColumns ? (
                        <div className="space-y-2 rounded-lg border border-gray-700 bg-dark-bg p-3">
                          {columns.map((column) => {
                            const disabled = column.key === mapping.label
                            const checked = mapping.valueColumns.includes(column.key)
                            return (
                              <label
                                key={column.key}
                                className={`flex items-start space-x-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                                  disabled
                                    ? 'cursor-not-allowed text-dark-textGray/60'
                                    : 'cursor-pointer hover:bg-dark-secondary'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1 h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                                  checked={checked}
                                  onChange={() => toggleValueColumn(column.key)}
                                  disabled={disabled}
                                />
                                <span className="flex-1 text-dark-textLight">
                                  <span className="font-medium">{column.key}</span>{' '}
                                  <span className="text-xs text-dark-textGray">
                                    {column.type === 'number' ? 'Zahlen' : 'Text'} ·{' '}
                                    {column.filledCount - column.emptyCount} Werte
                                  </span>
                                </span>
                              </label>
                            )
                          })}
                          {mapping.valueColumns.length === 0 && (
                            <p className="text-[11px] text-red-300">Bitte wählen Sie mindestens eine Spalte aus.</p>
                          )}
                        </div>
                      ) : (
                        <select
                          value={mapping.valueColumns[0] || ''}
                          onChange={(event) =>
                            updateMapping({ valueColumns: event.target.value ? [event.target.value] : [] })
                          }
                          className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                        >
                          <option value="">Spalte wählen …</option>
                          {columns
                            .filter((column) => column.key !== mapping.label)
                            .map((column) => (
                              <option key={column.key} value={column.key}>
                                {column.key} {column.type === 'number' ? '(Zahl)' : ''}
                              </option>
                            ))}
                        </select>
                      )}
                      <p className="text-[11px] text-dark-textGray">
                        Enthalten die numerischen Werte für das Diagramm. Ungültige Zahlen werden automatisch übersprungen.
                      </p>
                    </div>
                  </div>

                  {allowMultipleValueColumns && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                        Datensatz-Spalte (optional)
                      </label>
                      <select
                        value={mapping.datasetLabel}
                        onChange={(event) => updateMapping({ datasetLabel: event.target.value })}
                        className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                      >
                        <option value="">Nicht verwenden</option>
                        {availableDatasetColumns.map((column) => (
                          <option key={column.key} value={column.key}>
                            {column.key}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-dark-textGray">
                        Ermöglicht den Import mehrerer Datensätze aus einer Spalte (lange Tabellenform).
                      </p>
                    </div>
                  )}

                  {previewRows.length > 0 && (
                    <section className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-dark-textLight">Originaldaten Vorschau</h4>
                        <span className="text-xs text-dark-textGray">{totalRows} Zeilen erkannt</span>
                      </div>
                      <div className="max-h-64 overflow-auto rounded-lg border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-700 text-sm">
                          <thead className="bg-dark-bg/80 text-xs uppercase tracking-wide text-dark-textGray">
                            <tr>
                              {columns.map((column) => (
                                <th key={column.key} className="px-3 py-2 text-left">
                                  {column.key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800 bg-dark-bg/40 text-dark-textLight">
                            {previewRows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {columns.map((column) => (
                                  <td key={column.key} className="px-3 py-2 text-xs text-dark-textLight/90">
                                    {formatCellValue(row[column.key]) || (
                                      <span className="text-dark-textGray/60">–</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'transformations' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-dark-textLight">Transformationen</h3>
                    <p className="text-xs text-dark-textGray">
                      Filtern, gruppieren und aggregieren Sie die Daten, bevor sie importiert werden.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-dark-textLight">Filter</h4>
                        <button
                          type="button"
                          onClick={handleAddFilter}
                          className="rounded-md border border-gray-600 px-3 py-1 text-xs font-medium text-dark-textLight hover:border-dark-accent1 hover:text-dark-accent1"
                        >
                          Filter hinzufügen
                        </button>
                      </div>
                      {filters.length === 0 ? (
                        <p className="text-xs text-dark-textGray">
                          Es sind keine Filter aktiv. Fügen Sie Filter hinzu, um Zeilen anhand von Bedingungen auszuschließen.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {filters.map((filter) => (
                            <div
                              key={filter.id}
                              className="grid gap-2 rounded-md border border-gray-700 bg-dark-bg/60 p-3 md:grid-cols-12"
                            >
                              <div className="flex items-center space-x-2 md:col-span-2">
                                <input
                                  type="checkbox"
                                  checked={filter.enabled !== false}
                                  onChange={(event) => handleToggleFilter(filter.id, event.target.checked)}
                                  className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                                />
                                <span className="text-xs text-dark-textLight">Aktiv</span>
                              </div>
                              <div className="md:col-span-4">
                                <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                  Spalte
                                </label>
                                <select
                                  value={filter.column}
                                  onChange={(event) => handleFilterChange(filter.id, { column: event.target.value })}
                                  className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                >
                                  <option value="">Spalte wählen …</option>
                                  {columns.map((column) => (
                                    <option key={column.key} value={column.key}>
                                      {column.key}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-3">
                                <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                  Operator
                                </label>
                                <select
                                  value={filter.operator}
                                  onChange={(event) => handleFilterChange(filter.id, { operator: event.target.value })}
                                  className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                >
                                  {FILTER_OPERATORS.map((operator) => (
                                    <option key={operator.value} value={operator.value}>
                                      {operator.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                  Wert
                                </label>
                                <input
                                  type="text"
                                  value={filter.value}
                                  onChange={(event) => handleFilterChange(filter.id, { value: event.target.value })}
                                  className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                  placeholder="Wert eingeben"
                                />
                              </div>
                              <div className="flex items-end justify-end md:col-span-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFilter(filter.id)}
                                  className="rounded-md border border-red-600 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                                >
                                  Entfernen
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-dark-textLight">Gruppierung</h4>
                        <label className="flex items-center space-x-2 text-xs text-dark-textLight">
                          <input
                            type="checkbox"
                            checked={grouping.enabled}
                            onChange={(event) => handleToggleGrouping(event.target.checked)}
                            className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                          />
                          <span>Aktivieren</span>
                        </label>
                      </div>
                      {!grouping.enabled ? (
                        <p className="text-xs text-dark-textGray">
                          Standardmäßig werden Zeilen nicht zusammengefasst. Aktivieren Sie die Gruppierung, um Werte zusammenzufassen
                          und Aggregationen zu verwenden.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Gruppieren nach
                              </label>
                              <select
                                value={grouping.column || mapping.label || ''}
                                onChange={(event) => handleGroupingColumnChange(event.target.value)}
                                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                              >
                                <option value="">Beschriftung verwenden</option>
                                {groupingColumns.map((column) => (
                                  <option key={column.key} value={column.key}>
                                    {column.key}
                                  </option>
                                ))}
                              </select>
                              <p className="mt-1 text-[11px] text-dark-textGray">
                                Legt fest, welche Spalte zur Bildung der Gruppen verwendet wird.
                              </p>
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Name für sonstige Werte
                              </label>
                              <input
                                type="text"
                                value={grouping.fallbackLabel || ''}
                                onChange={(event) => handleGroupingFallbackChange(event.target.value)}
                                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                placeholder="z. B. Sonstige"
                              />
                              <p className="mt-1 text-[11px] text-dark-textGray">
                                Wird für Werte verwendet, die keiner definierten Gruppe zugeordnet werden können.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                                Eigene Gruppen (optional)
                              </h5>
                              <button
                                type="button"
                                onClick={handleAddGroup}
                                className="rounded-md border border-gray-600 px-2 py-1 text-xs text-dark-textLight hover:border-dark-accent1 hover:text-dark-accent1"
                              >
                                Gruppe hinzufügen
                              </button>
                            </div>
                            {(grouping.customGroups || []).length === 0 ? (
                              <p className="text-[11px] text-dark-textGray">
                                Ohne eigene Gruppen werden Werte nach ihrer exakten Ausprägung zusammengefasst.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {(grouping.customGroups || []).map((group) => (
                                  <div
                                    key={group.id}
                                    className="rounded-md border border-gray-700 bg-dark-bg/60 p-3 space-y-2"
                                  >
                                    <div className="grid gap-2 md:grid-cols-2">
                                      <div>
                                        <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                          Gruppenname
                                        </label>
                                        <input
                                          type="text"
                                          value={group.label || ''}
                                          onChange={(event) => handleGroupLabelChange(group.id, event.target.value)}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="z. B. Gruppe A"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                          Werte (durch Komma getrennt)
                                        </label>
                                        <input
                                          type="text"
                                          value={(group.values || []).join(', ')}
                                          onChange={(event) => handleGroupValuesChange(group.id, event.target.value)}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="z. B. A1, A2, A3"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveGroup(group.id)}
                                        className="rounded-md border border-red-600 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                                      >
                                        Entfernen
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                      <h4 className="text-sm font-semibold text-dark-textLight">Aggregation</h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                            Standard-Aggregation
                          </label>
                          <select
                            value={aggregations.defaultOperation || 'sum'}
                            onChange={(event) => handleAggregationDefaultChange(event.target.value)}
                            className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            {AGGREGATION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-[11px] text-dark-textGray">
                            Wird verwendet, wenn für eine Werte-Spalte keine eigene Auswahl getroffen wird.
                          </p>
                        </div>
                      </div>
                      {mapping.valueColumns.length === 0 ? (
                        <p className="text-xs text-dark-textGray">
                          Bitte wählen Sie zunächst mindestens eine Werte-Spalte aus.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {mapping.valueColumns.map((column) => (
                            <div key={column} className="grid items-center gap-2 md:grid-cols-2">
                              <span className="text-sm text-dark-textLight">{column}</span>
                              <select
                                value={aggregations.perColumn?.[column] || aggregations.defaultOperation || 'sum'}
                                onChange={(event) => handleAggregationChange(column, event.target.value)}
                                className="rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                              >
                                {AGGREGATION_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-dark-textGray">
                      <span>
                        Ausgangszeilen: <span className="text-dark-textLight">{transformationMetaInfo.originalCount}</span>
                      </span>
                      <span>
                        Entfernt durch Filter:{' '}
                        <span className="text-dark-textLight">{transformationMetaInfo.filteredOut}</span>
                      </span>
                      <span>
                        Gruppen nach Aggregation:{' '}
                        <span className="text-dark-textLight">{transformationMetaInfo.aggregatedTo}</span>
                      </span>
                    </div>
                    {transformationWarnings.length > 0 && (
                      <div className="space-y-1 rounded-md border border-yellow-600/40 bg-yellow-900/30 px-3 py-2 text-xs text-yellow-100">
                        <div className="font-semibold text-yellow-200">Hinweise zur Transformation</div>
                        {transformationWarnings.map((message, index) => (
                          <div key={index}>• {message}</div>
                        ))}
                      </div>
                    )}
                    {transformedPreviewRows.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-dark-textLight">Transformierte Daten</h4>
                          <span className="text-xs text-dark-textGray">
                            {transformedRowCount} Zeilen nach Transformation
                          </span>
                        </div>
                        <div className="max-h-64 overflow-auto rounded-lg border border-gray-700">
                          <table className="min-w-full divide-y divide-gray-700 text-sm">
                            <thead className="bg-dark-bg/80 text-xs uppercase tracking-wide text-dark-textGray">
                              <tr>
                                {transformedColumns.map((column) => (
                                  <th key={column} className="px-3 py-2 text-left">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 bg-dark-bg/40 text-dark-textLight">
                              {transformedPreviewRows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {transformedColumns.map((column) => (
                                    <td key={column} className="px-3 py-2 text-xs text-dark-textLight/90">
                                      {formatCellValue(row[column]) || <span className="text-dark-textGray/60">–</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-dark-textGray">
                        Es stehen keine Vorschau-Daten zur Verfügung. Prüfen Sie Filter- und Gruppierungs-Einstellungen.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="space-y-1 rounded-lg border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-100">
                  {validationErrors.map((message, index) => (
                    <div key={index}>• {message}</div>
                  ))}
                </div>
              )}

              {warnings.length > 0 && (
                <div className="space-y-1 rounded-lg border border-yellow-600/40 bg-yellow-900/30 px-4 py-3 text-xs text-yellow-100">
                  <div className="font-semibold text-yellow-200">Hinweise</div>
                  {warnings.map((message, index) => (
                    <div key={index}>• {message}</div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-700 bg-dark-bg/60 px-6 py-4">
          <div className="text-xs text-dark-textGray">
            Ungültige oder leere Werte werden automatisch übersprungen. Filter und Gruppierung können die Datenmenge zusätzlich
            reduzieren.
          </div>
          <div className="space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-dark-textGray hover:text-dark-textLight"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={totalRows === 0 || isLoading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                totalRows === 0 || isLoading
                  ? 'cursor-not-allowed bg-gray-700/70'
                  : 'bg-dark-accent1 hover:bg-dark-accent1/90'
              }`}
            >
              Daten übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

DataImportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  allowMultipleValueColumns: PropTypes.bool,
  requireDatasets: PropTypes.bool
}

