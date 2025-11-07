import { useState } from 'react'
import { FiPlus, FiTrash2, FiAlertCircle } from 'react-icons/fi'

export default function VennDiagramEditor({ sets = [], onSetsChange }) {
  const [showHelper, setShowHelper] = useState(false)

  // Extrahiere alle eindeutigen Mengennamen
  const getAllSetNames = () => {
    const names = new Set()
    sets.forEach(entry => {
      if (Array.isArray(entry.sets)) {
        entry.sets.forEach(name => names.add(name))
      }
    })
    return Array.from(names).sort()
  }

  const allSetNames = getAllSetNames()

  // Füge einen neuen Eintrag hinzu
  const handleAddEntry = () => {
    const newEntry = {
      sets: allSetNames.length > 0 ? [allSetNames[0]] : ['Menge A'],
      value: 0
    }
    onSetsChange([...sets, newEntry])
  }

  // Entferne einen Eintrag
  const handleRemoveEntry = (index) => {
    const newSets = sets.filter((_, i) => i !== index)
    onSetsChange(newSets)
  }

  // Aktualisiere den Wert eines Eintrags
  const handleValueChange = (index, value) => {
    const newSets = [...sets]
    newSets[index] = {
      ...newSets[index],
      value: parseFloat(value) || 0
    }
    onSetsChange(newSets)
  }

  // Aktualisiere die Mengenzuordnung
  const handleSetsChange = (index, setNames) => {
    const newSets = [...sets]
    newSets[index] = {
      ...newSets[index],
      sets: setNames
    }
    onSetsChange(newSets)
  }

  // Füge eine neue Menge hinzu
  const handleAddSet = (index) => {
    const currentSets = sets[index]?.sets || []
    const availableSets = allSetNames.filter(name => !currentSets.includes(name))
    
    if (availableSets.length > 0) {
      handleSetsChange(index, [...currentSets, availableSets[0]])
    }
  }

  // Entferne eine Menge aus einem Eintrag
  const handleRemoveSet = (entryIndex, setIndex) => {
    const currentSets = sets[entryIndex]?.sets || []
    const newSetsList = currentSets.filter((_, i) => i !== setIndex)
    handleSetsChange(entryIndex, newSetsList)
  }

  // Ändere den Namen einer Menge
  const handleSetNameChange = (entryIndex, setIndex, newName) => {
    const currentSets = [...(sets[entryIndex]?.sets || [])]
    currentSets[setIndex] = newName.trim()
    handleSetsChange(entryIndex, currentSets)
  }

  // Gruppiere Einträge nach Anzahl der Mengen
  const groupedSets = {
    single: sets.filter(s => s.sets?.length === 1),
    double: sets.filter(s => s.sets?.length === 2),
    triple: sets.filter(s => s.sets?.length >= 3)
  }

  const renderEntry = (entry, index) => {
    const setCount = entry.sets?.length || 0
    const originalIndex = sets.indexOf(entry)

    return (
      <div
        key={originalIndex}
        className="bg-dark-sidebar p-4 rounded-lg border border-gray-700 hover:border-dark-accent1 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-dark-textLight">
              {setCount === 1 ? 'Einzelne Menge' : `Überlappung (${setCount} Mengen)`}
            </label>
            
            <div className="flex flex-wrap gap-2">
              {(entry.sets || []).map((setName, setIndex) => (
                <div key={setIndex} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={setName}
                    onChange={(e) => handleSetNameChange(originalIndex, setIndex, e.target.value)}
                    placeholder="Mengenname"
                    className="px-2 py-1 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm w-32"
                  />
                  {entry.sets.length > 1 && (
                    <button
                      onClick={() => handleRemoveSet(originalIndex, setIndex)}
                      className="p-1 text-dark-textGray hover:text-red-400 transition-colors"
                      title="Menge entfernen"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              
              {setCount < 3 && (
                <button
                  onClick={() => handleAddSet(originalIndex)}
                  className="px-2 py-1 bg-dark-accent1 hover:bg-dark-accent2 text-white rounded text-sm flex items-center gap-1 transition-colors"
                  title="Weitere Menge hinzufügen"
                >
                  <FiPlus size={14} />
                  Menge
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => handleRemoveEntry(originalIndex)}
            className="ml-3 p-2 text-dark-textGray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
            title="Eintrag löschen"
          >
            <FiTrash2 size={16} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-textLight mb-2">
            Wert
          </label>
          <input
            type="number"
            value={entry.value}
            onChange={(e) => handleValueChange(originalIndex, e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none"
            placeholder="0"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header mit Hilfe-Button */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-dark-textLight">
          Venn-Diagramm Daten
        </label>
        <button
          onClick={() => setShowHelper(!showHelper)}
          className="text-dark-accent1 hover:text-dark-accent2 text-sm flex items-center gap-1"
        >
          <FiAlertCircle size={16} />
          {showHelper ? 'Hilfe ausblenden' : 'Hilfe anzeigen'}
        </button>
      </div>

      {/* Hilfetext */}
      {showHelper && (
        <div className="bg-dark-accent1/10 border border-dark-accent1/30 rounded-lg p-4 text-sm text-dark-textLight">
          <p className="font-medium mb-2">So funktioniert das Venn-Diagramm:</p>
          <ul className="space-y-1 list-disc list-inside text-dark-textGray">
            <li><strong>Einzelne Mengen:</strong> Zeigen die Größe jeder Menge ohne Überlappung</li>
            <li><strong>Überlappungen (2 Mengen):</strong> Zeigen gemeinsame Elemente zwischen zwei Mengen</li>
            <li><strong>Überlappungen (3 Mengen):</strong> Zeigen gemeinsame Elemente zwischen drei Mengen</li>
            <li>Die Werte sollten logisch aufeinander abgestimmt sein</li>
          </ul>
        </div>
      )}

      {/* Einzelne Mengen */}
      {groupedSets.single.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-dark-textLight border-b border-gray-700 pb-2">
            Einzelne Mengen ({groupedSets.single.length})
          </h4>
          <div className="space-y-3">
            {groupedSets.single.map((entry, idx) => renderEntry(entry, idx))}
          </div>
        </div>
      )}

      {/* 2-fach Überlappungen */}
      {groupedSets.double.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-dark-textLight border-b border-gray-700 pb-2">
            Überlappungen (2 Mengen) ({groupedSets.double.length})
          </h4>
          <div className="space-y-3">
            {groupedSets.double.map((entry, idx) => renderEntry(entry, idx))}
          </div>
        </div>
      )}

      {/* 3-fach Überlappungen */}
      {groupedSets.triple.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-dark-textLight border-b border-gray-700 pb-2">
            Überlappungen (3+ Mengen) ({groupedSets.triple.length})
          </h4>
          <div className="space-y-3">
            {groupedSets.triple.map((entry, idx) => renderEntry(entry, idx))}
          </div>
        </div>
      )}

      {/* Leerer Zustand */}
      {sets.length === 0 && (
        <div className="text-center py-8 bg-dark-sidebar rounded-lg border border-gray-700">
          <FiAlertCircle className="mx-auto mb-2 text-dark-textGray" size={32} />
          <p className="text-dark-textGray mb-4">Noch keine Mengen vorhanden</p>
          <button
            onClick={handleAddEntry}
            className="px-4 py-2 bg-dark-accent1 hover:bg-dark-accent2 text-white rounded flex items-center gap-2 mx-auto transition-colors"
          >
            <FiPlus size={16} />
            Erste Menge hinzufügen
          </button>
        </div>
      )}

      {/* Button zum Hinzufügen */}
      {sets.length > 0 && (
        <button
          onClick={handleAddEntry}
          className="w-full px-4 py-3 bg-dark-accent1 hover:bg-dark-accent2 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <FiPlus size={18} />
          Neuer Eintrag
        </button>
      )}

      {/* Statistik */}
      {sets.length > 0 && (
        <div className="text-xs text-dark-textGray bg-dark-bg rounded p-3 border border-gray-700">
          <strong>Zusammenfassung:</strong> {allSetNames.length} Mengen insgesamt, {sets.length} Einträge 
          ({groupedSets.single.length} einzeln, {groupedSets.double.length} 2-fach, {groupedSets.triple.length} 3-fach Überlappungen)
        </div>
      )}
    </div>
  )
}

