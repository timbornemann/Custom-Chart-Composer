import { useMemo } from 'react'
import PropTypes from 'prop-types'
import Papa from 'papaparse'
import { computePivotTable, PIVOT_AGGREGATION_LABELS } from '../../utils/csv/pivot'
import { AGGREGATION_OPTIONS } from '../csv/constants'

const DEFAULT_PIVOT_CONFIG = {
  scope: 'transformed',
  rowFields: [],
  columnFields: [],
  values: []
}

const SCOPE_OPTIONS = [
  { value: 'transformed', label: 'Transformierte Daten' },
  { value: 'raw', label: 'Originaldaten' }
]

const dedupeList = (list = []) => {
  const result = []
  const seen = new Set()
  list.forEach((value) => {
    if (typeof value !== 'string') {
      return
    }
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) {
      return
    }
    seen.add(trimmed)
    result.push(trimmed)
  })
  return result
}

const normalizePivotConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return {
      ...DEFAULT_PIVOT_CONFIG,
      rowFields: [],
      columnFields: [],
      values: []
    }
  }

  const scope = config.scope === 'raw' ? 'raw' : 'transformed'
  const rowFields = dedupeList(config.rowFields)
  const columnFields = dedupeList(config.columnFields)
  const values = Array.isArray(config.values)
    ? config.values.map((value) => ({
        column: typeof value?.column === 'string' ? value.column : '',
        aggregator: typeof value?.aggregator === 'string' ? value.aggregator : 'sum',
        label: typeof value?.label === 'string' ? value.label : ''
      }))
    : []

  return { scope, rowFields, columnFields, values }
}

const clonePivotConfig = (config) => ({
  scope: config.scope,
  rowFields: [...config.rowFields],
  columnFields: [...config.columnFields],
  values: config.values.map((value) => ({ ...value }))
})

const resolveColumnLabel = (columnMap, key) => {
  if (!key) {
    return ''
  }
  const column = columnMap.get(key)
  if (!column) {
    return key
  }
  return (
    (typeof column.displayName === 'string' && column.displayName) ||
    (typeof column.label === 'string' && column.label) ||
    (typeof column.name === 'string' && column.name) ||
    column.key ||
    key
  )
}

const formatSummary = (rowFields, columnFields, values) => {
  const parts = []
  if (rowFields.length > 0) {
    parts.push(`${rowFields.length} Zeilenfeld${rowFields.length === 1 ? '' : 'er'}`)
  }
  if (columnFields.length > 0) {
    parts.push(`${columnFields.length} Spaltenfeld${columnFields.length === 1 ? '' : 'er'}`)
  }
  if (values.length > 0) {
    parts.push(`${values.length} Kennzahl${values.length === 1 ? '' : 'en'}`)
  }
  if (parts.length === 0) {
    return 'Konfigurieren Sie Zeilen-, Spalten- und Wertefelder für die Pivot-Tabelle.'
  }
  return parts.join(' · ')
}

const buildDefaultValueEntry = (columns, numericColumns) => {
  const preferred = (numericColumns[0] || columns[0])?.key || ''
  return { column: preferred, aggregator: 'sum', label: '' }
}

const aggregationLabelMap = new Map(AGGREGATION_OPTIONS.map((entry) => [entry.value, entry.label]))

const scopeLabelMap = new Map(SCOPE_OPTIONS.map((option) => [option.value, option.label]))

const formatMetaLine = (meta, scope) => {
  if (!meta) {
    return ''
  }
  const parts = []
  parts.push(`${meta.sourceRowCount || 0} Zeilen`)
  parts.push(`Zeilengruppen: ${meta.rowGroupCount || 0}`)
  parts.push(`Spaltenkombinationen: ${meta.columnGroupCount || 0}`)
  parts.push(`Kennzahlen: ${meta.valueCount || 0}`)
  const scopeLabel = scopeLabelMap.get(scope) || 'Transformierte Daten'
  return `${scopeLabel} · ${parts.join(' · ')}`
}

