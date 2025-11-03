import PropTypes from 'prop-types'

const OPERATION_OPTIONS = [
  { value: 'sum', label: 'Summe' },
  { value: 'average', label: 'Durchschnitt' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Anzahl Werte' }
]

const SCOPE_OPTIONS = [
  { value: 'raw', label: 'Originaldaten' },
  { value: 'transformed', label: 'Transformierte Daten' }
]

export default function QuickAggregationPanel({
  config,
  numericColumns,
  textColumns,
  result,
  onConfigChange,
  onRun,
  onExport
}) {
  const valueColumns = Array.isArray(config.valueColumns) ? config.valueColumns : []
  const operations = Array.isArray(config.operations) && config.operations.length > 0 ? config.operations : ['sum']
  const hasResult = result && Array.isArray(result.rows) && result.rows.length > 0

  const toggleValueColumn = (columnKey, enabled) => {
    const current = new Set(valueColumns)
    if (enabled) {
      current.add(columnKey)
    } else {
      current.delete(columnKey)
    }
    onConfigChange({ valueColumns: Array.from(current) })
  }

  const toggleOperation = (operation, enabled) => {
    const current = new Set(operations)
    if (enabled) {
      current.add(operation)
    } else {
      current.delete(operation)
    }
    onConfigChange({ operations: Array.from(current) })
  }

  return (
    <section className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-dark-textLight">Quick-Aggregationen</h4>
          <p className="text-[11px] text-dark-textGray">
            Ermitteln Sie auf die Schnelle Summen, Durchschnitte oder gruppierte Kennzahlen ohne den Transformationspfad zu ändern.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const outcome = onRun()
              if (outcome && outcome.computed === false && outcome.reason) {
                window.alert(outcome.reason)
              }
            }}
            className="rounded-md border border-dark-accent1/60 px-3 py-1.5 text-xs font-medium text-dark-accent1 transition-colors hover:bg-dark-accent1/20"
          >
            Berechnen
          </button>
          <button
            type="button"
            onClick={() => {
              const outcome = onExport()
              if (outcome && outcome.exported === false) {
                window.alert('Kein Aggregationsergebnis zum Exportieren vorhanden.')
              }
            }}
            className="rounded-md border border-gray-600 px-3 py-1.5 text-xs text-dark-textGray transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
          >
            Exportieren
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Datenbasis</label>
          <select
            value={config.scope || 'raw'}
            onChange={(event) => onConfigChange({ scope: event.target.value })}
            className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
          >
            {SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Werte-Spalten</label>
          <div className="flex flex-wrap gap-2">
            {numericColumns.length === 0 ? (
              <span className="text-[11px] text-dark-textGray">Keine numerischen Spalten erkannt.</span>
            ) : (
              numericColumns.map((column) => {
                const checked = valueColumns.includes(column.key)
                return (
                  <label
                    key={column.key}
                    className={`flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                      checked
                        ? 'border-dark-accent1/60 bg-dark-accent1/15 text-dark-textLight'
                        : 'border-gray-700 bg-dark-secondary/40 text-dark-textGray hover:border-dark-accent1'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleValueColumn(column.key, event.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                    />
                    <span>{column.key}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Gruppieren nach</label>
          <select
            value={config.groupBy || ''}
            onChange={(event) => onConfigChange({ groupBy: event.target.value })}
            className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
          >
            <option value="">Keine Gruppierung</option>
            {textColumns.map((column) => (
              <option key={column.key} value={column.key}>
                {column.key}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Kennzahlen</label>
          <div className="flex flex-wrap gap-2">
            {OPERATION_OPTIONS.map((option) => {
              const checked = operations.includes(option.value)
              return (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                    checked
                      ? 'border-dark-accent1/60 bg-dark-accent1/15 text-dark-textLight'
                      : 'border-gray-700 bg-dark-secondary/40 text-dark-textGray hover:border-dark-accent1'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => toggleOperation(option.value, event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {hasResult ? (
        <div className="overflow-auto rounded-md border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700 text-xs text-dark-textLight">
            <thead className="bg-dark-secondary/60 text-[10px] uppercase tracking-wide text-dark-textGray">
              <tr>
                {result.columns.map((column) => (
                  <th key={column} className="px-3 py-2 text-left font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {result.rows.map((row, rowIndex) => (
                <tr key={`agg-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`agg-cell-${rowIndex}-${cellIndex}`} className="px-3 py-1.5">
                      {cell === null || cell === undefined || cell === '' ? '–' : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-gray-700 px-3 py-2 text-[10px] text-dark-textGray/80">
            {result.totalRows || 0} Zeilen ausgewertet · Pfad: {result.scope === 'transformed' ? 'Transformiert' : 'Original'}
          </div>
        </div>
      ) : (
        <p className="text-xs text-dark-textGray">
          Keine Ergebnisse. Wählen Sie mindestens eine numerische Spalte und klicken Sie auf „Berechnen“.
        </p>
      )}
    </section>
  )
}

QuickAggregationPanel.propTypes = {
  config: PropTypes.shape({
    scope: PropTypes.oneOf(['raw', 'transformed']),
    valueColumns: PropTypes.arrayOf(PropTypes.string),
    groupBy: PropTypes.string,
    operations: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  numericColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired
    })
  ).isRequired,
  textColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired
    })
  ).isRequired,
  result: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string),
    rows: PropTypes.arrayOf(PropTypes.array)
  }),
  onConfigChange: PropTypes.func.isRequired,
  onRun: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired
}

QuickAggregationPanel.defaultProps = {
  result: null
}
