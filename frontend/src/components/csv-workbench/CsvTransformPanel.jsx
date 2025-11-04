import PropTypes from 'prop-types'
import FilterEditor from '../csv/FilterEditor'
import ValueRulesEditor from '../csv/ValueRulesEditor'
import { createUniqueId } from '../csv/utils'

export default function CsvTransformPanel({
  columns,
  transformations,
  onUpdateTransformations
}) {
  const filters = transformations.filters || []
  const valueRules = transformations.valueRules || []
  const grouping = transformations.grouping || {}

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

  const handleToggleGrouping = (enabled) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      grouping: { ...(prev.grouping || {}), enabled }
    }))
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-dark-textLight mb-2">Transformationen</h3>
        <p className="text-xs text-dark-textGray mb-4">
          Filter, Werte-Regeln und Gruppierungen anwenden
        </p>
      </div>

      {/* Value Rules */}
      <ValueRulesEditor
        columns={columns}
        valueRules={valueRules}
        onAddRule={handleAddValueRule}
        onRemoveRule={handleRemoveValueRule}
        onChangeRule={handleValueRuleChange}
      />

      {/* Filters */}
      <FilterEditor
        columns={columns}
        filters={filters}
        onAddFilter={handleAddFilter}
        onToggleFilter={handleToggleFilter}
        onChangeFilter={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
      />

      {/* Grouping Toggle */}
      <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-dark-textLight">Gruppierung</span>
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
      </div>
    </div>
  )
}

CsvTransformPanel.propTypes = {
  columns: PropTypes.array.isRequired,
  transformations: PropTypes.object.isRequired,
  onUpdateTransformations: PropTypes.func.isRequired
}

