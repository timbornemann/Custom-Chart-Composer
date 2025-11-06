import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useCsvWorkbenchContext } from './CsvWorkbenchContext'

const summarizeFilter = (filter, index) => {
  if (!filter || typeof filter !== 'object') {
    return `Filter ${index + 1}`
  }

  const column = filter.column || 'Spalte?'
  const operator = filter.operator || 'Operator?'
  const value = filter.value ?? filter.minValue ?? filter.maxValue

  if (value === undefined || value === '') {
    return `${column} · ${operator}`
  }

  return `${column} · ${operator} → ${value}`
}

export default function FilterBuilder({ onClose }) {
  const {
    filterGroups,
    activeFilterGroupId,
    currentFilters,
    saveFilterGroup,
    applyFilterGroup,
    resetActiveFilterGroup,
    removeFilterGroup
  } = useCsvWorkbenchContext()

  const [groupName, setGroupName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState(activeFilterGroupId || (filterGroups[0]?.id ?? ''))
  const [feedback, setFeedback] = useState(null)

  const activeFiltersCount = currentFilters.length

  useEffect(() => {
    if (activeFilterGroupId) {
      setSelectedGroupId(activeFilterGroupId)
      return
    }

    if (!filterGroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(filterGroups[0]?.id ?? '')
    }
  }, [activeFilterGroupId, filterGroups, selectedGroupId])

  const handleSaveGroup = () => {
    if (activeFiltersCount === 0) {
      setFeedback({ type: 'warning', message: 'Es müssen aktive Filter vorhanden sein, um eine Gruppe zu speichern.' })
      return
    }

    const newId = saveFilterGroup({ name: groupName })
    if (newId) {
      setFeedback({ type: 'success', message: 'Filtergruppe gespeichert.' })
      setGroupName('')
      setSelectedGroupId(newId)
    } else {
      setFeedback({ type: 'warning', message: 'Filtergruppe konnte nicht gespeichert werden.' })
    }
  }

  const handleApplyGroup = () => {
    if (!selectedGroupId) {
      setFeedback({ type: 'warning', message: 'Bitte wählen Sie eine Filtergruppe aus.' })
      return
    }

    const applied = applyFilterGroup(selectedGroupId)
    if (applied) {
      setFeedback({ type: 'success', message: 'Filtergruppe angewendet.' })
    } else {
      setFeedback({ type: 'warning', message: 'Filtergruppe konnte nicht angewendet werden.' })
    }
  }

  const handleReset = () => {
    resetActiveFilterGroup()
    setSelectedGroupId('')
    setFeedback({ type: 'info', message: 'Filter wurden zurückgesetzt.' })
  }

  const handleRemove = (groupId) => {
    const removed = removeFilterGroup(groupId)
    if (removed) {
      if (selectedGroupId === groupId) {
        setSelectedGroupId('')
      }
      setFeedback({ type: 'info', message: 'Filtergruppe entfernt.' })
    }
  }

  const selectedGroup = useMemo(
    () => filterGroups.find((group) => group.id === selectedGroupId) || null,
    [filterGroups, selectedGroupId]
  )

  const renderFilterSummary = (filters) => {
    if (!Array.isArray(filters) || filters.length === 0) {
      return <p className="text-xs text-dark-textGray">Keine Filter definiert.</p>
    }

    return (
      <ul className="space-y-1 text-xs text-dark-textLight">
        {filters.map((filter, index) => (
          <li key={filter.id || index} className="rounded border border-gray-700/60 bg-dark-bg/50 px-2 py-1">
            {summarizeFilter(filter, index)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-3xl rounded-xl border border-gray-700 bg-dark-secondary shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-textLight">Filtergruppen verwalten</h2>
            <p className="text-xs text-dark-textGray">Speichern Sie häufig verwendete Kombinationen von Filtern.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-700 px-3 py-1 text-sm text-dark-textGray transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
          >
            Schließen
          </button>
        </div>

        <div className="grid gap-5 px-5 py-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
              <h3 className="text-sm font-semibold text-dark-textLight">Aktuelle Filter</h3>
              <p className="text-xs text-dark-textGray">{activeFiltersCount} Filter aktiv</p>
              <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                {renderFilterSummary(currentFilters)}
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-dark-textLight">Neue Gruppe speichern</h3>
              <input
                type="text"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Name der Filtergruppe"
                className="w-full rounded border border-gray-700 bg-dark-secondary px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveGroup}
                className="w-full rounded-lg border border-dark-accent1 bg-dark-accent1/20 px-3 py-2 text-sm font-medium text-dark-textLight transition-colors hover:bg-dark-accent1/30"
              >
                💾 Filtergruppe speichern
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-dark-textLight">Gespeicherte Gruppen</h3>
                <span className="text-xs text-dark-textGray">{filterGroups.length} vorhanden</span>
              </div>

              {filterGroups.length === 0 ? (
                <p className="text-xs text-dark-textGray">Noch keine Filtergruppen gespeichert.</p>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedGroupId}
                    onChange={(event) => setSelectedGroupId(event.target.value)}
                    className="w-full rounded border border-gray-700 bg-dark-secondary px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  >
                    <option value="">Filtergruppe wählen</option>
                    {filterGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name || 'Ohne Namen'}
                      </option>
                    ))}
                  </select>

                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedGroup ? renderFilterSummary(selectedGroup.filters) : (
                      <p className="text-xs text-dark-textGray">Keine Filter für die ausgewählte Gruppe verfügbar.</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleApplyGroup}
                      className="flex-1 rounded-lg bg-dark-accent1 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-accent1/90"
                      disabled={!selectedGroupId}
                    >
                      ✓ Anwenden
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-dark-accent1"
                    >
                      ⟲ Zurücksetzen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedGroup && (
              <button
                type="button"
                onClick={() => handleRemove(selectedGroup.id)}
                className="w-full rounded-lg border border-red-600 bg-red-900/20 px-3 py-2 text-sm text-red-200 transition-colors hover:bg-red-900/30"
              >
                🗑️ Ausgewählte Gruppe löschen
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div className="border-t border-gray-700 bg-dark-bg/60 px-5 py-3 text-xs text-dark-textGray">
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  )
}

FilterBuilder.propTypes = {
  onClose: PropTypes.func.isRequired
}

