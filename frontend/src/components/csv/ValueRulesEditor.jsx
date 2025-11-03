import PropTypes from 'prop-types'
import { VALUE_RULE_ACTIONS, VALUE_RULE_CONDITIONS } from './constants'

export default function ValueRulesEditor({ columns, valueRules, onAddRule, onRemoveRule, onChangeRule }) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
      <h4 className="text-sm font-semibold text-dark-textLight">Wert-Regeln (vor Filter/Gruppierung)</h4>
      <p className="text-[11px] text-dark-textGray">Regelbasiertes Umformen. Originaldaten bleiben erhalten.</p>
      <div className="space-y-2">
        {valueRules.length === 0 ? (
          <p className="text-xs text-dark-textGray">Keine Regeln hinzugef?gt.</p>
        ) : (
          valueRules.map((rule) => (
            <div
              key={rule.id}
              className="grid items-center gap-2 rounded-md border border-gray-700 bg-dark-bg/60 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <select
                value={rule.column || ''}
                onChange={(event) => onChangeRule(rule.id, { column: event.target.value })}
                className="rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              >
                <option value="">Spalte w?hlen?</option>
                {columns.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.key}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  value={rule.when?.operator || 'containsText'}
                  onChange={(event) =>
                    onChangeRule(rule.id, {
                      when: { ...(rule.when || {}), operator: event.target.value }
                    })
                  }
                  className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
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
                      onChangeRule(rule.id, {
                        when: { ...(rule.when || {}), value: event.target.value }
                      })
                    }
                    placeholder={rule.when?.operator === 'matchesRegex' ? 'Regex Muster' : 'Wert'}
                    className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  />
                )}
                {rule.when?.operator === 'matchesRegex' && (
                  <input
                    type="text"
                    value={rule.when?.flags || ''}
                    onChange={(event) =>
                      onChangeRule(rule.id, {
                        when: { ...(rule.when || {}), flags: event.target.value }
                      })
                    }
                    placeholder="Flags"
                    className="w-24 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={rule.action?.type || 'replaceText'}
                  onChange={(event) =>
                    onChangeRule(rule.id, {
                      action: { ...(rule.action || {}), type: event.target.value }
                    })
                  }
                  className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
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
                        onChangeRule(rule.id, {
                          action: { ...(rule.action || {}), search: event.target.value }
                        })
                      }
                      placeholder="suche"
                      className="w-28 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={rule.action?.value || ''}
                      onChange={(event) =>
                        onChangeRule(rule.id, {
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
                        onChangeRule(rule.id, {
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
                        onChangeRule(rule.id, {
                          action: { ...(rule.action || {}), flags: event.target.value }
                        })
                      }
                      placeholder="Flags"
                      className="w-16 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={rule.action?.value || ''}
                      onChange={(event) =>
                        onChangeRule(rule.id, {
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
                      onChangeRule(rule.id, {
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
                      onChangeRule(rule.id, {
                        action: { ...(rule.action || {}), factor: event.target.value }
                      })
                    }
                    placeholder="Faktor"
                    className="w-28 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  />
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemoveRule(rule.id)}
                  className="rounded-md border border-red-600 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                >
                  Entfernen
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={onAddRule}
          className="rounded-md border border-gray-700 px-2 py-1 text-xs text-dark-textLight hover:bg-dark-bg/60"
        >
          Regel hinzuf?gen
        </button>
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
  onChangeRule: PropTypes.func.isRequired
}

