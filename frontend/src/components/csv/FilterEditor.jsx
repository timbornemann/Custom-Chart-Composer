import PropTypes from 'prop-types'
import { FILTER_OPERATORS } from './constants'

export default function FilterEditor({ columns, filters, onAddFilter, onToggleFilter, onChangeFilter, onRemoveFilter }) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-dark-textLight">Filter</h4>
        <button
          type="button"
          onClick={onAddFilter}
          className="rounded-md border border-gray-600 px-3 py-1 text-xs font-medium text-dark-textLight hover:border-dark-accent1 hover:text-dark-accent1"
        >
          Filter hinzuf?gen
        </button>
      </div>
      {filters.length === 0 ? (
        <p className="text-xs text-dark-textGray">
          Es sind keine Filter aktiv. F?gen Sie Filter hinzu, um Zeilen anhand von Bedingungen auszuschlie?en.
        </p>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, filterIndex) => (
            <div key={filter.id} className="space-y-2">
              {filterIndex > 0 && (
                <div className="flex items-center justify-center py-1">
                  <select
                    value={filter.logicOperator || 'and'}
                    onChange={(event) => onChangeFilter(filter.id, { logicOperator: event.target.value })}
                    className="rounded-md border border-gray-600 bg-dark-bg/80 px-3 py-1 text-xs font-semibold text-dark-textLight hover:border-dark-accent1 focus:border-dark-accent1 focus:outline-none"
                  >
                    <option value="and">UND</option>
                    <option value="or">ODER</option>
                  </select>
                </div>
              )}
              <div className="space-y-3 rounded-md border border-gray-700 bg-dark-bg/60 p-3">
                <div className="grid items-start gap-3 md:grid-cols-12">
                  <div className="flex items-center space-x-2 md:col-span-12 lg:col-span-2">
                    <input
                      type="checkbox"
                      checked={filter.enabled !== false}
                      onChange={(event) => onToggleFilter(filter.id, event.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                    />
                    <span className="text-xs text-dark-textLight">Aktiv</span>
                  </div>
                  <div className="md:col-span-6 lg:col-span-4">
                    <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">Spalte</label>
                    <select
                      value={filter.column}
                      onChange={(event) => onChangeFilter(filter.id, { column: event.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                    >
                      <option value="">Spalte wählen </option>
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
                      value={filter.operator || 'equalsText'}
                      onChange={(event) =>
                        onChangeFilter(filter.id, {
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
                  {filter.operator === 'between' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Min-Wert</label>
                        <input
                          type="number"
                          step="any"
                          value={filter.minValue || ''}
                          onChange={(event) => onChangeFilter(filter.id, { minValue: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="Min"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Max-Wert</label>
                        <input
                          type="number"
                          step="any"
                          value={filter.maxValue || ''}
                          onChange={(event) => onChangeFilter(filter.id, { maxValue: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  )}
                  {filter.operator === 'dateBetween' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Von (Datum)</label>
                        <input
                          type="text"
                          value={filter.minValue || ''}
                          onChange={(event) => onChangeFilter(filter.id, { minValue: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="2023-12-01 oder ISO 8601"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Bis (Datum)</label>
                        <input
                          type="text"
                          value={filter.maxValue || ''}
                          onChange={(event) => onChangeFilter(filter.id, { maxValue: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="2023-12-31 oder ISO 8601"
                        />
                      </div>
                    </div>
                  )}
                  {['matchesRegex', 'notMatchesRegex'].includes(filter.operator) && (
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Regex-Muster</label>
                        <input
                          type="text"
                          value={filter.value || ''}
                          onChange={(event) => onChangeFilter(filter.id, { value: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="z. B. ^[A-Z]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Flags</label>
                        <input
                          type="text"
                          value={filter.flags || ''}
                          onChange={(event) => onChangeFilter(filter.id, { flags: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="i, g"
                        />
                      </div>
                    </div>
                  )}
                  {filter.operator?.startsWith('date') && filter.operator !== 'dateBetween' && (
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Datum/Zeit (ISO 8601)</label>
                      <input
                        type="text"
                        value={filter.value || ''}
                        onChange={(event) => onChangeFilter(filter.id, { value: event.target.value })}
                        className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                        placeholder="2023-12-25T10:30:00 oder 2023-12-25"
                      />
                    </div>
                  )}
                  {!['between', 'dateBetween', 'matchesRegex', 'notMatchesRegex', 'isEmpty', 'isNotEmpty', 'isNumber', 'isText', 'isDateTime'].includes(filter.operator) &&
                    !filter.operator?.startsWith('date') && (
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Wert</label>
                        <input
                          type={['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(filter.operator) ? 'number' : 'text'}
                          step={['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(filter.operator) ? 'any' : undefined}
                          value={filter.value || ''}
                          onChange={(event) => onChangeFilter(filter.id, { value: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder={['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(filter.operator) ? 'Zahl' : 'Text'}
                        />
                      </div>
                    )}
                  {['isEmpty', 'isNotEmpty', 'isNumber', 'isText', 'isDateTime'].includes(filter.operator) && (
                    <p className="text-[10px] italic text-dark-textGray">Kein Wert erforderlich</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemoveFilter(filter.id)}
                    className="rounded-md border border-red-600 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

FilterEditor.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired
    })
  ).isRequired,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired
    })
  ).isRequired,
  onAddFilter: PropTypes.func.isRequired,
  onToggleFilter: PropTypes.func.isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  onRemoveFilter: PropTypes.func.isRequired
}