export default function PivotBuilder({
  columns = [],
  rawRows = [],
  transformedRows = [],
  pivotConfig,
  onUpdateTransformations,
  registerVersionEvent
}) {
  const normalizedConfig = useMemo(() => normalizePivotConfig(pivotConfig), [pivotConfig])
  const { scope, rowFields, columnFields, values } = normalizedConfig

  const columnsArray = Array.isArray(columns) ? columns : []
  const columnMap = useMemo(() => {
    const map = new Map()
    columnsArray.forEach((column) => {
      if (column && typeof column.key === 'string') {
        map.set(column.key, column)
      }
    })
    return map
  }, [columnsArray])

  const numericColumns = useMemo(
    () => columnsArray.filter((column) => column?.type === 'number'),
    [columnsArray]
  )

  const availableRowColumns = useMemo(
    () => columnsArray.filter((column) => !rowFields.includes(column.key)),
    [columnsArray, rowFields]
  )

  const availableColumnColumns = useMemo(
    () => columnsArray.filter((column) => !columnFields.includes(column.key)),
    [columnsArray, columnFields]
  )

  const safeRawRows = Array.isArray(rawRows) ? rawRows : []
  const safeTransformedRows = Array.isArray(transformedRows) ? transformedRows : []
  const sourceRows = scope === 'raw' ? safeRawRows : safeTransformedRows

  const pivotResult = useMemo(
    () => computePivotTable(sourceRows, normalizedConfig, { columns: columnsArray }),
    [sourceRows, normalizedConfig, columnsArray]
  )

  const emitPivotEvent = (description, configSnapshot, extraMeta = {}) => {
    if (typeof registerVersionEvent !== 'function') {
      return
    }
    const valueMeta = Array.isArray(configSnapshot.values)
      ? configSnapshot.values.map((entry) => ({
          column: entry.column,
          aggregator: entry.aggregator,
          label: entry.label || ''
        }))
      : []
    registerVersionEvent({
      type: 'pivot-builder',
      description,
      scope: configSnapshot.scope === 'raw' ? 'raw' : 'transformed',
      meta: {
        rowFields: configSnapshot.rowFields,
        columnFields: configSnapshot.columnFields,
        values: valueMeta,
        ...extraMeta
      }
    })
  }

  const updatePivotConfig = (updater, description, extraMeta) => {
    if (typeof onUpdateTransformations !== 'function') {
      return
    }
    let snapshot = null
    onUpdateTransformations((previous) => {
      const baseRaw =
        previous && typeof previous === 'object' && previous.pivotTable && typeof previous.pivotTable === 'object'
          ? previous.pivotTable
          : {}
      const currentNormalized = normalizePivotConfig(baseRaw)
      const draft = clonePivotConfig(currentNormalized)
      const result = updater(draft, currentNormalized)
      if (!result) {
        return previous
      }
      const normalizedNext = normalizePivotConfig(result)
      snapshot = normalizedNext
      const merged = { ...baseRaw, ...normalizedNext }
      return { ...previous, pivotTable: merged }
    })
    if (snapshot && description) {
      emitPivotEvent(description, snapshot, extraMeta)
    }
  }

  const handleScopeChange = (nextScope) => {
    const normalized = nextScope === 'raw' ? 'raw' : 'transformed'
    if (normalized === scope) {
      return
    }
    updatePivotConfig(
      (draft) => {
        draft.scope = normalized
        return draft
      },
      `Pivot: Datenbasis auf ${scopeLabelMap.get(normalized) || 'Transformierte Daten'} gesetzt`
    )
  }

  const handleAddRowField = (columnKey) => {
    if (!columnKey || rowFields.includes(columnKey)) {
      return
    }
    const label = resolveColumnLabel(columnMap, columnKey) || columnKey
    updatePivotConfig(
      (draft) => {
        if (draft.rowFields.includes(columnKey)) {
          return null
        }
        draft.rowFields.push(columnKey)
        return draft
      },
      `Pivot: Zeilenfeld „${label}“ hinzugefügt`
    )
  }

  const handleRemoveRowField = (index) => {
    if (index < 0 || index >= rowFields.length) {
      return
    }
    const key = rowFields[index]
    const label = resolveColumnLabel(columnMap, key) || key
    updatePivotConfig(
      (draft) => {
        if (index < 0 || index >= draft.rowFields.length) {
          return null
        }
        draft.rowFields.splice(index, 1)
        return draft
      },
      `Pivot: Zeilenfeld „${label}“ entfernt`
    )
  }

  const handleMoveRowField = (from, to) => {
    if (from === to || from < 0 || to < 0 || from >= rowFields.length || to >= rowFields.length) {
      return
    }
    const key = rowFields[from]
    const label = resolveColumnLabel(columnMap, key) || key
    updatePivotConfig(
      (draft) => {
        if (from < 0 || to < 0 || from >= draft.rowFields.length || to >= draft.rowFields.length) {
          return null
        }
        const [moved] = draft.rowFields.splice(from, 1)
        draft.rowFields.splice(to, 0, moved)
        return draft
      },
      `Pivot: Zeilenfeld „${label}“ neu angeordnet`
    )
  }

  const handleAddColumnField = (columnKey) => {
    if (!columnKey || columnFields.includes(columnKey)) {
      return
    }
    const label = resolveColumnLabel(columnMap, columnKey) || columnKey
    updatePivotConfig(
      (draft) => {
        if (draft.columnFields.includes(columnKey)) {
          return null
        }
        draft.columnFields.push(columnKey)
        return draft
      },
      `Pivot: Spaltenfeld „${label}“ hinzugefügt`
    )
  }

  const handleRemoveColumnField = (index) => {
    if (index < 0 || index >= columnFields.length) {
      return
    }
    const key = columnFields[index]
    const label = resolveColumnLabel(columnMap, key) || key
    updatePivotConfig(
      (draft) => {
        if (index < 0 || index >= draft.columnFields.length) {
          return null
        }
        draft.columnFields.splice(index, 1)
        return draft
      },
      `Pivot: Spaltenfeld „${label}“ entfernt`
    )
  }

  const handleMoveColumnField = (from, to) => {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= columnFields.length ||
      to >= columnFields.length
    ) {
      return
    }
    const key = columnFields[from]
    const label = resolveColumnLabel(columnMap, key) || key
    updatePivotConfig(
      (draft) => {
        if (from < 0 || to < 0 || from >= draft.columnFields.length || to >= draft.columnFields.length) {
          return null
        }
        const [moved] = draft.columnFields.splice(from, 1)
        draft.columnFields.splice(to, 0, moved)
        return draft
      },
      `Pivot: Spaltenfeld „${label}“ neu angeordnet`
    )
  }

  const handleAddValue = () => {
    const entry = buildDefaultValueEntry(columnsArray, numericColumns)
    updatePivotConfig(
      (draft) => {
        draft.values.push({ ...entry })
        return draft
      },
      'Pivot: Kennzahl hinzugefügt'
    )
  }

  const handleRemoveValue = (index) => {
    if (index < 0 || index >= values.length) {
      return
    }
    const entry = values[index] || { column: '', aggregator: 'sum', label: '' }
    const columnLabel = resolveColumnLabel(columnMap, entry.column) || entry.column || `#${index + 1}`
    updatePivotConfig(
      (draft) => {
        if (index < 0 || index >= draft.values.length) {
          return null
        }
        draft.values.splice(index, 1)
        return draft
      },
      `Pivot: Kennzahl „${columnLabel}“ entfernt`
    )
  }

  const handleMoveValue = (from, to) => {
    if (from === to || from < 0 || to < 0 || from >= values.length || to >= values.length) {
      return
    }
    const entry = values[from]
    const columnLabel = resolveColumnLabel(columnMap, entry?.column) || entry?.column || `#${from + 1}`
    updatePivotConfig(
      (draft) => {
        if (from < 0 || to < 0 || from >= draft.values.length || to >= draft.values.length) {
          return null
        }
        const [moved] = draft.values.splice(from, 1)
        draft.values.splice(to, 0, moved)
        return draft
      },
      `Pivot: Reihenfolge der Kennzahl „${columnLabel}“ geändert`
    )
  }

  const handleValueColumnChange = (index, columnKey) => {
    if (index < 0 || index >= values.length) {
      return
    }
    const normalized = typeof columnKey === 'string' ? columnKey : ''
    if (values[index].column === normalized) {
      return
    }
    const label = resolveColumnLabel(columnMap, normalized) || normalized || `#${index + 1}`
    updatePivotConfig(
      (draft) => {
        if (index < 0 || index >= draft.values.length) {
          return null
        }
        draft.values[index] = { ...draft.values[index], column: normalized }
        return draft
      },
      `Pivot: Kennzahl ${index + 1} nutzt nun „${label}“`
    )
  }

  const handleValueAggregatorChange = (index, aggregator) => {
    if (index < 0 || index >= values.length) {
      return
    }
    const normalized = typeof aggregator === 'string' && aggregator ? aggregator : 'sum'
    if (values[index].aggregator === normalized) {
      return
    }
    const label = aggregationLabelMap.get(normalized) || PIVOT_AGGREGATION_LABELS[normalized] || normalized
    const columnLabel = resolveColumnLabel(columnMap, values[index].column) || values[index].column || `#${index + 1}`
    updatePivotConfig(
      (draft) => {
        if (index < 0 || index >= draft.values.length) {
          return null
        }
        draft.values[index] = { ...draft.values[index], aggregator: normalized }
        return draft
      },
      `Pivot: Aggregation von „${columnLabel}“ auf ${label} gesetzt`
    )
  }

  const handleValueLabelChange = (index, labelValue) => {
    if (index < 0 || index >= values.length) {
      return
    }
    const normalized = typeof labelValue === 'string' ? labelValue : ''
    if ((values[index].label || '') === normalized) {
      return
    }
    const columnLabel = resolveColumnLabel(columnMap, values[index].column) || values[index].column || `#${index + 1}`
    updatePivotConfig(
      (draft) => {
        if (index < 0 || index >= draft.values.length) {
          return null
        }
        draft.values[index] = { ...draft.values[index], label: normalized }
        return draft
      },
      `Pivot: Kennzahl „${columnLabel}“ umbenannt`
    )
  }

  const handleExport = () => {
    if (!pivotResult || !Array.isArray(pivotResult.rows) || pivotResult.rows.length === 0) {
      window.alert('Kein Pivot-Ergebnis zum Exportieren vorhanden.')
      return
    }
    const csv = Papa.unparse({
      fields: pivotResult.headers,
      data: pivotResult.rows.map((row) => row.map((value) => (value === null || value === undefined ? '' : value)))
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0]
    link.setAttribute('download', `pivot-${scope}-${timestamp}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    emitPivotEvent('Pivot: Ergebnis exportiert', normalizedConfig, {
      action: 'export',
      rows: pivotResult.rows.length,
      columns: pivotResult.headers.length
    })
  }

  const summaryText = formatSummary(rowFields, columnFields, values)
  const hasPivotRows = Array.isArray(pivotResult.rows) && pivotResult.rows.length > 0
  const metaLine = formatMetaLine(pivotResult.meta, scope)

  return (
    <section className="space-y-4 rounded-xl border border-gray-700 bg-dark-bg/40 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-dark-textLight">Pivot-Builder</h3>
          <p className="text-xs text-dark-textGray">{summaryText}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!hasPivotRows}
            className="rounded-md border border-gray-600 px-3 py-1.5 text-xs text-dark-textGray transition-colors hover:border-dark-accent1 hover:text-dark-textLight disabled:cursor-not-allowed disabled:opacity-50"
          >
            Exportieren
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wide text-dark-textGray">Datenbasis</label>
          <select
            value={scope}
            onChange={(event) => handleScopeChange(event.target.value)}
            className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
          >
            {SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wide text-dark-textGray">Zeilenfelder</label>
          <div className="space-y-2">
            {rowFields.length === 0 ? (
              <p className="text-xs text-dark-textGray">Keine Zeilenfelder ausgewählt.</p>
            ) : (
              rowFields.map((field, index) => (
                <div
                  key={`pivot-row-${field}-${index}`}
                  className="flex items-center gap-2 rounded-lg border border-gray-700/60 bg-dark-bg/60 px-2 py-1.5"
                >
                  <span className="flex-1 text-sm text-dark-textLight">{resolveColumnLabel(columnMap, field)}</span>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveRowField(index, index - 1)}
                        className="rounded p-1 text-xs text-dark-textGray transition-colors hover:bg-gray-700 hover:text-dark-textLight"
                        title="Nach oben"
                      >
                        ↑
                      </button>
                    )}
                    {index < rowFields.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveRowField(index, index + 1)}
                        className="rounded p-1 text-xs text-dark-textGray transition-colors hover:bg-gray-700 hover:text-dark-textLight"
                        title="Nach unten"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveRowField(index)}
                      className="rounded p-1 text-xs text-dark-textGray transition-colors hover:bg-gray-700 hover:text-dark-textLight"
                      title="Entfernen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
            <select
              value=""
              onChange={(event) => handleAddRowField(event.target.value)}
              className="w-full rounded-md border border-dashed border-gray-700 bg-dark-secondary/60 px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="">Zeilenfeld hinzufügen…</option>
              {availableRowColumns.map((column) => (
                <option key={`row-option-${column.key}`} value={column.key}>
                  {resolveColumnLabel(columnMap, column.key)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wide text-dark-textGray">Spaltenfelder</label>
          <div className="space-y-2">
            {columnFields.length === 0 ? (
              <p className="text-xs text-dark-textGray">Keine Spaltenfelder ausgewählt.</p>
            ) : (
              columnFields.map((field, index) => (
                <div
                  key={`pivot-column-${field}-${index}`}
                  className="flex items-center gap-2 rounded-lg border border-gray-700/60 bg-dark-bg/60 px-2 py-1.5"
                >
                  <span className="flex-1 text-sm text-dark-textLight">{resolveColumnLabel(columnMap, field)}</span>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveColumnField(index, index - 1)}
                        className="rounded p-1 text-xs text-dark-textGray transition-colors hover:bg-gray-700 hover:text-dark-textLight"
                        title="Nach oben"
                      >
                        ↑
                      </button>
                    )}
                    {index < columnFields.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveColumnField(index, index + 1)}
                        className="rounded p-1 text-xs text-dark-textGray transition-colors hover:bg-gray-700 hover:text-dark-textLight"
                        title="Nach unten"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveColumnField(index)}
                      className="rounded p-1 text-xs text-dark-textGray transition-colors hover:bg-gray-700 hover:text-dark-textLight"
                      title="Entfernen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
            <select
              value=""
              onChange={(event) => handleAddColumnField(event.target.value)}
              className="w-full rounded-md border border-dashed border-gray-700 bg-dark-secondary/60 px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="">Spaltenfeld hinzufügen…</option>
              {availableColumnColumns.map((column) => (
                <option key={`column-option-${column.key}`} value={column.key}>
                  {resolveColumnLabel(columnMap, column.key)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wide text-dark-textGray">Kennzahlen</label>
          <div className="space-y-2">
            {values.length === 0 ? (
              <p className="text-xs text-dark-textGray">Noch keine Kennzahlen konfiguriert.</p>
            ) : (
              values.map((entry, index) => (
                <div
                  key={`pivot-value-${index}-${entry.column}-${entry.aggregator}`}
                  className="rounded-lg border border-gray-700/60 bg-dark-bg/60 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wide text-dark-textGray">Spalte</span>
                      <select
                        value={entry.column}
                        onChange={(event) => handleValueColumnChange(index, event.target.value)}
                        className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                      >
                        <option value="">Spalte auswählen…</option>
                        {columnsArray.map((column) => (
                          <option key={`value-column-${column.key}`} value={column.key}>
                            {resolveColumnLabel(columnMap, column.key)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wide text-dark-textGray">Aggregation</span>
                      <select
                        value={entry.aggregator || 'sum'}
                        onChange={(event) => handleValueAggregatorChange(index, event.target.value)}
                        className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                      >
                        {AGGREGATION_OPTIONS.map((option) => (
                          <option key={`agg-option-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wide text-dark-textGray">Beschriftung</span>
                      <input
                        type="text"
                        value={entry.label || ''}
                        onChange={(event) => handleValueLabelChange(index, event.target.value)}
                        placeholder={`${resolveColumnLabel(columnMap, entry.column) || 'Kennzahl'} (${aggregationLabelMap.get(entry.aggregator || 'sum') || PIVOT_AGGREGATION_LABELS[entry.aggregator] || entry.aggregator || 'Summe'})`}
                        className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveValue(index, index - 1)}
                        className="rounded p-1 text-xs text-dark-textGray transition-colors hover:bg-gray-700 hover:text-dark-textLight"
                        title="Nach oben"
                      >
                        ↑
                      </button>
                    )}
                    {index < values.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveValue(index, index + 1)}
                        className="rounded p-1 text-xs text-dark-textGray transition-colors hover:bg-gray-700 hover:text-dark-textLight"
                        title="Nach unten"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(index)}
                      className="rounded p-1 text-xs text-dark-textGray transition-colors hover:bg-gray-700 hover:text-dark-textLight"
                      title="Entfernen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={handleAddValue}
              className="w-full rounded-md border border-dashed border-gray-700 px-3 py-1.5 text-xs text-dark-textLight transition-colors hover:border-dark-accent1"
            >
              Kennzahl hinzufügen
            </button>
          </div>
        </div>
      </div>

      {pivotResult.warnings.length > 0 && (
        <div className="space-y-1 rounded-md border border-yellow-700/60 bg-yellow-900/20 p-3 text-xs text-yellow-200">
          {pivotResult.warnings.map((warning, index) => (
            <div key={`pivot-warning-${index}`}>{warning}</div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-dark-textLight">Pivot-Ergebnis</h4>
          <span className="text-xs text-dark-textGray">{metaLine}</span>
        </div>
        {hasPivotRows ? (
          <div className="overflow-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 text-xs text-dark-textLight">
              <thead className="bg-dark-secondary/60 text-[10px] uppercase tracking-wide text-dark-textGray">
                <tr>
                  {pivotResult.headers.map((header, index) => (
                    <th key={`pivot-head-${index}`} className="px-3 py-2 text-left font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {pivotResult.rows.map((row, rowIndex) => (
                  <tr key={`pivot-row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`pivot-cell-${rowIndex}-${cellIndex}`} className="px-3 py-1.5">
                        {cell === null || cell === undefined || cell === '' ? '–' : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-700 bg-dark-bg/40 p-4 text-xs text-dark-textGray">
            Keine Pivot-Daten für die aktuelle Konfiguration.
          </div>
        )}
      </div>
    </section>
  )
}

PivotBuilder.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object),
  rawRows: PropTypes.arrayOf(PropTypes.object),
  transformedRows: PropTypes.arrayOf(PropTypes.object),
  pivotConfig: PropTypes.object,
  onUpdateTransformations: PropTypes.func.isRequired,
  registerVersionEvent: PropTypes.func
}

