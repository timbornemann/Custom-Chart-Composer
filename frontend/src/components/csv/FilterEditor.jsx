import PropTypes from 'prop-types'
import { FILTER_OPERATORS } from './constants'
import {
  FILTER_NODE_TYPES,
  countActiveConditions,
  normalizeFilterTree
} from '../../utils/csv/filterTree'

const GROUP_OPERATOR_OPTIONS = [
  { value: 'all', label: 'Alle müssen zutreffen (UND)' },
  { value: 'any', label: 'Mindestens eine Bedingung (ODER)' },
  { value: 'none', label: 'Keine Bedingung darf zutreffen' },
  { value: 'exactlyOne', label: 'Genau eine Bedingung (XOR)' }
]

function FilterCondition({ node, columns, onChange, onToggle, onRemove }) {
  return (
    <div className="space-y-3 rounded-md border border-gray-700 bg-dark-bg/60 p-3">
      <div className="grid items-start gap-3 md:grid-cols-12">
        <div className="flex items-center gap-2 md:col-span-12 lg:col-span-2">
          <input
            type="checkbox"
            checked={node.enabled !== false}
            onChange={(event) => onToggle(node.id, event.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
          />
          <span className="text-xs text-dark-textLight">Aktiv</span>
        </div>
        <div className="md:col-span-6 lg:col-span-4">
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">Spalte</label>
          <select
            value={node.column || ''}
            onChange={(event) => onChange(node.id, { column: event.target.value })}
            className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
          >
            <option value="">Spalte wählen</option>
            {columns.map((column) => (
              <option key={column.key} value={column.key}>
                {column.key}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-6 lg:col-span-6">
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">Operator</label>
          <select
            value={node.operator || 'equalsText'}
            onChange={(event) =>
              onChange(node.id, {
                operator: event.target.value,
                value: '',
                minValue: '',
                maxValue: '',
                flags: ''
              })
            }
            className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
          >
            {FILTER_OPERATORS.map((operator) => (
              <option key={operator.value} value={operator.value}>
                {operator.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {node.operator === 'between' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Min-Wert</label>
              <input
                type="number"
                step="any"
                value={node.minValue || ''}
                onChange={(event) => onChange(node.id, { minValue: event.target.value })}
                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                placeholder="Min"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Max-Wert</label>
              <input
                type="number"
                step="any"
                value={node.maxValue || ''}
                onChange={(event) => onChange(node.id, { maxValue: event.target.value })}
                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                placeholder="Max"
              />
            </div>
          </div>
        )}

        {node.operator === 'dateBetween' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Von (Datum)</label>
              <input
                type="text"
                value={node.minValue || ''}
                onChange={(event) => onChange(node.id, { minValue: event.target.value })}
                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                placeholder="2023-12-01 oder ISO 8601"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Bis (Datum)</label>
              <input
                type="text"
                value={node.maxValue || ''}
                onChange={(event) => onChange(node.id, { maxValue: event.target.value })}
                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                placeholder="2023-12-31 oder ISO 8601"
              />
            </div>
          </div>
        )}

        {['matchesRegex', 'notMatchesRegex'].includes(node.operator) && (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Regex-Muster</label>
              <input
                type="text"
                value={node.value || ''}
                onChange={(event) => onChange(node.id, { value: event.target.value })}
                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                placeholder="z. B. ^[A-Z]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Flags</label>
              <input
                type="text"
                value={node.flags || ''}
                onChange={(event) => onChange(node.id, { flags: event.target.value })}
                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                placeholder="i, g"
              />
            </div>
          </div>
        )}

        {node.operator?.startsWith('date') && node.operator !== 'dateBetween' && (
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Datum/Zeit (ISO 8601)</label>
            <input
              type="text"
              value={node.value || ''}
              onChange={(event) => onChange(node.id, { value: event.target.value })}
              className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              placeholder="2023-12-25T10:30:00 oder 2023-12-25"
            />
          </div>
        )}

        {!['between', 'dateBetween', 'matchesRegex', 'notMatchesRegex', 'isEmpty', 'isNotEmpty', 'isNumber', 'isText', 'isDateTime'].includes(node.operator) &&
          !node.operator?.startsWith('date') && (
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Wert</label>
              <input
                type={['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(node.operator) ? 'number' : 'text'}
                step={['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(node.operator) ? 'any' : undefined}
                value={node.value || ''}
                onChange={(event) => onChange(node.id, { value: event.target.value })}
                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                placeholder={['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(node.operator) ? 'Zahl' : 'Text'}
              />
            </div>
          )}

        {['isEmpty', 'isNotEmpty', 'isNumber', 'isText', 'isDateTime'].includes(node.operator) && (
          <p className="text-[10px] italic text-dark-textGray">Kein Wert erforderlich</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onRemove(node.id)}
          className="rounded-md border border-red-600 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
        >
          Entfernen
        </button>
      </div>
    </div>
  )
}

FilterCondition.propTypes = {
  node: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
}

function FilterGroup({
  node,
  columns,
  depth,
  onAddCondition,
  onAddGroup,
  onChangeCondition,
  onChangeGroup,
  onToggleNode,
  onRemoveNode
}) {
  const indentation = depth * 16
  const activeChildren = countActiveConditions(node)

  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4" style={{ marginLeft: depth ? indentation : 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={node.operator || 'all'}
            onChange={(event) => onChangeGroup(node.id, { operator: event.target.value })}
            className="rounded-md border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
          >
            {GROUP_OPERATOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-dark-textLight">
            <input
              type="checkbox"
              checked={node.enabled !== false}
              onChange={(event) => onToggleNode(node.id, event.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
            />
            Aktiv
          </label>
          <span className="rounded-full border border-gray-700 px-2 py-0.5 text-[10px] text-dark-textGray">
            {activeChildren} aktiv
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onAddCondition(node.id)}
            className="rounded border border-gray-700 px-2 py-0.5 text-[11px] text-dark-textLight hover:bg-dark-bg"
          >
            Bedingung hinzufügen
          </button>
          <button
            type="button"
            onClick={() => onAddGroup(node.id)}
            className="rounded border border-gray-700 px-2 py-0.5 text-[11px] text-dark-textLight hover:bg-dark-bg"
          >
            Gruppe hinzufügen
          </button>
          {depth > 0 && (
            <button
              type="button"
              onClick={() => onRemoveNode(node.id)}
              className="rounded border border-red-600 px-2 py-0.5 text-[11px] text-red-200 hover:bg-red-900/40"
            >
              Gruppe entfernen
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {Array.isArray(node.children) && node.children.length > 0 ? (
          node.children.map((child) =>
            child.type === FILTER_NODE_TYPES.GROUP ? (
              <FilterGroup
                key={child.id}
                node={child}
                columns={columns}
                depth={depth + 1}
                onAddCondition={onAddCondition}
                onAddGroup={onAddGroup}
                onChangeCondition={onChangeCondition}
                onChangeGroup={onChangeGroup}
                onToggleNode={onToggleNode}
                onRemoveNode={onRemoveNode}
              />
            ) : (
              <FilterCondition
                key={child.id}
                node={child}
                columns={columns}
                onChange={onChangeCondition}
                onToggle={onToggleNode}
                onRemove={onRemoveNode}
              />
            )
          )
        ) : (
          <p className="text-xs text-dark-textGray">Keine Bedingungen in dieser Gruppe.</p>
        )}
      </div>
    </div>
  )
}

FilterGroup.propTypes = {
  node: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  depth: PropTypes.number.isRequired,
  onAddCondition: PropTypes.func.isRequired,
  onAddGroup: PropTypes.func.isRequired,
  onChangeCondition: PropTypes.func.isRequired,
  onChangeGroup: PropTypes.func.isRequired,
  onToggleNode: PropTypes.func.isRequired,
  onRemoveNode: PropTypes.func.isRequired
}

export default function FilterEditor({
  columns,
  filters,
  onAddCondition,
  onAddGroup,
  onChangeCondition,
  onChangeGroup,
  onToggleNode,
  onRemoveNode
}) {
  const tree = normalizeFilterTree(filters)
  const activeCount = countActiveConditions(tree)

  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-dark-textLight">Filter</h4>
        <span className="rounded-full border border-gray-700 px-3 py-1 text-[10px] text-dark-textGray">
          {activeCount} aktiv
        </span>
      </div>

      <FilterGroup
        node={tree}
        columns={columns}
        depth={0}
        onAddCondition={onAddCondition}
        onAddGroup={onAddGroup}
        onChangeCondition={onChangeCondition}
        onChangeGroup={onChangeGroup}
        onToggleNode={onToggleNode}
        onRemoveNode={onRemoveNode}
      />
    </div>
  )
}

FilterEditor.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired
    })
  ).isRequired,
  filters: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  onAddCondition: PropTypes.func.isRequired,
  onAddGroup: PropTypes.func.isRequired,
  onChangeCondition: PropTypes.func.isRequired,
  onChangeGroup: PropTypes.func.isRequired,
  onToggleNode: PropTypes.func.isRequired,
  onRemoveNode: PropTypes.func.isRequired
}

FilterEditor.defaultProps = {
  filters: null
}
