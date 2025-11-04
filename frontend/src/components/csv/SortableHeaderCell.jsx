import { useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ACTION_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH } from './constants'

export default function SortableHeaderCell({
  column,
  sortEntry,
  sortIndex,
  onSortToggle,
  onToggleVisibility,
  onTogglePinned,
  onResizeStart,
  registerRef,
  isPinnedLeft,
  isPinnedRight,
  leftOffset,
  rightOffset,
  width,
  isGroupingColumn = false,
  isAggregatedValue = false,
  aggregationOperation = null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.key })
  const headerRef = useCallback(
    (node) => {
      registerRef(column.key, node)
    },
    [registerRef, column.key]
  )

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab'
  }

  const stickyPosition = {}
  if (isPinnedLeft) {
    stickyPosition.left = leftOffset || 0
  }
  if (isPinnedRight) {
    stickyPosition.right = rightOffset || 0
  }

  const computedWidth = width ? Math.max(width, ACTION_COLUMN_WIDTH) : null
  const widthStyle = {
    minWidth: computedWidth ? `${computedWidth}px` : `${DEFAULT_COLUMN_WIDTH}px`,
    width: computedWidth ? `${computedWidth}px` : undefined
  }

  const headerStyle = {
    ...widthStyle,
    ...stickyPosition,
    top: 0,
    position: 'sticky',
    zIndex: (isPinnedLeft || isPinnedRight ? 40 : 35) + (isDragging ? 5 : 0),
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(2px)'
  }

  const isSorted = Boolean(sortEntry)
  const sortSymbol = sortEntry ? (sortEntry.direction === 'desc' ? '▼' : '▲') : ''

  return (
    <th ref={headerRef} style={headerStyle} className="group border-b border-gray-700 px-3 py-2 text-left text-xs uppercase tracking-wide text-dark-textGray">
      <div
        ref={setNodeRef}
        style={dragStyle}
        className={`flex items-center gap-2 ${isDragging ? 'opacity-80' : ''}`}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="h-4 w-4 shrink-0 cursor-grab text-[10px] text-dark-textGray/60 transition-colors hover:text-dark-textLight focus:outline-none"
          title="Spalte ziehen"
          onMouseDown={(event) => event.stopPropagation()}
        >
          ☰
        </button>
        <button
          type="button"
          onClick={(event) => onSortToggle(column.key, event)}
          className={`flex flex-1 items-center gap-1 text-left transition-colors ${
            isSorted ? 'text-dark-textLight' : 'text-dark-textGray'
          } hover:text-dark-textLight focus:outline-none`}
        >
          <span className={`truncate font-medium ${isGroupingColumn ? 'text-blue-300' : isAggregatedValue ? 'text-green-300' : ''}`}>
            {column.key}
          </span>
          {isGroupingColumn && (
            <span className="rounded bg-blue-500/20 px-1 text-[9px] leading-none text-blue-200" title="Gruppierungsspalte">
              📊
            </span>
          )}
          {isAggregatedValue && aggregationOperation && (
            <span className="rounded bg-green-500/20 px-1 text-[9px] leading-none text-green-200" title={`Aggregiert: ${aggregationOperation === 'sum' ? 'Summe' : aggregationOperation === 'average' ? 'Durchschnitt' : aggregationOperation === 'min' ? 'Minimum' : aggregationOperation === 'max' ? 'Maximum' : aggregationOperation === 'count' ? 'Anzahl' : aggregationOperation}`}>
              {aggregationOperation === 'sum' ? 'Σ' : aggregationOperation === 'average' ? 'μ' : aggregationOperation === 'min' ? '↓' : aggregationOperation === 'max' ? '↑' : aggregationOperation === 'count' ? '#' : '⚡'}
            </span>
          )}
          {isSorted && (
            <span className="flex items-center gap-1 text-[10px]">
              <span>{sortSymbol}</span>
              <span className="rounded bg-dark-textGray/30 px-1 text-[9px] leading-none text-dark-textLight">{sortIndex + 1}</span>
            </span>
          )}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onTogglePinned(column.key)
            }}
            className={`relative flex items-center justify-center rounded px-1 text-[10px] transition-colors ${
              column.display?.pinned ? 'text-dark-accent1' : 'text-dark-textGray group-hover:text-dark-textLight'
            } hover:text-dark-accent1 focus:outline-none`}
            title={
              column.display?.pinned === 'left'
                ? 'Spalte rechts fixieren'
                : column.display?.pinned === 'right'
                  ? 'Fixierung lösen'
                  : 'Spalte links fixieren'
            }
          >
            <span className="leading-none">📌</span>
            {column.display?.pinned && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-semibold">
                {column.display.pinned === 'left' ? 'L' : 'R'}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleVisibility(column.key)
            }}
            className="rounded px-1 text-[10px] text-dark-textGray transition-colors hover:text-dark-textLight focus:outline-none"
            title="Spalte ausblenden"
          >
            👁
          </button>
          <button
            type="button"
            onPointerDown={(event) => onResizeStart(column.key, event)}
            className="relative h-6 w-2 cursor-col-resize select-none text-dark-textGray/50 hover:text-dark-textLight focus:outline-none"
            title="Spaltenbreite anpassen"
          >
            <span className="pointer-events-none block h-full w-px bg-dark-textGray/40" />
          </button>
        </div>
      </div>
    </th>
  )
}

