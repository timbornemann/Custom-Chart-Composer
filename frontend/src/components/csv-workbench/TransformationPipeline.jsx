import PropTypes from 'prop-types'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const STAGE_LABELS = {
  valueRules: 'Wert-Regeln',
  filters: 'Filter',
  grouping: 'Gruppierung',
  pivot: 'Pivot',
  unpivot: 'Unpivot'
}

function StageCard({
  stage,
  enabled,
  summary,
  collapsed,
  onToggleEnabled,
  onToggleCollapsed,
  setNodeRef,
  attributes,
  listeners,
  transform,
  transition
}) {
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex min-w-[160px] flex-col gap-2 rounded-lg border px-3 py-3 text-xs transition-all ${
        enabled ? 'border-dark-accent1/40 bg-dark-bg/60 text-dark-textLight' : 'border-gray-700 bg-dark-bg/20 text-dark-textGray'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="cursor-grab rounded border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-wide"
          {...attributes}
          {...listeners}
        >
          Ziehen
        </button>
        <span className="text-[11px] font-semibold text-dark-textLight">{STAGE_LABELS[stage] || stage}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-dark-textGray">{summary}</span>
        <button
          type="button"
          onClick={() => onToggleCollapsed(stage)}
          className="rounded border border-gray-700 px-2 py-0.5 text-[10px] text-dark-textLight hover:bg-dark-bg"
        >
          {collapsed ? 'Einblenden' : 'Ausblenden'}
        </button>
      </div>
      <label className="flex items-center justify-between rounded border border-gray-700 bg-dark-bg/30 px-2 py-1 text-[11px] text-dark-textLight">
        Aktiv
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggleEnabled(stage, event.target.checked)}
          className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
        />
      </label>
    </div>
  )
}

StageCard.propTypes = {
  stage: PropTypes.string.isRequired,
  enabled: PropTypes.bool.isRequired,
  summary: PropTypes.string.isRequired,
  collapsed: PropTypes.bool.isRequired,
  onToggleEnabled: PropTypes.func.isRequired,
  onToggleCollapsed: PropTypes.func.isRequired,
  setNodeRef: PropTypes.func.isRequired,
  attributes: PropTypes.object,
  listeners: PropTypes.object,
  transform: PropTypes.object,
  transition: PropTypes.string
}

function SortableStageCard(props) {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id: props.stage })
  return <StageCard {...props} setNodeRef={setNodeRef} attributes={attributes} listeners={listeners} transform={transform} transition={transition} />
}

SortableStageCard.propTypes = {
  stage: PropTypes.string.isRequired,
  enabled: PropTypes.bool.isRequired,
  summary: PropTypes.string.isRequired,
  collapsed: PropTypes.bool.isRequired,
  onToggleEnabled: PropTypes.func.isRequired,
  onToggleCollapsed: PropTypes.func.isRequired
}

export default function TransformationPipeline({
  order,
  stageStates,
  summaries,
  collapsed,
  onReorder,
  onToggleStage,
  onToggleCollapse
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = order.indexOf(active.id)
    const newIndex = order.indexOf(over.id)
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    const next = arrayMove(order, oldIndex, newIndex)
    onReorder(next)
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-dark-textLight">Transformations-Pipeline</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-3">
            {order.map((stage) => (
              <SortableStageCard
                key={stage}
                stage={stage}
                enabled={stageStates[stage]?.enabled !== false}
                summary={summaries[stage] || ''}
                collapsed={!!collapsed[stage]}
                onToggleEnabled={onToggleStage}
                onToggleCollapsed={onToggleCollapse}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

TransformationPipeline.propTypes = {
  order: PropTypes.arrayOf(PropTypes.string).isRequired,
  stageStates: PropTypes.object.isRequired,
  summaries: PropTypes.object.isRequired,
  collapsed: PropTypes.object.isRequired,
  onReorder: PropTypes.func.isRequired,
  onToggleStage: PropTypes.func.isRequired,
  onToggleCollapse: PropTypes.func.isRequired
}
