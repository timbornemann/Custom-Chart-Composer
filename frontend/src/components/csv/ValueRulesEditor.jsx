import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { VALUE_RULE_ACTIONS, VALUE_RULE_CONDITIONS } from './constants'

function ValueRuleCard({
  rule,
  columns,
  onChange,
  onRemove,
  onDuplicate,
  selected,
  onToggleSelect,
  setNodeRef,
  attributes,
  listeners,
  transform,
  transition
}) {
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: rule.enabled === false ? 0.6 : 1
  }

  const handleChange = (changes) => onChange(rule.id, changes)

  return (
    <div ref={setNodeRef} style={style} className="space-y-3 rounded-md border border-gray-700 bg-dark-bg/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-dark-textGray">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab rounded border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-wide"
            {...attributes}
            {...listeners}
          >
            Ziehen
          </button>
          <label className="flex items-center gap-1 text-dark-textLight">
            <input
              type="checkbox"
              checked={selected}
              onChange={(event) => onToggleSelect(rule.id, event.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
            />
            Auswählen
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={rule.enabled !== false}
              onChange={(event) => handleChange({ enabled: event.target.checked })}
              className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
            />
            <span className="text-[11px] text-dark-textLight">Aktiv</span>
          </label>
          <button
            type="button"
            onClick={() => onDuplicate(rule.id)}
            className="rounded border border-gray-700 px-2 py-0.5 text-[11px] text-dark-textLight hover:bg-dark-bg"
          >
            Duplizieren
          </button>
          <button
            type="button"
            onClick={() => onRemove(rule.id)}
            className="rounded border border-red-600 px-2 py-0.5 text-[11px] text-red-200 hover:bg-red-900/40"
          >
            Entfernen
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">Spalte</label>
          <select
            value={rule.column || ''}
            onChange={(event) => handleChange({ column: event.target.value })}
            className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
          >
            <option value="">Spalte wählen…</option>
            {columns.map((column) => (
              <option key={column.key} value={column.key}>
                {column.key}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">Wenn</label>
          <div className="flex flex-wrap gap-2">
            <select
              value={rule.when?.operator || 'containsText'}
              onChange={(event) =>
                handleChange({
                  when: { ...(rule.when || {}), operator: event.target.value }
                })
              }
              className="flex-1 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              {VALUE_RULE_CONDITIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {['containsText', 'notContainsText', 'equalsText', 'matchesRegex'].includes(rule.when?.operator) && (
              <input
                type="text"
                value={rule.when?.value || ''}
                onChange={(event) =>
                  handleChange({
                    when: { ...(rule.when || {}), value: event.target.value }
                  })
                }
                placeholder={rule.when?.operator === 'matchesRegex' ? 'Regex Muster' : 'Wert'}
                className="flex-1 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
            )}
            {rule.when?.operator === 'matchesRegex' && (
              <input
                type="text"
                value={rule.when?.flags || ''}
                onChange={(event) =>
                  handleChange({
                    when: { ...(rule.when || {}), flags: event.target.value }
                  })
                }
                placeholder="Flags"
                className="w-24 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">Aktion</label>
        <div className="flex flex-wrap gap-2">
          <select
            value={rule.action?.type || 'replaceText'}
            onChange={(event) =>
              handleChange({
                action: { ...(rule.action || {}), type: event.target.value }
              })
            }
            className="flex-1 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
          >
            {VALUE_RULE_ACTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {['replaceText'].includes(rule.action?.type) && (
            <>
              <input
                type="text"
                value={rule.action?.search || ''}
                onChange={(event) =>
                  handleChange({
                    action: { ...(rule.action || {}), search: event.target.value }
                  })
                }
                placeholder="suchen"
                className="w-28 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
              <input
                type="text"
                value={rule.action?.value || ''}
                onChange={(event) =>
                  handleChange({
                    action: { ...(rule.action || {}), value: event.target.value }
                  })
                }
                placeholder="ersetzen durch"
                className="w-32 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
            </>
          )}
          {['regexReplace'].includes(rule.action?.type) && (
            <>
              <input
                type="text"
                value={rule.action?.pattern || ''}
                onChange={(event) =>
                  handleChange({
                    action: { ...(rule.action || {}), pattern: event.target.value }
                  })
                }
                placeholder="Regex"
                className="w-28 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
              <input
                type="text"
                value={rule.action?.flags || ''}
                onChange={(event) =>
                  handleChange({
                    action: { ...(rule.action || {}), flags: event.target.value }
                  })
                }
                placeholder="Flags"
                className="w-20 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
              <input
                type="text"
                value={rule.action?.value || ''}
                onChange={(event) =>
                  handleChange({
                    action: { ...(rule.action || {}), value: event.target.value }
                  })
                }
                placeholder="ersetzen durch"
                className="w-32 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
            </>
          )}
          {['setText'].includes(rule.action?.type) && (
            <input
              type="text"
              value={rule.action?.value || ''}
              onChange={(event) =>
                handleChange({
                  action: { ...(rule.action || {}), value: event.target.value }
                })
              }
              placeholder="Text"
              className="w-36 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            />
          )}
          {['multiply', 'divide'].includes(rule.action?.type) && (
            <input
              type="number"
              step="any"
              value={rule.action?.factor || ''}
              onChange={(event) =>
                handleChange({
                  action: { ...(rule.action || {}), factor: event.target.value }
                })
              }
              placeholder="Faktor"
              className="w-28 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  )
}

ValueRuleCard.propTypes = {
  rule: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  setNodeRef: PropTypes.func.isRequired,
  attributes: PropTypes.object,
  listeners: PropTypes.object,
  transform: PropTypes.object,
  transition: PropTypes.string
}

function SortableValueRule({ rule, columns, onChange, onRemove, onDuplicate, selected, onToggleSelect }) {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id: rule.id })
  return (
    <ValueRuleCard
      rule={rule}
      columns={columns}
      onChange={onChange}
      onRemove={onRemove}
      onDuplicate={onDuplicate}
      selected={selected}
      onToggleSelect={onToggleSelect}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      transform={transform}
      transition={transition}
    />
  )
}

SortableValueRule.propTypes = {
  rule: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  onToggleSelect: PropTypes.func.isRequired
}

export default function ValueRulesEditor({
  columns,
  valueRules,
  onAddRule,
  onRemoveRule,
  onChangeRule,
  onReorderRules,
  onDuplicateRule,
  onBulkUpdate
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const ruleIds = useMemo(() => valueRules.map((rule) => rule.id), [valueRules])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = ruleIds.indexOf(active.id)
    const newIndex = ruleIds.indexOf(over.id)
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    const reordered = arrayMove(ruleIds, oldIndex, newIndex)
    onReorderRules(reordered)
  }

  const handleToggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const handleSelectAll = (checked) => {
    setSelectedIds(() => (checked ? new Set(ruleIds) : new Set()))
  }

  const hasSelection = selectedIds.size > 0

  const handleBulkAction = (type) => {
    if (!hasSelection) return
    const ids = Array.from(selectedIds)
    if (type === 'enable') {
      onBulkUpdate(ids, { enabled: true })
    } else if (type === 'disable') {
      onBulkUpdate(ids, { enabled: false })
    } else if (type === 'duplicate') {
      ids.forEach((id) => onDuplicateRule(id))
    } else if (type === 'delete') {
      ids.forEach((id) => onRemoveRule(id))
      setSelectedIds(new Set())
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-dark-textLight">Wert-Regeln (vor Filter/Gruppierung)</h4>
          <p className="text-[11px] text-dark-textGray">Regelbasiertes Umformen. Originaldaten bleiben erhalten.</p>
        </div>
        {valueRules.length > 0 && (
          <label className="flex items-center gap-2 text-[11px] text-dark-textLight">
            <input
              type="checkbox"
              checked={selectedIds.size === valueRules.length && valueRules.length > 0}
              onChange={(event) => handleSelectAll(event.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
            />
            Alle wählen
          </label>
        )}
      </div>

      {hasSelection && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-dark-accent1/40 bg-dark-accent1/10 px-3 py-2 text-[11px] text-dark-textLight">
          <span>{selectedIds.size} Regeln ausgewählt</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleBulkAction('enable')}
              className="rounded border border-gray-700 px-2 py-0.5 hover:bg-dark-bg"
            >
              Aktivieren
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('disable')}
              className="rounded border border-gray-700 px-2 py-0.5 hover:bg-dark-bg"
            >
              Deaktivieren
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('duplicate')}
              className="rounded border border-gray-700 px-2 py-0.5 hover:bg-dark-bg"
            >
              Duplizieren
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('delete')}
              className="rounded border border-red-600 px-2 py-0.5 text-red-200 hover:bg-red-900/40"
            >
              Löschen
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {valueRules.length === 0 ? (
          <p className="text-xs text-dark-textGray">Keine Regeln hinzugefügt.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ruleIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {valueRules.map((rule) => (
                  <SortableValueRule
                    key={rule.id}
                    rule={rule}
                    columns={columns}
                    onChange={onChangeRule}
                    onRemove={onRemoveRule}
                    onDuplicate={onDuplicateRule}
                    selected={selectedIds.has(rule.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onAddRule}
          className="rounded-md border border-gray-700 px-3 py-1 text-xs text-dark-textLight hover:bg-dark-bg/60"
        >
          Regel hinzufügen
        </button>
        {hasSelection && (
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-[11px] text-dark-textGray underline"
          >
            Auswahl aufheben
          </button>
        )}
      </div>
    </div>
  )
}

ValueRulesEditor.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired
    })
  ).isRequired,
  valueRules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired
    })
  ).isRequired,
  onAddRule: PropTypes.func.isRequired,
  onRemoveRule: PropTypes.func.isRequired,
  onChangeRule: PropTypes.func.isRequired,
  onReorderRules: PropTypes.func.isRequired,
  onDuplicateRule: PropTypes.func.isRequired,
  onBulkUpdate: PropTypes.func.isRequired
}
