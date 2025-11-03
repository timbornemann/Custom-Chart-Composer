import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const MAX_HIGHLIGHT_SEGMENTS = 100
const MAX_PREVIEW_ROWS = 12

const SEARCH_MODE_LABELS = {
  normal: 'Normal (Teiltreffer)',
  whole: 'Ganzwort',
  regex: 'Regex'
}

const highlightMatches = (value, matches) => {
  if (!value) {
    return value
  }
  if (!matches || matches.length === 0) {
    return value
  }

  const text = String(value)
  const segments = []
  let cursor = 0
  const limited = matches.slice(0, MAX_HIGHLIGHT_SEGMENTS)

  limited.forEach((match, index) => {
    const start = Math.max(0, Math.min(match.start ?? 0, text.length))
    const end = Math.max(start, Math.min(match.end ?? start, text.length))
    if (start > cursor) {
      segments.push(text.slice(cursor, start))
    }
    if (end > start) {
      segments.push(
        <mark
          key={`hl-${index}-${start}`}
          className="rounded bg-yellow-500/30 px-0.5 text-dark-textLight"
        >
          {text.slice(start, end)}
        </mark>
      )
    }
    cursor = end
  })

  if (cursor < text.length) {
    segments.push(text.slice(cursor))
  }

  return segments
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildReplacementPreview = (value, searchConfig, replacement) => {
  if (!searchConfig?.isActive) {
    return value
  }

  const text = value === null || value === undefined ? '' : String(value)
  if (!text) {
    return text
  }

  try {
    if (searchConfig.mode === 'regex' && searchConfig.regexSource) {
      const regex = new RegExp(searchConfig.regexSource, searchConfig.regexFlags || 'giu')
      return text.replace(regex, replacement)
    }

    if (searchConfig.mode === 'whole' && searchConfig.regexSource) {
      const regex = new RegExp(searchConfig.regexSource, searchConfig.regexFlags || 'giu')
      return text.replace(regex, () => replacement)
    }

    const pattern = escapeRegExp(searchConfig.query || '')
    if (!pattern) {
      return text
    }
    const regex = new RegExp(pattern, 'giu')
    return text.replace(regex, () => replacement)
  } catch (_error) {
    return text
  }
}

export default function CsvFindReplaceModal({
  isOpen,
  onClose,
  onConfirm,
  searchQuery,
  searchMode,
  onSearchModeChange,
  searchColumns,
  onToggleColumn,
  onResetColumns,
  availableColumns,
  searchConfig = null,
  rawMatches,
  transformedMatches,
  totalRawMatches,
  totalTransformedMatches,
  canReplaceInTransformed,
  transformedScopeDisabledReason = '',
  defaultScope = 'raw',
  activeMatch = null,
  onPreviewMatchFocus = () => {}
}) {
  const [replacementValue, setReplacementValue] = useState('')
  const [scope, setScope] = useState(defaultScope)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setScope(canReplaceInTransformed ? defaultScope : 'raw')
      setReplacementValue('')
      setFeedback(null)
    }
  }, [isOpen, canReplaceInTransformed, defaultScope])

  const columnMap = useMemo(() => {
    const map = new Map()
    availableColumns.forEach((column) => {
      map.set(column.key, column.label || column.key)
    })
    return map
  }, [availableColumns])

  const previewMatches = useMemo(() => {
    const source = scope === 'transformed' ? transformedMatches : rawMatches
    return source.slice(0, MAX_PREVIEW_ROWS)
  }, [scope, rawMatches, transformedMatches])

  const selectedColumnsSummary = useMemo(() => {
    if (!searchColumns || searchColumns.length === 0) {
      return 'Alle Spalten'
    }
    if (searchColumns.length <= 3) {
      return searchColumns.map((key) => columnMap.get(key) || key).join(', ')
    }
    return `${searchColumns.length} Spalten`
  }, [searchColumns, columnMap])

  const currentModeLabel = SEARCH_MODE_LABELS[searchMode] || 'Unbekannt'

  const totalMatchesForScope = scope === 'transformed' ? totalTransformedMatches : totalRawMatches

  if (!isOpen) {
    return null
  }

  const handleSubmit = async () => {
    if (!searchConfig?.isActive || totalMatchesForScope === 0) {
      setFeedback({ type: 'warning', message: 'Keine Treffer zum Ersetzen vorhanden.' })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)
    try {
      const result = await Promise.resolve(onConfirm({ scope, replacement: replacementValue }))
      if (result?.applied) {
        setFeedback({ type: 'success', message: `${result.updatedCells || 0} Zellen ersetzt.` })
      } else {
        const reason = result?.reason || 'Es konnten keine Werte ersetzt werden.'
        setFeedback({ type: 'warning', message: reason })
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ersetzen fehlgeschlagen.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl rounded-2xl border border-gray-700 bg-dark-secondary shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-700/70 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-textLight">Suchen &amp; Ersetzen</h2>
            <p className="mt-1 text-xs text-dark-textGray">
              Suche nach „{searchQuery || '–'}“ im Modus {currentModeLabel} &bull; {selectedColumnsSummary}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textGray hover:text-dark-textLight"
          >
            Schließen
          </button>
        </div>
        <div className="grid gap-6 px-6 py-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-1">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-dark-textGray">
                Suchmodus
              </label>
              <select
                value={searchMode}
                onChange={onSearchModeChange}
                className="mt-1 w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              >
                <option value="normal">Normal (Teiltreffer)</option>
                <option value="whole">Ganzwort</option>
                <option value="regex">Regex</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-dark-textGray">
                Zielspalten
              </label>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-700 bg-dark-bg/50 p-2 text-xs">
                {availableColumns.length === 0 ? (
                  <p className="text-dark-textGray">Keine Spalten vorhanden.</p>
                ) : (
                  availableColumns.map((column) => {
                    const checked = searchColumns.length === 0 || searchColumns.includes(column.key)
                    return (
                      <label key={column.key} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-dark-secondary/60">
                        <span className="truncate text-dark-textLight">{column.label || column.key}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => onToggleColumn(column.key, event.target.checked)}
                          className="h-3.5 w-3.5 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                        />
                      </label>
                    )
                  })
                )}
              </div>
              <button
                type="button"
                onClick={onResetColumns}
                className="mt-2 text-[11px] text-dark-accent1 hover:underline"
              >
                Alle Spalten auswählen
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-dark-textGray">
                Ersetzen durch
              </label>
              <input
                type="text"
                value={replacementValue}
                onChange={(event) => setReplacementValue(event.target.value)}
                placeholder="Neuer Wert"
                className="mt-1 w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-dark-textGray/80">
                Leerer Wert entfernt die Treffer. Regex-Ersetzungen unterstützen Platzhalter wie $1.
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-dark-textGray">
                Pfad
              </label>
              <div className="mt-1 space-y-2 rounded-md border border-gray-700 bg-dark-bg/50 p-3 text-xs text-dark-textLight">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="replace-scope"
                    value="raw"
                    checked={scope === 'raw'}
                    onChange={() => setScope('raw')}
                    className="h-3.5 w-3.5 border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                  />
                  <span>Originaldaten ({totalRawMatches} Treffer)</span>
                </label>
                <label className={`flex items-center gap-2 ${canReplaceInTransformed ? '' : 'text-dark-textGray/70'}`}>
                  <input
                    type="radio"
                    name="replace-scope"
                    value="transformed"
                    checked={scope === 'transformed'}
                    onChange={() => setScope('transformed')}
                    disabled={!canReplaceInTransformed}
                    className="h-3.5 w-3.5 border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                  />
                  <span>Transformationspfad ({totalTransformedMatches} Treffer)</span>
                </label>
                {!canReplaceInTransformed && transformedScopeDisabledReason && (
                  <p className="text-[10px] text-dark-textGray">
                    {transformedScopeDisabledReason}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-md border border-gray-700 bg-dark-bg/40 p-3 text-[11px] text-dark-textGray">
              <p>
                Insgesamt {totalRawMatches} Treffer im Original und {totalTransformedMatches} nach Transformationen gefunden.
              </p>
              <p className="mt-1">
                Vorschau zeigt bis zu {MAX_PREVIEW_ROWS} Beispiele aus dem gewählten Pfad.
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-dark-textLight">Treffer-Vorschau</h3>
              <span className="text-[11px] text-dark-textGray">
                {previewMatches.length} von {totalMatchesForScope} Treffern angezeigt
              </span>
            </div>
            <div className="mt-3 max-h-[340px] overflow-y-auto rounded-lg border border-gray-700 bg-dark-bg/40">
              {previewMatches.length === 0 ? (
                <div className="p-6 text-center text-sm text-dark-textGray">
                  Keine Treffer für die aktuelle Suche im gewählten Pfad.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-dark-textLight/90">
                  <thead className="bg-dark-bg/80 text-[11px] uppercase tracking-wide text-dark-textGray">
                    <tr>
                      <th className="px-3 py-2 font-medium">Zeile</th>
                      <th className="px-3 py-2 font-medium">Spalte</th>
                      <th className="px-3 py-2 font-medium">Aktueller Wert</th>
                      <th className="px-3 py-2 font-medium">Ersetzt durch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {previewMatches.map((match) => {
                      const columnLabel = columnMap.get(match.columnKey) || match.columnKey
                      const currentValue = match.formattedValue
                      const highlighted = highlightMatches(currentValue, match.positions)
                      const replacedPreview = buildReplacementPreview(currentValue, searchConfig, replacementValue)
                      const isActive =
                        activeMatch &&
                        activeMatch.scope === (match.scope || scope) &&
                        activeMatch.rowIndex === match.rowIndex &&
                        activeMatch.columnKey === match.columnKey
                      return (
                        <tr
                          key={`${match.scope || scope}-${match.rowIndex}-${match.columnKey}`}
                          className={`cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-dark-accent1/15 text-dark-textLight'
                              : 'hover:bg-dark-secondary/50'
                          }`}
                          tabIndex={0}
                          onClick={() => onPreviewMatchFocus({ ...match, scope: match.scope || scope })}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              onPreviewMatchFocus({ ...match, scope: match.scope || scope })
                            }
                          }}
                        >
                          <td className="px-3 py-2 font-mono text-[11px] text-dark-textGray/80">#{match.rowIndex + 1}</td>
                          <td className="px-3 py-2 text-dark-textLight">{columnLabel}</td>
                          <td className="px-3 py-2 text-dark-textLight">{highlighted}</td>
                          <td className="px-3 py-2 text-dark-accent1">
                            {replacedPreview === currentValue ? (
                              <span className="text-dark-textGray/70">Keine Änderung</span>
                            ) : (
                              replacedPreview || <span className="text-dark-textGray/70">(leer)</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        {feedback && (
          <div
            className={`mx-6 mb-4 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-600/60 bg-emerald-600/10 text-emerald-200'
                : feedback.type === 'error'
                  ? 'border-red-600/60 bg-red-600/10 text-red-200'
                  : 'border-yellow-600/60 bg-yellow-600/10 text-yellow-200'
            }`}
          >
            {feedback.message}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 border-t border-gray-700/70 bg-dark-bg/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-700 bg-dark-bg px-4 py-2 text-sm text-dark-textGray hover:text-dark-textLight"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || totalMatchesForScope === 0 || !searchConfig?.isActive}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              isSubmitting || totalMatchesForScope === 0 || !searchConfig?.isActive
                ? 'cursor-not-allowed border-gray-700 bg-gray-800 text-dark-textGray'
                : 'border-dark-accent1 bg-dark-accent1/20 text-dark-accent1 hover:bg-dark-accent1/40'
            }`}
          >
            {isSubmitting ? 'Ersetze …' : 'Ersetzen'}
          </button>
        </div>
      </div>
    </div>
  )
}

CsvFindReplaceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  searchMode: PropTypes.string.isRequired,
  onSearchModeChange: PropTypes.func.isRequired,
  searchColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleColumn: PropTypes.func.isRequired,
  onResetColumns: PropTypes.func.isRequired,
  availableColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string
    })
  ).isRequired,
  searchConfig: PropTypes.object,
  rawMatches: PropTypes.arrayOf(
    PropTypes.shape({
      rowIndex: PropTypes.number.isRequired,
      columnKey: PropTypes.string.isRequired,
      positions: PropTypes.arrayOf(
        PropTypes.shape({
          start: PropTypes.number,
          end: PropTypes.number
        })
      ),
      formattedValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ).isRequired,
  transformedMatches: PropTypes.arrayOf(
    PropTypes.shape({
      rowIndex: PropTypes.number.isRequired,
      columnKey: PropTypes.string.isRequired,
      positions: PropTypes.arrayOf(
        PropTypes.shape({
          start: PropTypes.number,
          end: PropTypes.number
        })
      ),
      formattedValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ).isRequired,
  totalRawMatches: PropTypes.number.isRequired,
  totalTransformedMatches: PropTypes.number.isRequired,
  canReplaceInTransformed: PropTypes.bool.isRequired,
  transformedScopeDisabledReason: PropTypes.string,
  defaultScope: PropTypes.oneOf(['raw', 'transformed']),
  activeMatch: PropTypes.shape({
    scope: PropTypes.oneOf(['raw', 'transformed']).isRequired,
    rowIndex: PropTypes.number.isRequired,
    columnKey: PropTypes.string.isRequired
  }),
  onPreviewMatchFocus: PropTypes.func
}

