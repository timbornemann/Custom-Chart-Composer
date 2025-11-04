import PropTypes from 'prop-types'
import FilterEditor from '../csv/FilterEditor'
import ValueRulesEditor from '../csv/ValueRulesEditor'
import GroupingCard from './GroupingCard'
import { createUniqueId } from '../csv/utils'

export default function CsvTransformPanelFull({
  columns,
  mapping,
  transformations,
  onUpdateTransformations
}) {
  const filters = transformations.filters || []
  const valueRules = transformations.valueRules || []
  const grouping = transformations.grouping || {}
  const aggregations = transformations.aggregations || {}

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
      <GroupingCard
        columns={columns}
        mapping={mapping}
        grouping={grouping}
        aggregations={aggregations}
        onUpdateTransformations={onUpdateTransformations}
      />
    </div>
  )
}

CsvTransformPanelFull.propTypes = {
  columns: PropTypes.array.isRequired,
  mapping: PropTypes.object.isRequired,
  transformations: PropTypes.object.isRequired,
  onUpdateTransformations: PropTypes.func.isRequired
}

