import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { FiPlus, FiTrash2, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'

const SAMPLE_SETS = [
  { sets: ['Newsletter'], value: 120 },
  { sets: ['Webinar'], value: 80 },
  { sets: ['Event'], value: 60 },
  { sets: ['Newsletter', 'Webinar'], value: 42 },
  { sets: ['Newsletter', 'Event'], value: 25 },
  { sets: ['Webinar', 'Event'], value: 18 },
  { sets: ['Newsletter', 'Webinar', 'Event'], value: 10 }
]

const generateSetName = (usedNames) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let i = 0; i < alphabet.length; i += 1) {
    const candidate = `Menge ${alphabet[i]}`
    if (!usedNames.includes(candidate)) {
      return candidate
    }
  }
  return `Menge ${usedNames.length + 1}`
}

const combinations = (items, size) => {
  if (size === 1) return items.map(item => [item])
  const result = []
  items.forEach((item, index) => {
    const tail = items.slice(index + 1)
    const tailCombos = combinations(tail, size - 1)
    tailCombos.forEach(combo => {
      result.push([item, ...combo])
    })
  })
  return result
}

const normalizeKey = (entry) => {
  if (!entry || !Array.isArray(entry.sets)) return ''
  return [...entry.sets].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).join('|')
}

export default function VennDiagramEditor({ sets = [], onSetsChange }) {
  const [showHelper, setShowHelper] = useState(false)

  const baseSets = useMemo(() => {
    const names = new Set()
    sets.forEach(entry => {
      if (Array.isArray(entry.sets)) {
        entry.sets.forEach(name => {
          if (name && name.trim()) {
            names.add(name.trim())
          }
        })
      }
    })
    return Array.from(names)
  }, [sets])

  const handleAddBaseSet = () => {
    const newName = generateSetName(baseSets)
    onSetsChange([
      ...sets,
      { sets: [newName], value: 0 }
    ])
  }

  const handleRemoveBaseSet = (name) => {
    const updated = sets.filter(entry => !(Array.isArray(entry.sets) && entry.sets.includes(name)))
    onSetsChange(updated)
  }

  const handleRenameBaseSet = (oldName, newName) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName || baseSets.includes(trimmed)) {
      return
    }
    const updated = sets.map(entry => {
      if (!Array.isArray(entry.sets)) return entry
      const nextSets = entry.sets.map(setName => (setName === oldName ? trimmed : setName))
      return { ...entry, sets: nextSets }
    })
    onSetsChange(updated)
  }

  const handleToggleSetInEntry = (index, setName) => {
    const entry = sets[index]
    if (!entry) return
    const current = Array.isArray(entry.sets) ? [...entry.sets] : []
    const has = current.includes(setName)
    let nextSets
    if (has) {
      nextSets = current.filter(name => name !== setName)
      if (nextSets.length === 0) {
        // Removing the last set deletes the entry
        onSetsChange(sets.filter((_, idx) => idx !== index))
        return
      }
    } else {
      nextSets = [...current, setName]
    }
    const updated = sets.map((item, idx) => (idx === index ? { ...item, sets: nextSets } : item))
    onSetsChange(updated)
  }

  const handleValueChange = (index, value) => {
    const updated = sets.map((entry, idx) => (idx === index ? { ...entry, value: Number(value) || 0 } : entry))
    onSetsChange(updated)
  }

  const handleRemoveEntry = (index) => {
    onSetsChange(sets.filter((_, idx) => idx !== index))
  }

  const handleAddIntersection = (size) => {
    if (baseSets.length < size) return
    const combos = combinations(baseSets, size)
    const existing = new Set(sets.map(entry => normalizeKey(entry)))
    const nextCombo = combos.find(combo => !existing.has(normalizeKey({ sets: combo })))
    if (!nextCombo) return
    onSetsChange([...sets, { sets: nextCombo, value: 0 }])
  }

  const handleClearAll = () => onSetsChange([])
  const handleResetValues = () => onSetsChange(sets.map(entry => ({ ...entry, value: 0 })))
  const handleLoadSample = () => onSetsChange(SAMPLE_SETS)

  const renderEntry = (entry, index) => {
    const key = normalizeKey(entry) || `entry-${index}`
    const sortedBase = [...baseSets]
    return (
      <div
        key={key}
        className="bg-dark-sidebar p-4 rounded-lg border border-gray-700 hover:border-dark-accent1 transition-colors space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {sortedBase.map(name => {
              const isActive = entry.sets?.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleToggleSetInEntry(index, name)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    isActive
                      ? 'bg-dark-accent1/20 border-dark-accent1 text-dark-accent1'
                      : 'border-gray-700 text-dark-textGray hover:border-dark-accent1 hover:text-dark-textLight'
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => handleRemoveEntry(index)}
            className="p-2 text-dark-textGray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
            title="Eintrag löschen"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Wert</label>
          <input
            type="number"
            value={entry.value ?? 0}
            onChange={(event) => handleValueChange(index, event.target.value)}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-dark-textLight">Venn-Diagramm Daten</label>
        <button
          type="button"
          onClick={() => setShowHelper(!showHelper)}
          className="text-dark-accent1 hover:text-dark-accent2 text-sm flex items-center gap-1"
        >
          <FiAlertCircle size={16} />
          {showHelper ? 'Hilfe ausblenden' : 'Hilfe anzeigen'}
        </button>
      </div>

      {showHelper && (
        <div className="bg-dark-accent1/10 border border-dark-accent1/30 rounded-lg p-4 text-sm text-dark-textLight space-y-2">
          <p className="font-medium">Tipps für Venn-Diagramme:</p>
          <ul className="list-disc list-inside text-dark-textGray space-y-1">
            <li>Lege zuerst die Grundmengen fest. Jeder weitere Eintrag kombiniert diese Mengen.</li>
            <li>Doppelklick auf die Mengenamen, um sie umzubenennen.</li>
            <li>Nutze die Schalter in den Einträgen, um Mengen zuzuordnen oder zu entfernen.</li>
            <li>Werte sollten logisch konsistent sein (Überschneidungen dürfen nicht größer sein als Einzelmengen).</li>
          </ul>
        </div>
      )}

      <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight">Grundmengen ({baseSets.length})</h3>
            <p className="text-xs text-dark-textGray">Basis-Mengen definieren die Elemente deines Venn-Diagramms.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddBaseSet}
              className="px-3 py-2 text-xs rounded bg-dark-accent1 hover:bg-dark-accent2 text-white flex items-center gap-1"
            >
              <FiPlus size={14} /> Menge
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3 py-2 text-xs rounded border border-gray-700 text-dark-textLight hover:border-dark-accent1"
            >
              Beispieldaten
            </button>
            <button
              type="button"
              onClick={handleResetValues}
              className="px-3 py-2 text-xs rounded border border-gray-700 text-dark-textLight hover:border-dark-accent1 flex items-center gap-1"
            >
              <FiRefreshCw size={14} /> Werte nullen
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 text-xs rounded border border-red-900/60 text-red-200 hover:bg-red-900/40 flex items-center gap-1"
            >
              <FiTrash2 size={14} /> Alles löschen
            </button>
          </div>
        </div>

        {baseSets.length === 0 ? (
          <div className="text-sm text-dark-textGray bg-dark-bg rounded-lg p-4 text-center">
            Noch keine Mengen vorhanden. Füge zuerst eine Grundmenge hinzu.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {baseSets.map((name, index) => (
              <div key={name} className="bg-dark-bg border border-gray-700 rounded-lg p-3 space-y-2">
                <input
                  type="text"
                  defaultValue={name}
                  onBlur={(event) => handleRenameBaseSet(name, event.target.value)}
                  className="w-full px-3 py-2 bg-dark-sidebar text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveBaseSet(name)}
                  className="w-full px-2 py-1 text-xs rounded border border-gray-700 text-dark-textGray hover:border-red-500 hover:text-red-400"
                  title="Menge und zugehörige Einträge entfernen"
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight">Überlappungen</h3>
            <p className="text-xs text-dark-textGray">Füge neue Schnittmengen hinzu oder bearbeite bestehende Einträge.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAddIntersection(2)}
              disabled={baseSets.length < 2}
              className="px-3 py-2 text-xs rounded border border-gray-700 text-dark-textLight hover:border-dark-accent1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              2er-Überlappung
            </button>
            <button
              type="button"
              onClick={() => handleAddIntersection(3)}
              disabled={baseSets.length < 3}
              className="px-3 py-2 text-xs rounded border border-gray-700 text-dark-textLight hover:border-dark-accent1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              3er-Überlappung
            </button>
          </div>
        </div>

        {sets.length === 0 ? (
          <div className="text-sm text-dark-textGray bg-dark-bg rounded-lg p-4 text-center">
            Noch keine Daten vorhanden. Füge Grundmengen und Überlappungen hinzu.
          </div>
        ) : (
          <div className="space-y-3">
            {sets.map((entry, index) => renderEntry(entry, index))}
          </div>
        )}
      </div>
    </div>
  )
}

VennDiagramEditor.propTypes = {
  sets: PropTypes.arrayOf(PropTypes.shape({
    sets: PropTypes.arrayOf(PropTypes.string),
    value: PropTypes.number
  })),
  onSetsChange: PropTypes.func.isRequired
}
