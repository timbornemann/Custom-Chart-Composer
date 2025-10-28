import { useEffect } from 'react'
import PropTypes from 'prop-types'
import useDataImport from '../hooks/useDataImport'

const formatCellValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') {
    return value.trim()
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : ''
  }
  return String(value)
}

export default function DataImportModal({
  isOpen,
  onClose,
  onImport,
  allowMultipleValueColumns,
  requireDatasets
}) {
  const {
    fileName,
    columns,
    mapping,
    updateMapping,
    toggleValueColumn,
    parseFile,
    reset,
    previewRows,
    totalRows,
    isLoading,
    parseError,
    validationErrors,
    warnings,
    getImportResult
  } = useDataImport({ allowMultipleValueColumns, requireDatasets })

  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  if (!isOpen) {
    return null
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      parseFile(file)
    }
  }

  const handleImport = () => {
    const result = getImportResult()
    if (!result) {
      return
    }
    onImport(result)
    reset()
  }

  const availableDatasetColumns = columns.filter(
    (column) =>
      column.key !== mapping.label &&
      !mapping.valueColumns.includes(column.key) &&
      column.type !== 'number'
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-4xl rounded-xl bg-dark-secondary shadow-2xl border border-gray-700">
        <div className="flex items-start justify-between border-b border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-textLight">CSV/Excel-Daten importieren</h2>
            <p className="text-sm text-dark-textGray">
              Laden Sie eine Datei hoch und ordnen Sie die Spalten den Diagrammdaten zu.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md bg-transparent p-2 text-dark-textGray hover:text-dark-textLight"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-5">
          <section className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-dark-textLight mb-2">
                Datei auswählen
              </label>
              <input
                type="file"
                accept=".csv,.tsv,.txt,.xls,.xlsx,.ods"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-lg border border-gray-700 bg-dark-bg px-4 py-3 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
              <p className="mt-2 text-xs text-dark-textGray">
                Unterstützte Formate: CSV, TSV sowie Excel-Dateien (.xls, .xlsx, .ods)
              </p>
              {fileName && (
                <p className="mt-1 text-xs text-dark-textLight/80">
                  Ausgewählte Datei: <span className="font-medium">{fileName}</span>
                </p>
              )}
              {parseError && (
                <div className="mt-3 rounded-md border border-red-600/40 bg-red-900/30 px-3 py-2 text-xs text-red-200">
                  {parseError}
                </div>
              )}
            </div>
            {isLoading && (
              <div className="rounded-md border border-blue-500/40 bg-blue-900/20 px-3 py-2 text-xs text-blue-200">
                Datei wird verarbeitet …
              </div>
            )}
          </section>

          {totalRows > 0 && (
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-dark-textLight">Zuordnung</h3>
                <p className="text-xs text-dark-textGray">
                  Wählen Sie aus, welche Spalten Beschriftungen, Werte und optionale Datensatz-Kennungen enthalten.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                    Beschriftungs-Spalte
                  </label>
                  <select
                    value={mapping.label}
                    onChange={(event) => updateMapping({ label: event.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  >
                    <option value="">Spalte wählen …</option>
                    {columns.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.key} {column.type === 'number' ? '(Zahl)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-dark-textGray">
                    Diese Werte werden als Kategorien bzw. X-Achsen-Beschriftungen verwendet.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                    Werte-Spalten
                  </label>
                  {allowMultipleValueColumns ? (
                    <div className="space-y-2 rounded-lg border border-gray-700 bg-dark-bg p-3">
                      {columns.map((column) => {
                        const disabled = column.key === mapping.label
                        const checked = mapping.valueColumns.includes(column.key)
                        return (
                          <label
                            key={column.key}
                            className={`flex items-start space-x-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                              disabled
                                ? 'cursor-not-allowed text-dark-textGray/60'
                                : 'cursor-pointer hover:bg-dark-secondary'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                              checked={checked}
                              onChange={() => toggleValueColumn(column.key)}
                              disabled={disabled}
                            />
                            <span className="flex-1 text-dark-textLight">
                              <span className="font-medium">{column.key}</span>{' '}
                              <span className="text-xs text-dark-textGray">
                                {column.type === 'number' ? 'Zahlen' : 'Text'} · {column.filledCount - column.emptyCount} Werte
                              </span>
                            </span>
                          </label>
                        )
                      })}
                      {mapping.valueColumns.length === 0 && (
                        <p className="text-[11px] text-red-300">Bitte wählen Sie mindestens eine Spalte aus.</p>
                      )}
                    </div>
                  ) : (
                    <select
                      value={mapping.valueColumns[0] || ''}
                      onChange={(event) => updateMapping({ valueColumns: event.target.value ? [event.target.value] : [] })}
                      className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                    >
                      <option value="">Spalte wählen …</option>
                      {columns
                        .filter((column) => column.key !== mapping.label)
                        .map((column) => (
                          <option key={column.key} value={column.key}>
                            {column.key} {column.type === 'number' ? '(Zahl)' : ''}
                          </option>
                        ))}
                    </select>
                  )}
                  <p className="text-[11px] text-dark-textGray">
                    Enthalten die numerischen Werte für das Diagramm. Ungültige Zahlen werden automatisch übersprungen.
                  </p>
                </div>
              </div>

              {allowMultipleValueColumns && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                    Datensatz-Spalte (optional)
                  </label>
                  <select
                    value={mapping.datasetLabel}
                    onChange={(event) => updateMapping({ datasetLabel: event.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  >
                    <option value="">Nicht verwenden</option>
                    {availableDatasetColumns.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.key}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-dark-textGray">
                    Ermöglicht den Import mehrerer Datensätze aus einer Spalte (lange Tabellenform).
                  </p>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="space-y-1 rounded-lg border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-100">
                  {validationErrors.map((message, index) => (
                    <div key={index}>• {message}</div>
                  ))}
                </div>
              )}

              {warnings.length > 0 && (
                <div className="space-y-1 rounded-lg border border-yellow-600/40 bg-yellow-900/30 px-4 py-3 text-xs text-yellow-100">
                  <div className="font-semibold text-yellow-200">Hinweise</div>
                  {warnings.map((message, index) => (
                    <div key={index}>• {message}</div>
                  ))}
                </div>
              )}
            </section>
          )}

          {previewRows.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-dark-textLight">Vorschau</h3>
                <span className="text-xs text-dark-textGray">{totalRows} Zeilen erkannt</span>
              </div>
              <div className="max-h-64 overflow-auto rounded-lg border border-gray-700">
                <table className="min-w-full divide-y divide-gray-700 text-sm">
                  <thead className="bg-dark-bg/80 text-xs uppercase tracking-wide text-dark-textGray">
                    <tr>
                      {columns.map((column) => (
                        <th key={column.key} className="px-3 py-2 text-left">
                          {column.key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-dark-bg/40 text-dark-textLight">
                    {previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {columns.map((column) => (
                          <td key={column.key} className="px-3 py-2 text-xs text-dark-textLight/90">
                            {formatCellValue(row[column.key]) || <span className="text-dark-textGray/60">–</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-700 bg-dark-bg/60 px-6 py-4">
          <div className="text-xs text-dark-textGray">
            Ungültige oder leere Werte werden automatisch übersprungen, damit der Import nicht scheitert.
          </div>
          <div className="space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-dark-textGray hover:text-dark-textLight"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={totalRows === 0 || isLoading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                totalRows === 0 || isLoading
                  ? 'cursor-not-allowed bg-gray-700/70'
                  : 'bg-dark-accent1 hover:bg-dark-accent1/90'
              }`}
            >
              Daten übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

DataImportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  allowMultipleValueColumns: PropTypes.bool,
  requireDatasets: PropTypes.bool
}

DataImportModal.defaultProps = {
  allowMultipleValueColumns: true,
  requireDatasets: false
}
