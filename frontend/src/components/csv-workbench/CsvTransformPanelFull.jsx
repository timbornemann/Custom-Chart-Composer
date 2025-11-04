import { useState } from 'react'
import PropTypes from 'prop-types'
import FilterEditor from '../csv/FilterEditor'
import ValueRulesEditor from '../csv/ValueRulesEditor'
import { createUniqueId } from '../csv/utils'
import { AGGREGATION_OPTIONS, DEFAULT_PIVOT_CONFIG, DEFAULT_UNPIVOT_CONFIG } from '../csv/constants'

export default function CsvTransformPanelFull({
  columns,
  mapping,
  transformations,
  onUpdateTransformations
}) {
  const [groupingColumnToAdd, setGroupingColumnToAdd] = useState('')
  
  const filters = transformations.filters || []
  const valueRules = transformations.valueRules || []
  const grouping = transformations.grouping || {}
  const aggregations = transformations.aggregations || {}
  const pivotConfig = { ...DEFAULT_PIVOT_CONFIG, ...(transformations.pivot || {}) }
  const unpivotConfig = { ...DEFAULT_UNPIVOT_CONFIG, ...(transformations.unpivot || {}) }

  const selectedGroupingColumns = Array.isArray(grouping.columns)
    ? grouping.columns.filter((column) => typeof column === 'string').map((column) => column.trim()).filter(Boolean)
    : []

  const groupingColumns = columns.filter((col) => col.type !== 'number')
  const availableGroupingOptions = groupingColumns.filter(
    (col) => !selectedGroupingColumns.includes(col.key)
  )

  // Filter handlers
  const handleAddFilter = () => {
    const id = createUniqueId('filter')
    onUpdateTransformations((prev) => ({
      ...prev,
      filters: [...(prev.filters || []), { id, column: '', operator: 'equalsText', value: '', enabled: true }]
    }))
  }

  const handleFilterChange = (id, changes) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      filters: (prev.filters || []).map((f) => (f.id === id ? { ...f, ...changes } : f))
    }))
  }

  const handleRemoveFilter = (id) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      filters: (prev.filters || []).filter((f) => f.id !== id)
    }))
  }

  const handleToggleFilter = (id, enabled) => {
    handleFilterChange(id, { enabled })
  }

  // Value Rules handlers
  const handleAddValueRule = () => {
    const id = createUniqueId('vrule')
    onUpdateTransformations((prev) => ({
      ...prev,
      valueRules: [
        ...(prev.valueRules || []),
        { id, column: '', when: { operator: 'containsText', value: '' }, action: { type: 'replaceText', search: '', value: '' }, enabled: true }
      ]
    }))
  }

  const handleValueRuleChange = (id, changes) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      valueRules: (prev.valueRules || []).map((r) => (r.id === id ? { ...r, ...changes } : r))
    }))
  }

  const handleRemoveValueRule = (id) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      valueRules: (prev.valueRules || []).filter((r) => r.id !== id)
    }))
  }

  // Grouping handlers
  const handleToggleGrouping = (enabled) => {
    onUpdateTransformations((prev) => {
      const existingColumns = Array.isArray(prev.grouping?.columns)
        ? prev.grouping.columns.filter((col) => typeof col === 'string').map((col) => col.trim()).filter(Boolean)
        : []
      let nextColumns = existingColumns
      if (enabled && existingColumns.length === 0) {
        const fallback = mapping.label || ''
        nextColumns = fallback ? [fallback] : []
      }
      return {
        ...prev,
        grouping: { ...(prev.grouping || {}), enabled, columns: nextColumns }
      }
    })
  }

  const handleAddGroupingColumn = () => {
    const normalized = groupingColumnToAdd.trim()
    if (!normalized) return
    onUpdateTransformations((prev) => {
      const existing = Array.isArray(prev.grouping?.columns)
        ? prev.grouping.columns.filter((val) => typeof val === 'string').map((val) => val.trim()).filter(Boolean)
        : []
      if (existing.includes(normalized)) return prev
      return {
        ...prev,
        grouping: { ...(prev.grouping || {}), columns: [...existing, normalized] }
      }
    })
    setGroupingColumnToAdd('')
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
        grouping: { ...(prev.grouping || {}), columns: next }
      }
    })
  }

  // Aggregation handlers
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-700/40 bg-blue-900/20 p-3">
        <div className="flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <div className="text-xs text-blue-200">
            <strong>Was sind Transformationen?</strong>
            <p className="mt-1">
              Bearbeiten Sie Ihre Daten bevor sie ans Diagramm gesendet werden: Filtern, Gruppieren, Werte ersetzen, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Value Rules */}
      <details open>
        <summary className="cursor-pointer text-sm font-semibold text-dark-textLight mb-2">
          Werte-Regeln ({valueRules.length})
        </summary>
        <ValueRulesEditor
          columns={columns}
          valueRules={valueRules}
          onAddRule={handleAddValueRule}
          onRemoveRule={handleRemoveValueRule}
          onChangeRule={handleValueRuleChange}
        />
      </details>

      {/* Filters */}
      <details open>
        <summary className="cursor-pointer text-sm font-semibold text-dark-textLight mb-2">
          Filter ({filters.length})
        </summary>
        <FilterEditor
          columns={columns}
          filters={filters}
          onAddFilter={handleAddFilter}
          onToggleFilter={handleToggleFilter}
          onChangeFilter={handleFilterChange}
          onRemoveFilter={handleRemoveFilter}
        />
      </details>

      {/* Grouping & Aggregation */}
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-dark-textLight mb-2">
          Gruppierung & Aggregation
        </summary>
        <div className="space-y-3 mt-2">
          <label className="flex items-center justify-between rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
            <div>
              <span className="text-sm font-medium text-dark-textLight">Gruppierung aktivieren</span>
              <p className="text-xs text-dark-textGray mt-0.5">
                Zeilen nach Spalten gruppieren
              </p>
            </div>
            <input
              type="checkbox"
              checked={grouping.enabled || false}
              onChange={(e) => handleToggleGrouping(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
            />
          </label>

          {grouping.enabled && (
            <div className="space-y-2">
              {selectedGroupingColumns.length > 0 && (
                <div className="space-y-1">
                  {selectedGroupingColumns.map((colKey, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex-1 rounded border border-gray-700 bg-dark-secondary px-2 py-1 text-sm text-dark-textLight">
                        {colKey}
                      </span>
                      <button
                        onClick={() => handleRemoveGroupingColumn(index)}
                        className="rounded border border-red-600 px-2 py-1 text-xs text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <select
                  value={groupingColumnToAdd}
                  onChange={(e) => setGroupingColumnToAdd(e.target.value)}
                  className="flex-1 rounded border border-gray-700 bg-dark-bg px-2 py-1 text-sm text-dark-textLight"
                >
                  <option value="">Spalte hinzufügen...</option>
                  {availableGroupingOptions.map((col) => (
                    <option key={col.key} value={col.key}>{col.key}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddGroupingColumn}
                  disabled={!groupingColumnToAdd}
                  className="rounded border border-gray-700 px-3 py-1 text-sm text-dark-textLight disabled:opacity-40"
                >
                  +
                </button>
              </div>

              {/* Aggregation */}
              <div className="mt-3">
                <label className="block text-xs font-semibold text-dark-textGray mb-1">
                  Standard-Aggregation
                </label>
                <select
                  value={aggregations.defaultOperation || 'sum'}
                  onChange={(e) => handleAggregationDefaultChange(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-dark-bg px-2 py-1 text-sm text-dark-textLight"
                >
                  {AGGREGATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {mapping.valueColumns?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-dark-textGray">Pro-Spalte:</div>
                  {mapping.valueColumns.map((col) => (
                    <div key={col} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-dark-textLight">{col}</span>
                      <select
                        value={aggregations.perColumn?.[col] || aggregations.defaultOperation || 'sum'}
                        onChange={(e) => handleAggregationChange(col, e.target.value)}
                        className="rounded border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight"
                      >
                        {AGGREGATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </details>
    </div>
  )
}

CsvTransformPanelFull.propTypes = {
  columns: PropTypes.array.isRequired,
  mapping: PropTypes.object.isRequired,
  transformations: PropTypes.object.isRequired,
  onUpdateTransformations: PropTypes.func.isRequired
}

