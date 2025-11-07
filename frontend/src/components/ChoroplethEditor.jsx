import { useState } from 'react'
import { FiPlus, FiTrash2, FiAlertCircle, FiMap } from 'react-icons/fi'

export default function ChoroplethEditor({ regions = [], onRegionsChange }) {
  const [showHelper, setShowHelper] = useState(false)

  // Füge eine neue Region hinzu
  const handleAddRegion = () => {
    const newRegion = {
      id: `REG${regions.length + 1}`,
      label: `Region ${regions.length + 1}`,
      value: 0
    }
    onRegionsChange([...regions, newRegion])
  }

  // Entferne eine Region
  const handleRemoveRegion = (index) => {
    onRegionsChange(regions.filter((_, i) => i !== index))
  }

  // Aktualisiere Region-Eigenschaft
  const handleRegionChange = (index, field, value) => {
    const newRegions = [...regions]
    newRegions[index] = {
      ...newRegions[index],
      [field]: field === 'value' ? (parseFloat(value) || 0) : value
    }
    onRegionsChange(newRegions)
  }

  // Finde Min/Max Werte für Statistik
  const getValueStats = () => {
    if (regions.length === 0) return null
    const values = regions.map(r => r.value).filter(v => !isNaN(v))
    if (values.length === 0) return null
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    }
  }

  const stats = getValueStats()

  // Automatische ID-Generierung basierend auf Label
  const handleLabelChange = (index, value) => {
    const newRegions = [...regions]
    const autoId = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3)
    
    newRegions[index] = {
      ...newRegions[index],
      label: value,
      id: autoId || newRegions[index].id
    }
    onRegionsChange(newRegions)
  }

  // Beispieldaten laden
  const handleLoadExample = () => {
    const exampleRegions = [
      { id: "DEU", label: "Deutschland", value: 82 },
      { id: "FRA", label: "Frankreich", value: 68 },
      { id: "ITA", label: "Italien", value: 60 },
      { id: "ESP", label: "Spanien", value: 47 },
      { id: "POL", label: "Polen", value: 38 }
    ]
    onRegionsChange(exampleRegions)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-dark-textLight flex items-center gap-2">
          <FiMap size={16} />
          Choropleth Regionen
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
          <p className="font-medium mb-2">Choropleth-Karte Daten:</p>
          <ul className="space-y-1 list-disc list-inside text-dark-textGray">
            <li><strong>ID:</strong> Eindeutiger Identifikator (z.B. "DEU" für Deutschland, "FRA" für Frankreich)</li>
            <li><strong>Label:</strong> Anzeigename der Region</li>
            <li><strong>Wert:</strong> Kennzahl, die durch Farbintensität dargestellt wird</li>
            <li>Die ID muss mit den GeoJSON-Features übereinstimmen</li>
            <li>Höhere Werte werden dunkler/intensiver dargestellt</li>
          </ul>
          <div className="mt-3 p-2 bg-dark-bg rounded text-xs">
            <strong>Hinweis:</strong> Für die korrekte Darstellung benötigen Sie auch entsprechende GeoJSON-Features.
            Die ID-Felder müssen mit den Feature-IDs übereinstimmen.
          </div>
        </div>
      )}

      {/* Aktionsleiste */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAddRegion}
          className="flex-1 px-4 py-2 bg-dark-accent1 hover:bg-dark-accent2 text-white rounded flex items-center justify-center gap-2 transition-colors"
        >
          <FiPlus size={16} />
          Region hinzufügen
        </button>
        <button
          onClick={handleLoadExample}
          className="px-4 py-2 bg-dark-bg hover:bg-gray-700 text-dark-textLight rounded border border-gray-700 transition-colors"
          title="Beispieldaten laden"
        >
          Beispiel
        </button>
      </div>

      {/* Statistik */}
      {stats && (
        <div className="bg-dark-sidebar p-3 rounded-lg border border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-dark-textGray">Regionen:</span>
              <div className="text-dark-textLight font-medium">{regions.length}</div>
            </div>
            <div>
              <span className="text-dark-textGray">Wertebereich:</span>
              <div className="text-dark-textLight font-medium">
                {stats.min} - {stats.max}
              </div>
            </div>
            <div>
              <span className="text-dark-textGray">Durchschnitt:</span>
              <div className="text-dark-textLight font-medium">{stats.avg}</div>
            </div>
          </div>
        </div>
      )}

      {/* Regionen Liste */}
      {regions.length > 0 ? (
        <div className="space-y-2">
          {/* Tabellen-Header */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-dark-textGray px-2">
            <div className="col-span-2">ID</div>
            <div className="col-span-5">Label</div>
            <div className="col-span-4">Wert</div>
            <div className="col-span-1"></div>
          </div>

          {/* Einträge */}
          <div className="space-y-2">
            {regions.map((region, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center bg-dark-sidebar p-3 rounded-lg border border-gray-700 hover:border-dark-accent1 transition-colors"
              >
                <div className="col-span-2">
                  <input
                    type="text"
                    value={region.id}
                    onChange={(e) => handleRegionChange(index, 'id', e.target.value.toUpperCase())}
                    placeholder="ID"
                    maxLength={5}
                    className="w-full px-2 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
                  />
                </div>

                <div className="col-span-5">
                  <input
                    type="text"
                    value={region.label}
                    onChange={(e) => handleLabelChange(index, e.target.value)}
                    placeholder="Regionsname"
                    className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>

                <div className="col-span-4">
                  <input
                    type="number"
                    value={region.value}
                    onChange={(e) => handleRegionChange(index, 'value', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleRemoveRegion(index)}
                    className="p-2 text-dark-textGray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    title="Region entfernen"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-dark-sidebar rounded-lg border border-gray-700">
          <FiMap className="mx-auto mb-3 text-dark-textGray" size={48} />
          <p className="text-dark-textGray mb-4">Keine Regionen vorhanden</p>
          <button
            onClick={handleAddRegion}
            className="px-4 py-2 bg-dark-accent1 hover:bg-dark-accent2 text-white rounded flex items-center gap-2 mx-auto transition-colors"
          >
            <FiPlus size={16} />
            Erste Region hinzufügen
          </button>
        </div>
      )}

      {/* GeoJSON Hinweis */}
      {regions.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-dark-textLight">
              <strong>Wichtig:</strong> Die Choropleth-Karte benötigt passende GeoJSON-Features.
              Stellen Sie sicher, dass die IDs mit den Feature-IDs übereinstimmen.
              Die Features können im Tab "Optionen" im Feld "features" als JSON definiert werden.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

