import { useState } from 'react'
import { FiPlus, FiTrash2, FiAlertCircle, FiBarChart2, FiTrendingUp } from 'react-icons/fi'

const CHART_TYPES = [
  { value: 'bar', label: 'Balken', icon: FiBarChart2 },
  { value: 'line', label: 'Linie', icon: FiTrendingUp }
]

export default function MixedChartEditor({ labels = [], datasets = [], onLabelsChange, onDatasetsChange }) {
  const [showHelper, setShowHelper] = useState(false)

  // Füge ein neues Label hinzu
  const handleAddLabel = () => {
    const newLabel = `Label ${labels.length + 1}`
    onLabelsChange([...labels, newLabel])
    
    // Füge für jedes Dataset einen neuen Wert hinzu
    const newDatasets = datasets.map(ds => ({
      ...ds,
      data: [...ds.data, 0]
    }))
    onDatasetsChange(newDatasets)
  }

  // Entferne ein Label
  const handleRemoveLabel = (index) => {
    onLabelsChange(labels.filter((_, i) => i !== index))
    
    // Entferne den entsprechenden Wert aus allen Datasets
    const newDatasets = datasets.map(ds => ({
      ...ds,
      data: ds.data.filter((_, i) => i !== index)
    }))
    onDatasetsChange(newDatasets)
  }

  // Ändere einen Label-Namen
  const handleLabelChange = (index, value) => {
    const newLabels = [...labels]
    newLabels[index] = value
    onLabelsChange(newLabels)
  }

  // Füge ein neues Dataset hinzu
  const handleAddDataset = () => {
    const defaultData = labels.map(() => 0)
    const isFirstBar = !datasets.some(ds => ds.type === 'bar')
    
    const newDataset = {
      type: isFirstBar ? 'bar' : 'line',
      label: `Dataset ${datasets.length + 1}`,
      data: defaultData,
      backgroundColor: isFirstBar ? '#3B82F6' : 'transparent',
      borderColor: isFirstBar ? '#3B82F6' : '#EF4444',
      borderWidth: isFirstBar ? 1 : 3
    }
    onDatasetsChange([...datasets, newDataset])
  }

  // Entferne ein Dataset
  const handleRemoveDataset = (index) => {
    onDatasetsChange(datasets.filter((_, i) => i !== index))
  }

  // Aktualisiere Dataset-Eigenschaft
  const handleDatasetPropertyChange = (datasetIndex, property, value) => {
    const newDatasets = [...datasets]
    newDatasets[datasetIndex] = {
      ...newDatasets[datasetIndex],
      [property]: value
    }
    onDatasetsChange(newDatasets)
  }

  // Ändere Dataset-Typ
  const handleTypeChange = (datasetIndex, newType) => {
    const newDatasets = [...datasets]
    const dataset = newDatasets[datasetIndex]
    
    // Passe die Standardwerte je nach Typ an
    if (newType === 'bar') {
      dataset.type = 'bar'
      dataset.backgroundColor = dataset.borderColor
      dataset.borderWidth = 1
    } else if (newType === 'line') {
      dataset.type = 'line'
      dataset.backgroundColor = 'transparent'
      dataset.borderWidth = 3
    }
    
    onDatasetsChange(newDatasets)
  }

  // Aktualisiere Datenwert
  const handleDataValueChange = (datasetIndex, valueIndex, value) => {
    const newDatasets = [...datasets]
    newDatasets[datasetIndex] = {
      ...newDatasets[datasetIndex],
      data: newDatasets[datasetIndex].data.map((v, i) => 
        i === valueIndex ? (parseFloat(value) || 0) : v
      )
    }
    onDatasetsChange(newDatasets)
  }

  // Komma-getrennte Werte parsen
  const handleDataBulkChange = (datasetIndex, value) => {
    const values = value
      .split(',')
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v))
    
    // Fülle fehlende Werte mit 0 auf
    while (values.length < labels.length) {
      values.push(0)
    }
    
    const newDatasets = [...datasets]
    newDatasets[datasetIndex] = {
      ...newDatasets[datasetIndex],
      data: values.slice(0, labels.length)
    }
    onDatasetsChange(newDatasets)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-dark-textLight">
          Kombiniertes Diagramm
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
          <p className="font-medium mb-2">Kombinierte Diagramme:</p>
          <ul className="space-y-1 list-disc list-inside text-dark-textGray">
            <li>Kombinieren Sie verschiedene Charttypen (Balken + Linien)</li>
            <li><strong>Balken:</strong> Ideal für kategoriale Daten und Vergleiche</li>
            <li><strong>Linien:</strong> Perfekt für Trends und Entwicklungen</li>
            <li>Jedes Dataset kann einen eigenen Typ haben</li>
            <li>Verwenden Sie unterschiedliche Farben für bessere Unterscheidbarkeit</li>
          </ul>
        </div>
      )}

      {/* Labels */}
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

      {/* Datasets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-dark-textLight">
            Datenreihen ({datasets.length})
          </label>
          <button
            onClick={handleAddDataset}
            disabled={labels.length === 0}
            className="px-3 py-1 bg-dark-accent1 hover:bg-dark-accent2 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm flex items-center gap-1 transition-colors"
            title={labels.length === 0 ? 'Fügen Sie zuerst Kategorien hinzu' : ''}
          >
            <FiPlus size={14} />
            Dataset
          </button>
        </div>

        {datasets.length === 0 && labels.length > 0 && (
          <div className="text-center py-6 bg-dark-sidebar rounded-lg border border-gray-700">
            <FiAlertCircle className="mx-auto mb-2 text-dark-textGray" size={24} />
            <p className="text-dark-textGray text-sm mb-3">Keine Datenreihen vorhanden</p>
            <button
              onClick={handleAddDataset}
              className="px-4 py-2 bg-dark-accent1 hover:bg-dark-accent2 text-white rounded flex items-center gap-2 mx-auto transition-colors"
            >
              <FiPlus size={16} />
              Erste Datenreihe hinzufügen
            </button>
          </div>
        )}

        {datasets.map((dataset, datasetIndex) => {
          const TypeIcon = CHART_TYPES.find(t => t.value === dataset.type)?.icon || FiBarChart2

          return (
            <div
              key={datasetIndex}
              className="bg-dark-sidebar p-4 rounded-lg border border-gray-700 space-y-3"
            >
              {/* Dataset Header */}
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {/* Name */}
                  <input
                    type="text"
                    value={dataset.label}
                    onChange={(e) => handleDatasetPropertyChange(datasetIndex, 'label', e.target.value)}
                    className="px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                    placeholder="Dataset Name"
                  />

                  {/* Typ */}
                  <div className="relative">
                    <select
                      value={dataset.type}
                      onChange={(e) => handleTypeChange(datasetIndex, e.target.value)}
                      className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm appearance-none cursor-pointer"
                    >
                      {CHART_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <TypeIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-textGray pointer-events-none" size={16} />
                  </div>

                  {/* Farbe */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-dark-textGray whitespace-nowrap">
                      {dataset.type === 'bar' ? 'Füllfarbe:' : 'Linienfarbe:'}
                    </label>
                    <input
                      type="color"
                      value={dataset.type === 'bar' ? dataset.backgroundColor : dataset.borderColor}
                      onChange={(e) => {
                        if (dataset.type === 'bar') {
                          handleDatasetPropertyChange(datasetIndex, 'backgroundColor', e.target.value)
                          handleDatasetPropertyChange(datasetIndex, 'borderColor', e.target.value)
                        } else {
                          handleDatasetPropertyChange(datasetIndex, 'borderColor', e.target.value)
                        }
                      }}
                      className="w-full h-9 bg-dark-bg rounded border border-gray-700 cursor-pointer"
                    />
                  </div>

                  {/* Linienbreite (nur für Linien) */}
                  {dataset.type === 'line' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-dark-textGray whitespace-nowrap">Breite:</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={dataset.borderWidth}
                        onChange={(e) => handleDatasetPropertyChange(datasetIndex, 'borderWidth', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveDataset(datasetIndex)}
                  className="ml-3 p-2 text-dark-textGray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  title="Dataset löschen"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>

              {/* Datenwerte - Kompakte Ansicht */}
              <div>
                <label className="text-xs text-dark-textGray mb-2 block">
                  Werte (komma-getrennt)
                </label>
                <textarea
                  value={dataset.data.join(', ')}
                  onChange={(e) => handleDataBulkChange(datasetIndex, e.target.value)}
                  placeholder="Werte eingeben, z.B. 10, 20, 30, 40"
                  rows={2}
                  className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono resize-none"
                />
              </div>

              {/* Einzelwerte Grid (optional aufklappbar) */}
              <details className="group">
                <summary className="text-xs text-dark-accent1 cursor-pointer hover:text-dark-accent2 select-none">
                  Einzelwerte bearbeiten ({labels.length})
                </summary>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {labels.map((label, valueIndex) => (
                    <div key={valueIndex}>
                      <label className="text-xs text-dark-textGray block mb-1 truncate" title={label}>
                        {label}
                      </label>
                      <input
                        type="number"
                        value={dataset.data[valueIndex] || 0}
                        onChange={(e) => handleDataValueChange(datasetIndex, valueIndex, e.target.value)}
                        className="w-full px-2 py-1 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )
        })}
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

      {/* Zusammenfassung */}
      {datasets.length > 0 && (
        <div className="text-xs text-dark-textGray bg-dark-bg rounded p-3 border border-gray-700">
          <strong>Zusammenfassung:</strong> {datasets.length} Datenreihe(n) mit {labels.length} Kategorie(n)
          {' • '}
          {datasets.filter(ds => ds.type === 'bar').length} Balken, {datasets.filter(ds => ds.type === 'line').length} Linien
        </div>
      )}
    </div>
  )
}

