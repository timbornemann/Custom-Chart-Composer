import PropTypes from 'prop-types'

export default function DuplicatesSection({
  columns,
  duplicateKeyColumns,
  hasDuplicateSelection,
  hasDuplicates,
  duplicateGroups,
  duplicateRowCount,
  duplicateActionFeedback,
  onToggleColumn,
  onSelectAll,
  onClear,
  onResolveAction
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-dark-textLight">Duplikate prüfen</h3>
        <p className="text-xs text-dark-textGray">
          Wählen Sie Schlüsselspalten, um doppelte Zeilen zu identifizieren und zu bereinigen.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-dark-textLight">Schlüsselspalten</h4>
            <p className="text-[11px] text-dark-textGray">
              Die Kombination dieser Spalten dient als eindeutiger Schlüssel für Duplikate.
            </p>
          </div>
          <div className="flex gap-2 text-[11px]">
            <button
              type="button"
              onClick={onSelectAll}
              className="rounded-md border border-gray-700 px-2 py-1 text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1"
              disabled={columns.length === 0}
            >
              Alle
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-md border border-gray-700 px-2 py-1 text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1"
              disabled={duplicateKeyColumns.length === 0}
            >
              Keine
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {columns.length === 0 ? (
            <p className="col-span-full text-[11px] text-dark-textGray">Keine Spalten verf?gbar.</p>
          ) : (
            columns.map((column) => {
              const checked = duplicateKeyColumns.includes(column.key)
              return (
                <label
                  key={`duplicate-key-${column.key}`}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    checked
                      ? 'border-dark-accent1/70 bg-dark-secondary/60 text-dark-textLight'
                      : 'border-gray-700 bg-dark-secondary/30 text-dark-textLight hover:border-dark-accent1'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onToggleColumn(column.key, event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                  />
                  <span className="truncate">{column.key}</span>
                </label>
              )
            })
          )}
        </div>

        <div className="rounded-md border border-gray-700/60 bg-dark-secondary/30 p-3 text-[11px] text-dark-textGray">
          {!hasDuplicateSelection && <p>Wählen Sie mindestens eine Spalte aus, um nach Duplikaten zu suchen.</p>}
          {hasDuplicateSelection && !hasDuplicates && (
            <p className="text-dark-textLight/80">Für die ausgewählten Schlüssel wurden keine Duplikate gefunden.</p>
          )}
          {hasDuplicateSelection && hasDuplicates && (
            <div className="space-y-1 text-dark-textLight/90">
              <p>
                <span className="font-semibold text-dark-textLight">{duplicateGroups.length}</span>{' '}
                {duplicateGroups.length === 1 ? 'Gruppe' : 'Gruppen'} mit{' '}
                <span className="font-semibold text-dark-textLight">{duplicateRowCount}</span>{' '}
                {duplicateRowCount === 1 ? 'Zeile' : 'Zeilen'} gefunden.
              </p>
              <p className="text-dark-textGray">Duplikatzeilen sind im Raster markiert.</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onResolveAction('keep-oldest')}
            className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!hasDuplicates}
          >
            Älteste Zeile behalten
          </button>
          <button
            type="button"
            onClick={() => onResolveAction('merge')}
            className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!hasDuplicates}
          >
            Zusammenführen
          </button>
          {duplicateActionFeedback && (
            <span
              className={`text-xs ${
                duplicateActionFeedback.type === 'success' ? 'text-emerald-300' : 'text-dark-textGray'
              }`}
            >
              {duplicateActionFeedback.message}
            </span>
          )}
        </div>

        {hasDuplicates && (
          <div className="max-h-52 overflow-y-auto rounded-md border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 text-[11px]">
              <thead className="bg-dark-secondary/40 text-[10px] uppercase tracking-wide text-dark-textGray">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Schlüssel</th>
                  <th className="px-3 py-2 text-left font-semibold">Primärzeile</th>
                  <th className="px-3 py-2 text-left font-semibold">Weitere Zeilen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-dark-bg/40 text-dark-textLight">
                {duplicateGroups.map((group) => (
                  <tr key={`duplicate-group-${group.primaryIndex}-${group.key}`}>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {group.keyParts.map((part, index) => (
                          <div key={`${group.key}-part-${index}`} className="flex items-center gap-2">
                            <span className="text-dark-textGray">{group.keyColumns?.[index]}:</span>
                            <span className="font-mono text-dark-textLight/90">{part.display}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-dark-textGray">#{group.primaryIndex + 1}</td>
                    <td className="px-3 py-2 font-mono text-dark-textGray">
                      {group.duplicateIndices.map((rowIndex) => `#${rowIndex + 1}`).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

DuplicatesSection.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired
    })
  ).isRequired,
  duplicateKeyColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  hasDuplicateSelection: PropTypes.bool.isRequired,
  hasDuplicates: PropTypes.bool.isRequired,
  duplicateGroups: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      keyParts: PropTypes.arrayOf(
        PropTypes.shape({
          display: PropTypes.string
        })
      ),
      keyColumns: PropTypes.arrayOf(PropTypes.string),
      primaryIndex: PropTypes.number,
      duplicateIndices: PropTypes.arrayOf(PropTypes.number)
    })
  ).isRequired,
  duplicateRowCount: PropTypes.number.isRequired,
  duplicateActionFeedback: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string
  }),
  onToggleColumn: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onResolveAction: PropTypes.func.isRequired
}

DuplicatesSection.defaultProps = {
  duplicateActionFeedback: null
}

