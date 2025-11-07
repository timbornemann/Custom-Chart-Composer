import { useState } from 'react'
import { FiPlus, FiTrash2, FiAlertCircle } from 'react-icons/fi'

export default function BoxPlotEditor({ labels = [], series = [], onLabelsChange, onSeriesChange }) {
  const [showHelper, setShowHelper] = useState(false)

  // Füge neue Kategorie hinzu
  const handleAddLabel = () => {
    onLabelsChange([...labels, `Kategorie ${labels.length + 1}`])
    
    // Füge für jede Serie einen neuen Wert hinzu
    const newSeries = series.map(s => ({
      ...s,
      values: [...s.values, { min: 0, q1: 25, median: 50, q3: 75, max: 100 }]
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
    const defaultValues = labels.map(() => ({
      min: 0,
      q1: 25,
      median: 50,
      q3: 75,
      max: 100
    }))

    const newSerie = {
      name: `Serie ${series.length + 1}`,
      color: '#60A5FA',
      borderColor: '#1D4ED8',
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

  // Aktualisiere Quartilwerte
  const handleQuartileChange = (seriesIndex, labelIndex, quartile, value) => {
    const newSeries = [...series]
    const numValue = parseFloat(value) || 0
    
    newSeries[seriesIndex] = {
      ...newSeries[seriesIndex],
      values: newSeries[seriesIndex].values.map((v, i) => 
        i === labelIndex ? { ...v, [quartile]: numValue } : v
      )
    }
    onSeriesChange(newSeries)
  }

  // Auto-korrigiere Quartilwerte (min <= q1 <= median <= q3 <= max)
  const handleAutoCorrect = (seriesIndex, labelIndex) => {
    const newSeries = [...series]
    const values = newSeries[seriesIndex].values[labelIndex]
    
    // Sortiere die Werte
    const sorted = [values.min, values.q1, values.median, values.q3, values.max].sort((a, b) => a - b)
    
    newSeries[seriesIndex].values[labelIndex] = {
      min: sorted[0],
      q1: sorted[1],
      median: sorted[2],
      q3: sorted[3],
      max: sorted[4]
    }
    
    onSeriesChange(newSeries)
  }

  // Prüfe ob Quartilwerte korrekt sind
  const isValidQuartiles = (values) => {
    return values.min <= values.q1 && 
           values.q1 <= values.median && 
           values.median <= values.q3 && 
           values.q3 <= values.max
  }

  return (
    <div className="space-y-4">
      {/* Header mit Hilfe */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-dark-textLight">
          Boxplot Daten
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
          <p className="font-medium mb-2">Boxplot Quartilwerte:</p>
          <ul className="space-y-1 list-disc list-inside text-dark-textGray">
            <li><strong>Min:</strong> Kleinster Wert (unteres Whisker)</li>
            <li><strong>Q1:</strong> Erstes Quartil (25% der Daten liegen darunter)</li>
            <li><strong>Median:</strong> Zweites Quartil (50%, mittlere Linie in der Box)</li>
            <li><strong>Q3:</strong> Drittes Quartil (75% der Daten liegen darunter)</li>
            <li><strong>Max:</strong> Größter Wert (oberes Whisker)</li>
            <li className="mt-2">Die Werte müssen aufsteigend sein: Min ≤ Q1 ≤ Median ≤ Q3 ≤ Max</li>
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
                  className="flex-1 px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
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
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={serie.name}
                  onChange={(e) => handleSeriesPropertyChange(seriesIndex, 'name', e.target.value)}
                  className="px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  placeholder="Serie Name"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dark-textGray">Farbe:</label>
                  <input
                    type="color"
                    value={serie.color}
                    onChange={(e) => handleSeriesPropertyChange(seriesIndex, 'color', e.target.value)}
                    className="w-full h-9 bg-dark-bg rounded border border-gray-700 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dark-textGray">Rahmen:</label>
                  <input
                    type="color"
                    value={serie.borderColor}
                    onChange={(e) => handleSeriesPropertyChange(seriesIndex, 'borderColor', e.target.value)}
                    className="w-full h-9 bg-dark-bg rounded border border-gray-700 cursor-pointer"
                  />
                </div>
              </div>
              <button
                onClick={() => handleRemoveSeries(seriesIndex)}
                className="ml-3 p-2 text-dark-textGray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                title="Serie löschen"
              >
                <FiTrash2 size={16} />
              </button>
            </div>

            {/* Quartilwerte */}
            <div className="space-y-2">
              {labels.map((label, labelIndex) => {
                const values = serie.values[labelIndex] || { min: 0, q1: 25, median: 50, q3: 75, max: 100 }
                const isValid = isValidQuartiles(values)

                return (
                  <div
                    key={labelIndex}
                    className={`bg-dark-bg p-3 rounded border ${
                      isValid ? 'border-gray-700' : 'border-red-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-dark-textLight">{label}</span>
                      {!isValid && (
                        <button
                          onClick={() => handleAutoCorrect(seriesIndex, labelIndex)}
                          className="text-xs px-2 py-1 bg-dark-accent1 hover:bg-dark-accent2 text-white rounded"
                        >
                          Auto-Korrektur
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <label className="text-xs text-dark-textGray block mb-1">Min</label>
                        <input
                          type="number"
                          value={values.min}
                          onChange={(e) => handleQuartileChange(seriesIndex, labelIndex, 'min', e.target.value)}
                          className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-dark-textGray block mb-1">Q1</label>
                        <input
                          type="number"
                          value={values.q1}
                          onChange={(e) => handleQuartileChange(seriesIndex, labelIndex, 'q1', e.target.value)}
                          className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-dark-textGray block mb-1">Median</label>
                        <input
                          type="number"
                          value={values.median}
                          onChange={(e) => handleQuartileChange(seriesIndex, labelIndex, 'median', e.target.value)}
                          className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-dark-textGray block mb-1">Q3</label>
                        <input
                          type="number"
                          value={values.q3}
                          onChange={(e) => handleQuartileChange(seriesIndex, labelIndex, 'q3', e.target.value)}
                          className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-dark-textGray block mb-1">Max</label>
                        <input
                          type="number"
                          value={values.max}
                          onChange={(e) => handleQuartileChange(seriesIndex, labelIndex, 'max', e.target.value)}
                          className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                        />
                      </div>
                    </div>

                    {!isValid && (
                      <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <FiAlertCircle size={12} />
                        Werte müssen aufsteigend sein: Min ≤ Q1 ≤ Median ≤ Q3 ≤ Max
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

