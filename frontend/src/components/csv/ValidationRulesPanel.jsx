import PropTypes from 'prop-types'

const RULE_TYPES = [
  { value: 'required', label: 'Pflichtfeld' },
  { value: 'numberRange', label: 'Zahlenbereich' },
  { value: 'regex', label: 'Regex-Muster' },
  { value: 'custom', label: 'Individuelle Regel (Ausdruck)' }
]

const SCOPE_OPTIONS = [
  { value: 'raw', label: 'Originaldaten' },
  { value: 'transformed', label: 'Nach Transformationen' }
]

export default function ValidationRulesPanel({
  columns,
  rules,
  issues,
  summary,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
  onFocusIssue
}) {
  const hasRules = Array.isArray(rules) && rules.length > 0
  const columnOptions = Array.isArray(columns) ? columns : []
  const issueList = Array.isArray(issues) ? issues.slice(0, 8) : []
  const summaryList = Array.isArray(summary)
    ? [...summary].sort((a, b) => (b.failures || 0) - (a.failures || 0))
    : []

  return (
    <section className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-dark-textLight">Datenvalidierung</h4>
          <p className="text-[11px] text-dark-textGray">
            Definieren Sie Regeln für Pflichtfelder, Wertebereiche oder eigene Ausdrücke und markieren Sie Verstöße direkt in der Tabelle.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddRule}
          className="rounded-md border border-dark-accent1/60 px-3 py-1.5 text-xs font-medium text-dark-accent1 transition-colors hover:bg-dark-accent1/20"
        >
          Regel hinzufügen
        </button>
      </div>

      {!hasRules ? (
        <p className="text-xs text-dark-textGray">
          Noch keine Regeln definiert. Fügen Sie Regeln hinzu, um Ihre Daten automatisch zu prüfen.
        </p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="space-y-2 rounded-md border border-gray-700 bg-dark-secondary/40 p-3 text-xs text-dark-textLight">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Name</label>
                  <input
                    type="text"
                    value={rule.name || ''}
                    onChange={(event) => onUpdateRule(rule.id, { name: event.target.value })}
                    className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                    placeholder="Regelbezeichnung"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Spalte</label>
                  <select
                    value={rule.column || ''}
                    onChange={(event) => onUpdateRule(rule.id, { column: event.target.value })}
                    className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  >
                    <option value="">Spalte wählen …</option>
                    {columnOptions.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.key}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Typ</label>
                  <select
                    value={rule.type || 'required'}
                    onChange={(event) => onUpdateRule(rule.id, { type: event.target.value })}
                    className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  >
                    {RULE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Pfad</label>
                  <select
                    value={rule.scope || 'raw'}
                    onChange={(event) => onUpdateRule(rule.id, { scope: event.target.value })}
                    className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  >
                    {SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(rule.type === 'numberRange' || rule.type === 'regex' || rule.type === 'custom') && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {rule.type === 'numberRange' && (
                    <>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Minimum</label>
                        <input
                          type="number"
                          value={rule.min ?? ''}
                          onChange={(event) => onUpdateRule(rule.id, { min: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="min"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Maximum</label>
                        <input
                          type="number"
                          value={rule.max ?? ''}
                          onChange={(event) => onUpdateRule(rule.id, { max: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="max"
                        />
                      </div>
                    </>
                  )}
                  {rule.type === 'regex' && (
                    <>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Pattern</label>
                        <input
                          type="text"
                          value={rule.pattern || ''}
                          onChange={(event) => onUpdateRule(rule.id, { pattern: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="z. B. ^[A-Z]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Flags</label>
                        <input
                          type="text"
                          value={rule.flags || ''}
                          onChange={(event) => onUpdateRule(rule.id, { flags: event.target.value })}
                          className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          placeholder="g, i"
                        />
                      </div>
                    </>
                  )}
                  {rule.type === 'custom' && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Ausdruck (JS)</label>
                      <textarea
                        value={rule.expression || ''}
                        onChange={(event) => onUpdateRule(rule.id, { expression: event.target.value })}
                        className="h-20 w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                        placeholder="z. B. value && value.length &gt; 3"
                      />
                      <p className="mt-1 text-[10px] text-dark-textGray/70">
                        Ausdruck erhält <code className="font-mono">value</code> und <code className="font-mono">row</code>.
                        Geben Sie <code className="font-mono">true</code> zurück, wenn der Wert gültig ist.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">Fehlermeldung</label>
                  <input
                    type="text"
                    value={rule.message || ''}
                    onChange={(event) => onUpdateRule(rule.id, { message: event.target.value })}
                    className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                    placeholder="Benutzerdefinierte Meldung"
                  />
                </div>
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => onRemoveRule(rule.id)}
                    className="rounded border border-red-600/60 px-3 py-1.5 text-[11px] text-red-200 transition-colors hover:bg-red-900/30"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {summaryList.length > 0 && (
        <div className="space-y-1 rounded-md border border-gray-700 bg-dark-secondary/30 p-3 text-[11px] text-dark-textGray">
          <div className="font-semibold text-dark-textLight">Zusammenfassung</div>
          <ul className="space-y-1">
            {summaryList.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between">
                <span>{entry.name || entry.column} · {entry.failures || 0}/{entry.total || 0} Verstöße</span>
                <span className="text-dark-textGray/70">{entry.scope === 'transformed' ? 'Transformiert' : 'Original'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {issueList.length > 0 && (
        <div className="space-y-1 rounded-md border border-gray-700 bg-dark-secondary/30 p-3 text-[11px] text-dark-textGray">
          <div className="font-semibold text-dark-textLight">Details ({issueList.length})</div>
          <ul className="space-y-1">
            {issueList.map((issue) => (
              <li key={issue.id}>
                <button
                  type="button"
                  onClick={() => onFocusIssue(issue)}
                  className="w-full text-left text-dark-textLight transition-colors hover:text-dark-accent1"
                >
                  Zeile {issue.rowIndex >= 0 ? issue.rowIndex + 1 : '–'}, Spalte {issue.columnKey}: {issue.message || 'Verstoß'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

ValidationRulesPanel.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired
    })
  ).isRequired,
  rules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired
    })
  ).isRequired,
  issues: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      ruleId: PropTypes.string,
      columnKey: PropTypes.string,
      rowIndex: PropTypes.number,
      message: PropTypes.string
    })
  ),
  summary: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      failures: PropTypes.number,
      total: PropTypes.number
    })
  ),
  onAddRule: PropTypes.func.isRequired,
  onUpdateRule: PropTypes.func.isRequired,
  onRemoveRule: PropTypes.func.isRequired,
  onFocusIssue: PropTypes.func.isRequired
}

ValidationRulesPanel.defaultProps = {
  issues: [],
  summary: []
}
