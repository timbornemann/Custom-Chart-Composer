import { useState } from 'react'
import { FiPlus, FiTrash2, FiAlertCircle } from 'react-icons/fi'
import EnhancedColorPicker from './EnhancedColorPicker'

export default function ViolinPlotEditor({ labels = [], series = [], onLabelsChange, onSeriesChange }) {
  const [showHelper, setShowHelper] = useState(false)

  // Füge neue Kategorie hinzu
  const handleAddLabel = () => {
    onLabelsChange([...labels, `Kategorie ${labels.length + 1}`])
    
    // Füge für jede Serie einen neuen Wert-Array hinzu
    const newSeries = series.map(s => ({
      ...s,
      values: [...s.values, [10, 15, 20, 25, 30]]
    }))
    onSeriesChange(newSeries)
  }

  // Entferne eine Kategorie
  const handleRemoveLabel = (index) => {
    onLabelsChange(labels.filter((_, i) => i !== index))
    
    // Entferne den entsprechenden Wert aus allen Serien
    const newSeries = series.map(s => ({
      ...s,
      values: s.values.filter((_, i) => i !== index)
    }))
    onSeriesChange(newSeries)
  }

  // Ändere einen Label-Namen
  const handleLabelChange = (index, value) => {
    const newLabels = [...labels]
    newLabels[index] = value
    onLabelsChange(newLabels)
  }

  // Füge eine neue Serie hinzu
  const handleAddSeries = () => {
    const defaultValues = labels.map(() => [10, 15, 20, 25, 30])

    const newSerie = {
      name: `Serie ${series.length + 1}`,
      color: '#A855F7',
      borderColor: '#7C3AED',
      values: defaultValues
    }
    onSeriesChange([...series, newSerie])
  }

  // Entferne eine Serie
  const handleRemoveSeries = (index) => {
    onSeriesChange(series.filter((_, i) => i !== index))
  }

  // Aktualisiere Serie-Eigenschaften
  const handleSeriesPropertyChange = (seriesIndex, property, value) => {
    const newSeries = [...series]
    newSeries[seriesIndex] = {
      ...newSeries[seriesIndex],
      [property]: value
    }
    onSeriesChange(newSeries)
  }

  // Aktualisiere Werte-Array (komma-getrennte Eingabe)
  const handleValuesChange = (seriesIndex, labelIndex, value) => {
    const newSeries = [...series]
    
    // Parse comma-separated values
    const values = value
      .split(',')
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v))
    
    newSeries[seriesIndex] = {
      ...newSeries[seriesIndex],
      values: newSeries[seriesIndex].values.map((v, i) => 
        i === labelIndex ? values : v
      )
    }
    onSeriesChange(newSeries)
  }

  // Generiere Beispieldaten
  const handleGenerateData = (seriesIndex, labelIndex) => {
    const mean = 50
    const stdDev = 15
    const count = 20
    
    // Generiere normalverteilte Zufallsdaten
    const values = Array.from({ length: count }, () => {
      const u1 = Math.random()
      const u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      return Math.round(mean + stdDev * z)
    }).sort((a, b) => a - b)
    
    const newSeries = [...series]
    newSeries[seriesIndex].values[labelIndex] = values
    onSeriesChange(newSeries)
  }

  // Berechne Statistiken für Werte
  const getStats = (values) => {
    if (!values || values.length === 0) return null
    const sorted = [...values].sort((a, b) => a - b)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]
    
    return { min, max, mean: mean.toFixed(1), median, count: sorted.length }
  }

  return (
    <div className="space-y-4">
      {/* Header mit Hilfe */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-dark-textLight">
          Violin-Plot Daten
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
          <p className="font-medium mb-2">Violin-Plot Verteilungen:</p>
          <ul className="space-y-1 list-disc list-inside text-dark-textGray">
            <li>Jede Kategorie benötigt eine Liste von Datenpunkten</li>
            <li>Geben Sie Werte komma-getrennt ein (z.B. "10, 15, 20, 25, 30")</li>
            <li>Mehr Datenpunkte ergeben eine glattere Verteilungskurve (empfohlen: 15-30 Werte)</li>
            <li>Die "Violin"-Form zeigt die Dichte der Verteilung</li>
            <li>Verwenden Sie "Beispieldaten" für normalverteilte Zufallswerte</li>
          </ul>
        </div>
      )}

      {/* Kategorien */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-dark-textLight">
            Kategorien ({labels.length})
          </label>
          <button
            onClick={handleAddLabel}
            className="px-3 py-1 bg-dark-accent1 hover:bg-dark-accent2 text-white rounded text-sm flex items-center gap-1 transition-colors"
          >
            <FiPlus size={14} />
            Kategorie
          </button>
        </div>

        {labels.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {labels.map((label, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  placeholder="Kategorie"
                />
                <button
                  onClick={() => handleRemoveLabel(index)}
                  className="p-2 text-dark-textGray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  title="Entfernen"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Serien */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-dark-textLight">
            Datenreihen ({series.length})
          </label>
          <button
            onClick={handleAddSeries}
            disabled={labels.length === 0}
            className="px-3 py-1 bg-dark-accent1 hover:bg-dark-accent2 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm flex items-center gap-1 transition-colors"
            title={labels.length === 0 ? 'Fügen Sie zuerst Kategorien hinzu' : ''}
          >
            <FiPlus size={14} />
            Serie
          </button>
        </div>

        {series.length === 0 && labels.length > 0 && (
          <div className="text-center py-6 bg-dark-sidebar rounded-lg border border-gray-700">
            <FiAlertCircle className="mx-auto mb-2 text-dark-textGray" size={24} />
            <p className="text-dark-textGray text-sm">Keine Datenreihen vorhanden</p>
          </div>
        )}

        {series.map((serie, seriesIndex) => (
          <div
            key={seriesIndex}
            className="bg-dark-sidebar p-4 rounded-lg border border-gray-700 space-y-3"
          >
            {/* Serie Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={serie.name}
                  onChange={(e) => handleSeriesPropertyChange(seriesIndex, 'name', e.target.value)}
                  className="px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  placeholder="Serie Name"
                />
                <EnhancedColorPicker
                  value={serie.color}
                  onChange={(newColor) => handleSeriesPropertyChange(seriesIndex, 'color', newColor)}
                  label="Füllfarbe"
                  size="sm"
                />
                <EnhancedColorPicker
                  value={serie.borderColor}
                  onChange={(newColor) => handleSeriesPropertyChange(seriesIndex, 'borderColor', newColor)}
                  label="Randfarbe"
                  size="sm"
                />
              </div>
              <button
                onClick={() => handleRemoveSeries(seriesIndex)}
                className="p-2 text-dark-textGray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                title="Serie löschen"
              >
                <FiTrash2 size={16} />
              </button>
            </div>

            {/* Verteilungswerte */}
            <div className="space-y-2">
              {labels.map((label, labelIndex) => {
                const values = serie.values[labelIndex] || []
                const stats = getStats(values)

                return (
                  <div
                    key={labelIndex}
                    className="bg-dark-bg p-3 rounded border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-dark-textLight">{label}</span>
                      <button
                        onClick={() => handleGenerateData(seriesIndex, labelIndex)}
                        className="text-xs px-2 py-1 bg-dark-accent1/20 hover:bg-dark-accent1/30 text-dark-accent1 rounded"
                      >
                        Beispieldaten
                      </button>
                    </div>
                    
                    <textarea
                      value={values.join(', ')}
                      onChange={(e) => handleValuesChange(seriesIndex, labelIndex, e.target.value)}
                      placeholder="Werte komma-getrennt eingeben, z.B. 10, 15, 20, 25, 30"
                      rows={2}
                      className="w-full px-3 py-2 bg-dark-sidebar text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono resize-none"
                    />

                    {stats && (
                      <div className="mt-2 text-xs text-dark-textGray grid grid-cols-5 gap-2">
                        <div>
                          <span className="font-medium">Anzahl:</span> {stats.count}
                        </div>
                        <div>
                          <span className="font-medium">Min:</span> {stats.min}
                        </div>
                        <div>
                          <span className="font-medium">Mittel:</span> {stats.mean}
                        </div>
                        <div>
                          <span className="font-medium">Median:</span> {stats.median}
                        </div>
                        <div>
                          <span className="font-medium">Max:</span> {stats.max}
                        </div>
                      </div>
                    )}

                    {values.length < 5 && (
                      <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                        <FiAlertCircle size={12} />
                        Empfehlung: Mindestens 15-30 Werte für eine glatte Verteilung
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Leerer Zustand */}
      {labels.length === 0 && (
        <div className="text-center py-8 bg-dark-sidebar rounded-lg border border-gray-700">
          <FiAlertCircle className="mx-auto mb-2 text-dark-textGray" size={32} />
          <p className="text-dark-textGray mb-4">Fügen Sie zuerst Kategorien hinzu</p>
          <button
            onClick={handleAddLabel}
            className="px-4 py-2 bg-dark-accent1 hover:bg-dark-accent2 text-white rounded flex items-center gap-2 mx-auto transition-colors"
          >
            <FiPlus size={16} />
            Erste Kategorie hinzufügen
          </button>
        </div>
      )}
    </div>
  )
}

