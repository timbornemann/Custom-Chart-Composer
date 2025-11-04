import PropTypes from 'prop-types'
import { AGGREGATION_OPTIONS } from '../csv/constants'

export default function GroupingCard({
  columns,
  mapping,
  grouping = {},
  aggregations = {},
  onUpdateTransformations
}) {
  const selectedGroupingColumns = Array.isArray(grouping.columns)
    ? grouping.columns.filter((col) => typeof col === 'string').map((col) => col.trim()).filter(Boolean)
    : []

  const groupingColumns = columns.filter((col) => col.type !== 'number')
  const availableGroupingOptions = groupingColumns.filter(
    (col) => !selectedGroupingColumns.includes(col.key)
  )

  // Aggregation columns - use aggregations.valueColumns if available, otherwise fall back to mapping.valueColumns
  const selectedAggregationColumns = Array.isArray(aggregations.valueColumns)
    ? aggregations.valueColumns.filter((col) => typeof col === 'string').map((col) => col.trim()).filter(Boolean)
    : (mapping.valueColumns?.length > 0 ? mapping.valueColumns : [])

  const numericColumns = columns.filter((col) => col.type === 'number')
  const availableAggregationOptions = numericColumns.filter(
    (col) => !selectedAggregationColumns.includes(col.key)
  )

  const handleAddGroupingColumn = (columnKey) => {
    if (!columnKey) return
    onUpdateTransformations((prev) => {
      const existing = Array.isArray(prev.grouping?.columns)
        ? prev.grouping.columns.filter((val) => typeof val === 'string').map((val) => val.trim()).filter(Boolean)
        : []
      if (existing.includes(columnKey)) return prev
      return {
        ...prev,
        grouping: { ...(prev.grouping || {}), enabled: true, columns: [...existing, columnKey] }
      }
    })
  }

  const handleRemoveGroupingColumn = (index) => {
    onUpdateTransformations((prev) => {
      const existing = Array.isArray(prev.grouping?.columns)
        ? prev.grouping.columns.filter((val) => typeof val === 'string').map((val) => val.trim()).filter(Boolean)
        : []
      if (index < 0 || index >= existing.length) return prev
      const next = existing.filter((_, idx) => idx !== index)
      return {
        ...prev,
        grouping: { ...(prev.grouping || {}), enabled: next.length > 0, columns: next }
      }
    })
  }

  const handleReorderGroupingColumns = (fromIndex, toIndex) => {
    onUpdateTransformations((prev) => {
      const existing = Array.isArray(prev.grouping?.columns)
        ? prev.grouping.columns.filter((val) => typeof val === 'string').map((val) => val.trim()).filter(Boolean)
        : []
      if (fromIndex < 0 || fromIndex >= existing.length || toIndex < 0 || toIndex >= existing.length) return prev
      const next = [...existing]
      const [removed] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, removed)
      return {
        ...prev,
        grouping: { ...(prev.grouping || {}), columns: next }
      }
    })
  }

  const handleAddAggregationColumn = (columnKey) => {
    if (!columnKey) return
    onUpdateTransformations((prev) => {
      const existing = Array.isArray(prev.aggregations?.valueColumns)
        ? prev.aggregations.valueColumns.filter((val) => typeof val === 'string').map((val) => val.trim()).filter(Boolean)
        : []
      if (existing.includes(columnKey)) return prev
      return {
        ...prev,
        aggregations: {
          ...(prev.aggregations || {}),
          valueColumns: [...existing, columnKey]
        }
      }
    })
  }

  const handleRemoveAggregationColumn = (index) => {
    onUpdateTransformations((prev) => {
      const existing = Array.isArray(prev.aggregations?.valueColumns)
        ? prev.aggregations.valueColumns.filter((val) => typeof val === 'string').map((val) => val.trim()).filter(Boolean)
        : []
      if (index < 0 || index >= existing.length) return prev
      const next = existing.filter((_, idx) => idx !== index)
      const removedKey = existing[index]
      const perColumn = prev.aggregations?.perColumn || {}
      const nextPerColumn = { ...perColumn }
      if (removedKey && nextPerColumn[removedKey]) {
        delete nextPerColumn[removedKey]
      }
      return {
        ...prev,
        aggregations: {
          ...(prev.aggregations || {}),
          valueColumns: next,
          perColumn: nextPerColumn
        }
      }
    })
  }

  const handleAggregationDefaultChange = (operation) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      aggregations: {
        ...(prev.aggregations || {}),
        defaultOperation: operation
      }
    }))
  }

  const handleAggregationChange = (column, operation) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      aggregations: {
        ...(prev.aggregations || {}),
        perColumn: {
          ...(prev.aggregations?.perColumn || {}),
          [column]: operation
        }
      }
    }))
  }

  const isGroupingActive = selectedGroupingColumns.length > 0

  return (
    <div className="rounded-xl border border-gray-700 bg-gradient-to-br from-dark-secondary/50 to-dark-secondary/30 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-dark-secondary/40 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-dark-accent1/20 text-dark-accent1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight">Gruppierung & Aggregation</h3>
            <p className="text-xs text-dark-textGray mt-0.5">
              {isGroupingActive ? `${selectedGroupingColumns.length} Gruppierung${selectedGroupingColumns.length !== 1 ? 'en' : ''}, ${selectedAggregationColumns.length} Aggregation${selectedAggregationColumns.length !== 1 ? 'en' : ''}` : 'Zeilen gruppieren und aggregieren'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Gruppierungsspalten */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-dark-accent1/20 text-dark-accent1 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <label className="text-sm font-semibold text-dark-textLight">Gruppierung nach Spalten</label>
          </div>

          {selectedGroupingColumns.length > 0 && (
            <div className="space-y-2">
              {selectedGroupingColumns.map((colKey, index) => (
                <div
                  key={`${colKey}-${index}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-dark-bg/60 border border-gray-700/50 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="flex items-center justify-center w-5 h-5 rounded bg-dark-accent1/10 text-dark-accent1 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-dark-textLight font-medium">{colKey}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        onClick={() => handleReorderGroupingColumns(index, index - 1)}
                        className="p-1 rounded hover:bg-gray-700 text-dark-textGray hover:text-dark-textLight transition-colors"
                        title="Nach oben"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {index < selectedGroupingColumns.length - 1 && (
                      <button
                        onClick={() => handleReorderGroupingColumns(index, index + 1)}
                        className="p-1 rounded hover:bg-gray-700 text-dark-textGray hover:text-dark-textLight transition-colors"
                        title="Nach unten"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveGroupingColumn(index)}
                      className="p-1 rounded hover:bg-red-600/20 text-dark-textGray hover:text-red-400 transition-colors"
                      title="Entfernen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {availableGroupingOptions.length > 0 && (
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddGroupingColumn(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="flex-1 rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:outline-none focus:ring-2 focus:ring-dark-accent1/50 focus:border-transparent"
              >
                <option value="">+ Spalte für Gruppierung hinzufügen</option>
                {availableGroupingOptions.map((col) => (
                  <option key={col.key} value={col.key}>{col.key}</option>
                ))}
              </select>
            </div>
          )}

          {availableGroupingOptions.length === 0 && selectedGroupingColumns.length === 0 && (
            <p className="text-xs text-dark-textGray italic">Keine Spalten für Gruppierung verfügbar</p>
          )}
        </div>

        {/* Aggregationen */}
        <div className="space-y-3 pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-green-600/20 text-green-400 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <label className="text-sm font-semibold text-dark-textLight">Aggregationen</label>
          </div>

          {/* Standard-Aggregation */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dark-textGray">Standard-Aggregation</label>
            <select
              value={aggregations.defaultOperation || 'sum'}
              onChange={(e) => handleAggregationDefaultChange(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:outline-none focus:ring-2 focus:ring-dark-accent1/50 focus:border-transparent"
            >
              {AGGREGATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-dark-textGray">Diese Aggregation wird für alle Spalten verwendet, wenn keine spezifische Operation gewählt wurde.</p>
          </div>

          {/* Aggregationsspalten */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-dark-textGray">Spalten für Aggregation</label>
            
            {selectedAggregationColumns.length > 0 && (
              <div className="space-y-2">
                {selectedAggregationColumns.map((colKey, index) => {
                  const currentOperation = aggregations.perColumn?.[colKey] || aggregations.defaultOperation || 'sum'
                  return (
                    <div
                      key={`${colKey}-${index}`}
                      className="flex items-center gap-2 p-3 rounded-lg bg-dark-bg/60 border border-gray-700/50 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded bg-green-600/20 text-green-400 text-xs font-semibold flex-shrink-0">
                          Σ
                        </div>
                        <span className="text-sm text-dark-textLight font-medium truncate">{colKey}</span>
                      </div>
                      <select
                        value={currentOperation}
                        onChange={(e) => handleAggregationChange(colKey, e.target.value)}
                        className="rounded-lg border border-gray-700 bg-dark-bg px-3 py-1.5 text-xs text-dark-textLight focus:outline-none focus:ring-2 focus:ring-dark-accent1/50 focus:border-transparent min-w-[180px]"
                      >
                        {AGGREGATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveAggregationColumn(index)}
                        className="p-1.5 rounded hover:bg-red-600/20 text-dark-textGray hover:text-red-400 transition-colors flex-shrink-0"
                        title="Spalte entfernen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {availableAggregationOptions.length > 0 && (
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddAggregationColumn(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:outline-none focus:ring-2 focus:ring-dark-accent1/50 focus:border-transparent"
                >
                  <option value="">+ Spalte für Aggregation hinzufügen</option>
                  {availableAggregationOptions.map((col) => (
                    <option key={col.key} value={col.key}>{col.key}</option>
                  ))}
                </select>
              </div>
            )}

            {availableAggregationOptions.length === 0 && selectedAggregationColumns.length === 0 && (
              <p className="text-xs text-dark-textGray italic">Keine numerischen Spalten für Aggregation verfügbar</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

GroupingCard.propTypes = {
  columns: PropTypes.array.isRequired,
  mapping: PropTypes.object.isRequired,
  grouping: PropTypes.object,
  aggregations: PropTypes.object,
  onUpdateTransformations: PropTypes.func.isRequired
}

