import PropTypes from 'prop-types'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import SortableHeaderCell from '../csv/SortableHeaderCell'
import { renderHighlightedValue, formatCellValue } from '../csv/formatting'
import { ACTION_COLUMN_WIDTH, MIN_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '../csv/constants'

export default function CsvTable({
  entries,
  visibleColumns,
  rowDisplay,
  duplicateMetaByIndex,
  chartPreviewHighlight,
  editingCell,
  editingValue,
  selectedCellSet,
  activeSearchMatch,
  manualEditMap,
  scope, // 'raw' or 'transformed'
  activeSorts,
  headerRef,
  pinnedRowOffsets,
  headerHeight,
  pinnedLeftOffsets,
  pinnedRightOffsets,
  getColumnWidth,
  registerColumnRef,
  registerRowRef,
  onSortToggle,
  onHideColumn,
  onTogglePinned,
  onColumnResizeStart,
  onColumnDragEnd,
  onCellMouseDown,
  onCellMouseEnter,
  onCellKeyDown,
  onStartEdit,
  onEditingValueChange,
  onConfirmEdit,
  onCancelEdit,
  onToggleRowHidden,
  onToggleRowPinned,
  transformationMeta,
  groupingColumns = [],
  mapping = {},
  aggregations = {}
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  return (
    <div className="flex-1 overflow-auto bg-dark-bg">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onColumnDragEnd}>
        <SortableContext items={visibleColumns.map((col) => col.key)} strategy={horizontalListSortingStrategy}>
          <table className="min-w-full divide-y divide-gray-700 text-sm">
            <thead className="text-xs uppercase tracking-wide text-dark-textGray">
              <tr ref={headerRef}>
                <th
                  className="sticky left-0 z-50 border-r border-gray-700 bg-dark-bg/90 px-3 py-2 text-left"
                  style={{ minWidth: `${ACTION_COLUMN_WIDTH}px`, width: `${ACTION_COLUMN_WIDTH}px`, top: 0 }}
                >
                  <span className="text-[10px] uppercase tracking-wide text-dark-textGray">Zeile</span>
                </th>
                {visibleColumns.map((column) => {
                  const sortIndex = activeSorts.findIndex((entry) => entry.column === column.key)
                  const sortEntry = sortIndex >= 0 ? activeSorts[sortIndex] : null
                  const isGroupingColumn = scope === 'transformed' && groupingColumns.includes(column.key)
                  const isValueColumn = scope === 'transformed' && mapping?.valueColumns?.includes(column.key)
                  const aggregationOperation = isValueColumn && aggregations?.perColumn?.[column.key] 
                    ? aggregations.perColumn[column.key] 
                    : (isValueColumn && aggregations?.defaultOperation) || null
                  return (
                    <SortableHeaderCell
                      key={column.key}
                      column={column}
                      sortEntry={sortEntry}
                      sortIndex={sortIndex}
                      onSortToggle={onSortToggle}
                      onToggleVisibility={onHideColumn}
                      onTogglePinned={onTogglePinned}
                      onResizeStart={onColumnResizeStart}
                      registerRef={registerColumnRef}
                      isPinnedLeft={column.display?.pinned === 'left'}
                      isPinnedRight={column.display?.pinned === 'right'}
                      leftOffset={pinnedLeftOffsets.get(column.key)}
                      rightOffset={pinnedRightOffsets.get(column.key)}
                      width={getColumnWidth(column.key)}
                      isGroupingColumn={isGroupingColumn}
                      isAggregatedValue={isValueColumn && aggregationOperation}
                      aggregationOperation={aggregationOperation}
                    />
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-dark-bg/40 text-dark-textLight">
              {entries.map((entry, rowPosition) => {
                const rowState = rowDisplay[entry.index] || {}
                const rowTop = rowState.pinned ? pinnedRowOffsets.get(entry.index) ?? headerHeight : undefined
                const duplicateMeta = duplicateMetaByIndex?.get(entry.index)
                const rowHighlightClass = duplicateMeta
                  ? duplicateMeta.isPrimary
                    ? 'bg-emerald-900/10'
                    : 'bg-red-900/10'
                  : ''
                const isChartHighlighted =
                  chartPreviewHighlight?.source === scope && chartPreviewHighlight.rowIndex === entry.index
                const combinedRowClass = [rowHighlightClass, isChartHighlighted ? 'ring-1 ring-dark-accent1/60 bg-dark-accent1/10' : '']
                  .filter(Boolean)
                  .join(' ')
                  .trim()
                
                return (
                  <tr
                    key={entry.index}
                    ref={(node) => registerRowRef(scope, entry.index, node)}
                    className={combinedRowClass || undefined}
                  >
                    {/* Row number column */}
                    <td
                      className="sticky left-0 z-40 border-r border-gray-800 bg-dark-bg/90 px-2 py-2 text-[11px] text-dark-textGray"
                      style={{
                        minWidth: `${ACTION_COLUMN_WIDTH}px`,
                        width: `${ACTION_COLUMN_WIDTH}px`,
                        top: rowTop
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[10px] text-dark-textGray/80">#{entry.index + 1}</span>
                          {duplicateMeta && (
                            <span
                              className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none ${
                                duplicateMeta.isPrimary
                                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
                                  : 'border-red-500/60 bg-red-500/15 text-red-200'
                              }`}
                              title={duplicateMeta.isPrimary ? 'Primärzeile' : 'Duplikat'}
                            >
                              {duplicateMeta.isPrimary ? 'P' : 'D'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onToggleRowPinned(scope, entry.index)}
                            className={`rounded px-1 text-[10px] transition-colors ${
                              rowState.pinned
                                ? 'text-dark-accent1'
                                : 'text-dark-textGray hover:text-dark-textLight'
                            }`}
                            title={rowState.pinned ? 'Fixierung lösen' : 'Zeile fixieren'}
                          >
                            📌
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleRowHidden(scope, entry.index)}
                            className="rounded px-1 text-[10px] text-dark-textGray transition-colors hover:text-dark-textLight"
                            title="Zeile ausblenden"
                          >
                            🚫
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Data cells */}
                    {visibleColumns.map((column) => {
                      const isEditing = editingCell?.rowIndex === entry.index && editingCell.columnKey === column.key
                      const matches = entry.matchInfo?.[column.key]
                      const highlightedValue = renderHighlightedValue(entry.row[column.key], matches)
                      const hasContent = Array.isArray(highlightedValue) ? highlightedValue.length > 0 : Boolean(highlightedValue)
                      const isSelected = selectedCellSet.has(`${entry.index}::${column.key}`)
                      const isActiveMatch =
                        activeSearchMatch?.scope === scope &&
                        activeSearchMatch.rowIndex === entry.index &&
                        activeSearchMatch.columnKey === column.key
                      const isPinnedLeft = column.display?.pinned === 'left'
                      const isPinnedRight = column.display?.pinned === 'right'
                      const cellLeft = pinnedLeftOffsets.get(column.key)
                      const cellRight = pinnedRightOffsets.get(column.key)
                      const cellWidth = getColumnWidth(column.key)
                      const isGroupingColumn = scope === 'transformed' && groupingColumns.includes(column.key)
                      const isValueColumn = scope === 'transformed' && mapping?.valueColumns?.includes(column.key)
                      const isIrrelevantInGroupedView = scope === 'transformed' && groupingColumns.length > 0 && !isGroupingColumn && !isValueColumn
                      
                      const cellStyle = {
                        minWidth: `${Math.max(cellWidth, MIN_COLUMN_WIDTH)}px`,
                        width: column.display?.width ? `${Math.max(cellWidth, MIN_COLUMN_WIDTH)}px` : undefined
                      }
                      
                      if (isPinnedLeft || isPinnedRight || rowState.pinned) {
                        cellStyle.position = 'sticky'
                        if (isPinnedLeft) cellStyle.left = cellLeft
                        if (isPinnedRight) cellStyle.right = cellRight
                        if (rowState.pinned) cellStyle.top = rowTop ?? headerHeight
                        cellStyle.zIndex = 20 + (isPinnedLeft || isPinnedRight ? 5 : 0) + (rowState.pinned ? 5 : 0)
                        cellStyle.backgroundColor = 'rgba(17, 24, 39, 0.9)'
                      }
                      
                      const manualEditRow = manualEditMap?.[entry.index] || null
                      const manualEditInfo = manualEditRow ? manualEditRow[column.key] : null
                      const manualEditOriginalDisplay = manualEditInfo ? formatCellValue(manualEditInfo.originalValue) : ''
                      const manualEditTitle = manualEditInfo
                        ? `Manuell geändert (ursprünglich: ${manualEditOriginalDisplay === '' ? '–' : manualEditOriginalDisplay})`
                        : ''

                      return (
                        <td
                          key={column.key}
                          className={`px-3 py-2 text-xs ${
                            isIrrelevantInGroupedView 
                              ? 'text-dark-textGray/40 bg-dark-bg/20' 
                              : isGroupingColumn 
                                ? 'text-blue-200/90' 
                                : isValueColumn 
                                  ? 'text-green-200/90' 
                                  : 'text-dark-textLight/90'
                          } ${
                            isSelected ? 'bg-dark-accent1/20 text-dark-textLight ring-1 ring-dark-accent1/40' : ''
                          } ${
                            isActiveMatch
                              ? isSelected
                                ? 'ring-2 ring-dark-accent1/80'
                                : 'bg-dark-accent1/10 text-dark-textLight ring-2 ring-dark-accent1/60'
                              : ''
                          }`}
                          style={cellStyle}
                          title={isIrrelevantInGroupedView ? 'Diese Spalte ist bei Gruppierung nicht relevant' : undefined}
                        >
                          {isEditing ? (
                            <input
                              type={column.type === 'number' ? 'number' : 'text'}
                              inputMode={column.type === 'number' ? 'decimal' : undefined}
                              step={column.type === 'number' ? 'any' : undefined}
                              value={editingValue}
                              onChange={onEditingValueChange}
                              onBlur={onConfirmEdit}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  onConfirmEdit()
                                } else if (event.key === 'Escape') {
                                  onCancelEdit()
                                }
                              }}
                              autoFocus
                              className="w-full rounded-md border border-dark-accent1/60 bg-dark-secondary px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                            />
                          ) : (
                            <div className="group relative">
                              <button
                                type="button"
                                data-row-index={entry.index}
                                data-column-key={column.key}
                                onMouseDown={(event) => onCellMouseDown(event, entry, rowPosition, column.key)}
                                onMouseEnter={() => onCellMouseEnter(entry, rowPosition, column.key)}
                                onDoubleClick={() => onStartEdit(entry, column.key, rowPosition)}
                                onKeyDown={(event) => onCellKeyDown(event, entry, rowPosition, column.key)}
                                className={`w-full rounded px-1 pr-6 text-left text-dark-textLight/90 transition-colors hover:text-dark-textLight ${
                                  isSelected ? 'bg-dark-accent1/10' : ''
                                } focus:outline-none`}
                              >
                                {hasContent ? highlightedValue : <span className="text-dark-textGray/60">–</span>}
                              </button>
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label="Zelle bearbeiten"
                                title="Zelle bearbeiten"
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  onStartEdit(entry, column.key, rowPosition)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    onStartEdit(entry, column.key, rowPosition)
                                  }
                                }}
                                className={`absolute inset-y-0 right-0 flex items-center px-1 text-[11px] transition-opacity ${
                                  isSelected ? 'opacity-100 text-dark-textLight' : 'opacity-0 text-dark-textGray/70'
                                } group-hover:opacity-100 group-focus-within:opacity-100`}
                              >
                                ✎
                              </span>
                              {manualEditInfo && (
                                <span
                                  className="pointer-events-none absolute top-0.5 right-3 text-[10px] text-dark-accent1"
                                  title={manualEditTitle}
                                >
                                  ●
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>
    </div>
  )
}

CsvTable.propTypes = {
  entries: PropTypes.array.isRequired,
  visibleColumns: PropTypes.array.isRequired,
  rowDisplay: PropTypes.object,
  duplicateMetaByIndex: PropTypes.instanceOf(Map),
  chartPreviewHighlight: PropTypes.object,
  editingCell: PropTypes.object,
  editingValue: PropTypes.string,
  selectedCellSet: PropTypes.instanceOf(Set),
  activeSearchMatch: PropTypes.object,
  manualEditMap: PropTypes.object,
  scope: PropTypes.oneOf(['raw', 'transformed']).isRequired,
  activeSorts: PropTypes.array,
  headerRef: PropTypes.object,
  pinnedRowOffsets: PropTypes.instanceOf(Map),
  headerHeight: PropTypes.number,
  pinnedLeftOffsets: PropTypes.instanceOf(Map),
  pinnedRightOffsets: PropTypes.instanceOf(Map),
  getColumnWidth: PropTypes.func,
  registerColumnRef: PropTypes.func,
  registerRowRef: PropTypes.func,
  onSortToggle: PropTypes.func,
  onHideColumn: PropTypes.func,
  onTogglePinned: PropTypes.func,
  onColumnResizeStart: PropTypes.func,
  onColumnDragEnd: PropTypes.func,
  onCellMouseDown: PropTypes.func,
  onCellMouseEnter: PropTypes.func,
  onCellKeyDown: PropTypes.func,
  onStartEdit: PropTypes.func,
  onEditingValueChange: PropTypes.func,
  onConfirmEdit: PropTypes.func,
  onCancelEdit: PropTypes.func,
  onToggleRowHidden: PropTypes.func,
  onToggleRowPinned: PropTypes.func,
  transformationMeta: PropTypes.object,
  groupingColumns: PropTypes.array,
  mapping: PropTypes.object,
  aggregations: PropTypes.object
}

