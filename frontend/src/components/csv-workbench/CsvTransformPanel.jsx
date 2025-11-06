import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import FilterEditor from '../csv/FilterEditor'
import ValueRulesEditor from '../csv/ValueRulesEditor'
import { createUniqueId } from '../csv/utils'
import TransformationPipeline from './TransformationPipeline'
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
import {
  createDefaultPipeline,
  createDefaultStageStates,
  ensurePipelineIntegrity
} from '../../utils/csv/transformations'

export default function CsvTransformPanel({ columns, transformations, onUpdateTransformations }) {
  const [collapsedStages, setCollapsedStages] = useState({})

  const filtersTree = useMemo(() => normalizeFilterTree(transformations.filters), [transformations.filters])
  const filters = transformations.filters || filtersTree
  const valueRules = transformations.valueRules || []
  const grouping = transformations.grouping || {}
  const pivot = transformations.pivot || {}
  const unpivot = transformations.unpivot || {}

  const pipelineOrder = useMemo(
    () => ensurePipelineIntegrity(transformations.pipeline || createDefaultPipeline()),
    [transformations.pipeline]
  )

  const stageStates = useMemo(() => {
    const defaults = createDefaultStageStates()
    const incoming = transformations.stageStates || {}
    return Object.keys(defaults).reduce((acc, key) => {
      acc[key] = { ...defaults[key], ...(incoming[key] || {}) }
      return acc
    }, {})
  }, [transformations.stageStates])

  const valueRuleCount = valueRules.filter((rule) => rule && rule.enabled !== false && rule.column).length
  const filterCount = countActiveConditions(filtersTree)
  const groupingCount = Array.isArray(grouping.columns) ? grouping.columns.length : 0
  const pivotActive = !!pivot.enabled
  const unpivotActive = !!unpivot.enabled

  const stageSummaries = {
    valueRules: `${valueRuleCount} aktiv`,
    filters: `${filterCount} aktiv`,
    grouping: groupingCount > 0 || grouping.enabled ? `${groupingCount} Spalten` : 'Inaktiv',
    pivot: pivotActive ? 'Aktiv' : 'Aus',
    unpivot: unpivotActive ? 'Aktiv' : 'Aus'
  }

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

  const handleToggleGrouping = (enabled) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      grouping: { ...(prev.grouping || {}), enabled }
    }))
  }

  const handlePipelineReorder = (order) => {
    onUpdateTransformations((prev) => ({
      ...prev,
      pipeline: ensurePipelineIntegrity(order)
    }))
  }

  const handleStageToggle = (stage, enabled) => {
    onUpdateTransformations((prev) => {
      const defaults = createDefaultStageStates()
      const incoming = prev.stageStates || {}
      return {
        ...prev,
        stageStates: {
          ...defaults,
          ...incoming,
          [stage]: { ...(incoming[stage] || {}), enabled }
        }
      }
    })
  }

  const handleToggleCollapse = (stage) => {
    setCollapsedStages((prev) => ({
      ...prev,
      [stage]: !prev[stage]
    }))
  }

  const stageContent = {
    valueRules: (
      <div className="space-y-3">
        {stageStates.valueRules?.enabled === false && (
          <p className="rounded-md border border-yellow-700/60 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-200">
            Diese Stufe ist deaktiviert. Regeln wirken sich nicht auf die Vorschau aus.
          </p>
        )}
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
      </div>
    ),
    filters: (
      <div className="space-y-3">
        {stageStates.filters?.enabled === false && (
          <p className="rounded-md border border-yellow-700/60 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-200">
            Filter sind deaktiviert. Alle Zeilen bleiben erhalten.
          </p>
        )}
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
      </div>
    ),
    grouping: (
      <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
        {stageStates.grouping?.enabled === false && (
          <p className="rounded-md border border-yellow-700/60 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-200">
            Gruppierung ist deaktiviert. Aggregationen werden übersprungen.
          </p>
        )}
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
            onChange={(event) => handleToggleGrouping(event.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
          />
        </label>
        {groupingCount > 0 && (
          <p className="text-xs text-dark-textGray">
            Aktive Spalten: {grouping.columns.join(', ')}
          </p>
        )}
      </div>
    ),
    pivot: (
      <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3 text-xs text-dark-textGray">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-dark-textLight">Pivot</h4>
          <span className={`rounded-full px-2 py-0.5 text-[11px] ${pivotActive ? 'border border-green-600 text-green-300' : 'border border-gray-700 text-dark-textGray'}`}>
            {pivotActive ? 'Aktiv' : 'Aus'}
          </span>
        </div>
        <p className="mt-2">
          Schlüsselspalte: <span className="text-dark-textLight">{pivot.keyColumn || '–'}</span>
        </p>
        <p>
          Wertespalte: <span className="text-dark-textLight">{pivot.valueColumn || '–'}</span>
        </p>
        <p className="mt-2 text-[11px]">
          Detaillierte Pivot-Konfiguration steht im erweiterten Transformations-Panel zur Verfügung.
        </p>
      </div>
    ),
    unpivot: (
      <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3 text-xs text-dark-textGray">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-dark-textLight">Unpivot (Melt)</h4>
          <span className={`rounded-full px-2 py-0.5 text-[11px] ${unpivotActive ? 'border border-green-600 text-green-300' : 'border border-gray-700 text-dark-textGray'}`}>
            {unpivotActive ? 'Aktiv' : 'Aus'}
          </span>
        </div>
        <p className="mt-2">
          ID-Spalten: <span className="text-dark-textLight">{(unpivot.idColumns || []).join(', ') || '–'}</span>
        </p>
        <p>
          Wertespalten: <span className="text-dark-textLight">{(unpivot.valueColumns || []).join(', ') || '–'}</span>
        </p>
        <p className="mt-2 text-[11px]">
          Konfigurieren Sie Unpivot-Einstellungen im erweiterten Transformations-Panel.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TransformationPipeline
        order={pipelineOrder}
        stageStates={stageStates}
        summaries={stageSummaries}
        collapsed={collapsedStages}
        onReorder={handlePipelineReorder}
        onToggleStage={handleStageToggle}
        onToggleCollapse={handleToggleCollapse}
      />

      {pipelineOrder.map((stage) => {
        if (collapsedStages[stage]) {
          return null
        }
        const content = stageContent[stage]
        if (!content) {
          return null
        }
        return <div key={stage}>{content}</div>
      })}
    </div>
  )
}

CsvTransformPanel.propTypes = {
  columns: PropTypes.array.isRequired,
  transformations: PropTypes.object.isRequired,
  onUpdateTransformations: PropTypes.func.isRequired
}
