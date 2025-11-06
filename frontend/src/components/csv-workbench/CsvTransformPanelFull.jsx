import PropTypes from 'prop-types'
import FilterEditor from '../csv/FilterEditor'
import ValueRulesEditor from '../csv/ValueRulesEditor'
import GroupingCard from './GroupingCard'
import PivotBuilder from './PivotBuilder'
import { createUniqueId } from '../csv/utils'
import {
  addNodeToGroup,
  cloneFilterTree,
  countActiveConditions,
  createFilterCondition,
  createFilterGroup,
  normalizeFilterTree,
  removeNodeFromTree,
  updateNodeInTree
} from '../../utils/csv/filterTree'

export default function CsvTransformPanelFull({
  columns,
  mapping,
  transformations,
  rawRows,
  transformedRows,
  onUpdateTransformations,
  registerVersionEvent
}) {
  const filtersTree = normalizeFilterTree(transformations.filters)
  const filters = transformations.filters || filtersTree
  const valueRules = transformations.valueRules || []
  const grouping = transformations.grouping || {}
  const aggregations = transformations.aggregations || {}

  const updateFilters = (updater) => {
    onUpdateTransformations((prev) => {
      const base = normalizeFilterTree(prev.filters)
      const nextTree = updater(base)
      return {
        ...prev,
        filters: cloneFilterTree(nextTree)
      }
    })
  }

  const handleAddFilterCondition = (groupId) => {
    const id = createUniqueId('filter')
    updateFilters((tree) => addNodeToGroup(tree, groupId, createFilterCondition({ id, enabled: true })))
  }

  const handleAddFilterGroup = (groupId) => {
    const id = createUniqueId('fgroup')
    updateFilters((tree) => addNodeToGroup(tree, groupId, createFilterGroup({ id, operator: 'all', children: [] })))
  }

  const handleFilterConditionChange = (id, changes) => {
    updateFilters((tree) =>
      updateNodeInTree(tree, id, (node) => ({
        ...node,
        ...changes
      }))
    )
  }

  const handleFilterGroupChange = (id, changes) => {
    updateFilters((tree) =>
      updateNodeInTree(tree, id, (node) => ({
        ...node,
        ...changes
      }))
    )
  }

  const handleFilterToggle = (id, enabled) => {
    updateFilters((tree) =>
      updateNodeInTree(tree, id, (node) => ({
        ...node,
        enabled
      }))
    )
  }

  const handleFilterRemove = (id) => {
    updateFilters((tree) => removeNodeFromTree(tree, id))
  }

  const handleAddValueRule = () => {
    const id = createUniqueId('vrule')
    onUpdateTransformations((prev) => ({
      ...prev,
      valueRules: [
        ...(prev.valueRules || []),
        {
          id,
          column: '',
          when: { operator: 'containsText', value: '' },
          action: { type: 'replaceText', search: '', value: '' },
          enabled: true
        }
      ]
    }))
  }

  const handleValueRuleChange = (id, changes) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      valueRules: (prev.valueRules || []).map((rule) => (rule.id === id ? { ...rule, ...changes } : rule))
    }))
  }

  const handleRemoveValueRule = (id) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      valueRules: (prev.valueRules || []).filter((rule) => rule.id !== id)
    }))
  }

  const handleReorderValueRules = (orderedIds) => {
    onUpdateTransformations((prev) => {
      const existing = prev.valueRules || []
      if (existing.length === 0) {
        return prev
      }
      const idToRule = new Map(existing.map((rule) => [rule.id, rule]))
      const next = orderedIds.map((id) => idToRule.get(id)).filter(Boolean)
      existing.forEach((rule) => {
        if (!orderedIds.includes(rule.id)) {
          next.push(rule)
        }
      })
      return { ...prev, valueRules: next }
    })
  }

  const handleDuplicateValueRule = (id) => {
    onUpdateTransformations((prev) => {
      const existing = prev.valueRules || []
      const index = existing.findIndex((rule) => rule.id === id)
      if (index === -1) {
        return prev
      }
      const source = existing[index]
      const copy = {
        ...JSON.parse(JSON.stringify(source)),
        id: createUniqueId('vrule-copy'),
        column: source.column || '',
        enabled: source.enabled !== false
      }
      const next = [...existing]
      next.splice(index + 1, 0, copy)
      return { ...prev, valueRules: next }
    })
  }

  const handleBulkUpdateValueRules = (ids, changes) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      valueRules: (prev.valueRules || []).map((rule) =>
        ids.includes(rule.id)
          ? {
              ...rule,
              ...changes
            }
          : rule
      )
    }))
  }

  const activeValueRules = valueRules.filter((rule) => rule && rule.enabled !== false && rule.column).length
  const activeFilters = countActiveConditions(filtersTree)

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

      <details open>
        <summary className="cursor-pointer text-sm font-semibold text-dark-textLight mb-2">
          Werte-Regeln ({valueRules.length}) · {activeValueRules} aktiv
        </summary>
        <ValueRulesEditor
          columns={columns}
          valueRules={valueRules}
          onAddRule={handleAddValueRule}
          onRemoveRule={handleRemoveValueRule}
          onChangeRule={handleValueRuleChange}
          onReorderRules={handleReorderValueRules}
          onDuplicateRule={handleDuplicateValueRule}
          onBulkUpdate={handleBulkUpdateValueRules}
        />
      </details>

      <details open>
        <summary className="cursor-pointer text-sm font-semibold text-dark-textLight mb-2">
          Filter ({activeFilters} aktiv)
        </summary>
        <FilterEditor
          columns={columns}
          filters={filters}
          onAddCondition={handleAddFilterCondition}
          onAddGroup={handleAddFilterGroup}
          onChangeCondition={handleFilterConditionChange}
          onChangeGroup={handleFilterGroupChange}
          onToggleNode={handleFilterToggle}
          onRemoveNode={handleFilterRemove}
        />
      </details>

      <GroupingCard
        columns={columns}
        mapping={mapping}
        grouping={grouping}
        aggregations={aggregations}
        onUpdateTransformations={onUpdateTransformations}
      />

      <PivotBuilder
        columns={columns}
        rawRows={rawRows}
        transformedRows={transformedRows}
        pivotConfig={transformations.pivotTable}
        onUpdateTransformations={onUpdateTransformations}
        registerVersionEvent={registerVersionEvent}
      />
    </div>
  )
}

CsvTransformPanelFull.propTypes = {
  columns: PropTypes.array.isRequired,
  mapping: PropTypes.object.isRequired,
  transformations: PropTypes.object.isRequired,
  rawRows: PropTypes.array,
  transformedRows: PropTypes.array,
  onUpdateTransformations: PropTypes.func.isRequired,
  registerVersionEvent: PropTypes.func
}
