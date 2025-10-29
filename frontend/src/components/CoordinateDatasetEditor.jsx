import { useState } from 'react'
import EnhancedColorPicker from './EnhancedColorPicker'

function getRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export default function CoordinateDatasetEditor({ datasets, onDatasetsChange }) {
  const [expandedDataset, setExpandedDataset] = useState(0)

  const addDataset = () => {
    const newDataset = {
      label: `Standorte ${datasets.length + 1}`,
      data: [{ longitude: 0, latitude: 0, label: "Punkt 1" }],
      backgroundColor: getRandomColor()
    }
    onDatasetsChange([...datasets, newDataset])
  }

  const removeDataset = (index) => {
    onDatasetsChange(datasets.filter((_, i) => i !== index))
  }

  const updateDataset = (index, field, value) => {
    const updated = datasets.map((ds, i) => {
      if (i === index) {
        return { ...ds, [field]: value }
      }
      return ds
    })
    onDatasetsChange(updated)
  }

  const addCoordinatePoint = (datasetIndex) => {
    const dataset = datasets[datasetIndex]
    const updated = datasets.map((ds, i) => {
      if (i === datasetIndex) {
        return {
          ...ds,
          data: [...ds.data, { longitude: 0, latitude: 0, label: `Punkt ${ds.data.length + 1}` }]
        }
      }
      return ds
    })
    onDatasetsChange(updated)
  }

  const removeCoordinatePoint = (datasetIndex, pointIndex) => {
    const updated = datasets.map((ds, i) => {
      if (i === datasetIndex) {
        return {
          ...ds,
          data: ds.data.filter((_, idx) => idx !== pointIndex)
        }
      }
      return ds
    })
    onDatasetsChange(updated)
  }

  const updateCoordinatePoint = (datasetIndex, pointIndex, field, value) => {
    const updated = datasets.map((ds, i) => {
      if (i === datasetIndex) {
        const newData = [...ds.data]
        newData[pointIndex] = {
          ...newData[pointIndex],
          [field]: field === 'label' ? value : (Number(value) || 0)
        }
        return { ...ds, data: newData }
      }
      return ds
    })
    onDatasetsChange(updated)
  }

  const validateCoordinate = (longitude, latitude) => {
    const errors = []
    if (longitude < -180 || longitude > 180) {
      errors.push('Longitude muss zwischen -180° und 180° liegen')
    }
    if (latitude < -90 || latitude > 90) {
      errors.push('Latitude muss zwischen -90° und 90° liegen')
    }
    return errors
  }

  return (
    <div className="space-y-4">
      {/* Datasets Management */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-dark-textLight">
            Datensätze
          </label>
          <button
            onClick={addDataset}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
          >
            + Datensatz
          </button>
        </div>
        <div className="space-y-3">
          {datasets.map((dataset, dsIdx) => (
            <div key={dsIdx} className="bg-dark-bg rounded-lg border border-gray-700">
              {/* Dataset Header */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={dataset.label}
                      onChange={(e) => updateDataset(dsIdx, 'label', e.target.value)}
                      placeholder="Datensatz-Name"
                      className="flex-1 px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-medium"
                    />
                    <div className="flex items-center space-x-2">
                      <EnhancedColorPicker
                        value={dataset.backgroundColor || '#3B82F6'}
                        onChange={(newColor) => updateDataset(dsIdx, 'backgroundColor', newColor)}
                        showLabel={false}
                        size="sm"
                      />
                      <button
                        onClick={() => setExpandedDataset(expandedDataset === dsIdx ? -1 : dsIdx)}
                        className="px-3 py-2 bg-dark-secondary hover:bg-gray-700 text-dark-textLight rounded transition-all"
                      >
                        {expandedDataset === dsIdx ? '▼' : '▶'}
                      </button>
                      <button
                        onClick={() => removeDataset(dsIdx)}
                        className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dataset Data Points (Expanded) */}
              {expandedDataset === dsIdx && (
                <div className="px-3 pb-3 border-t border-gray-700">
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-dark-textGray">
                        Koordinaten-Punkte (Dezimalgrad):
                      </div>
                      <button
                        onClick={() => addCoordinatePoint(dsIdx)}
                        className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
                      >
                        + Punkt
                      </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {dataset.data.map((point, pointIdx) => {
                        const validationErrors = validateCoordinate(point.longitude, point.latitude)
                        const hasErrors = validationErrors.length > 0

                        return (
                          <div key={pointIdx} className={`bg-dark-secondary rounded p-3 border ${hasErrors ? 'border-red-500/50' : 'border-gray-700/50'}`}>
                            <div className="flex items-start space-x-2">
                              <div className="flex-1 space-y-2">
                                <div>
                                  <label className="text-xs text-dark-textGray mb-1 block">Name/Beschreibung</label>
                                  <input
                                    type="text"
                                    value={point.label || `Punkt ${pointIdx + 1}`}
                                    onChange={(e) => updateCoordinatePoint(dsIdx, pointIdx, 'label', e.target.value)}
                                    placeholder={`Punkt ${pointIdx + 1}`}
                                    className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-medium"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-dark-textGray mb-1 block">
                                      Longitude (°)
                                      <span className="text-dark-textGray/60 ml-1">[-180 bis 180]</span>
                                    </label>
                                    <input
                                      type="number"
                                      step="0.0001"
                                      value={point.longitude || 0}
                                      onChange={(e) => updateCoordinatePoint(dsIdx, pointIdx, 'longitude', e.target.value)}
                                      className={`w-full px-2 py-1 bg-dark-bg text-dark-textLight rounded border ${
                                        point.longitude < -180 || point.longitude > 180
                                          ? 'border-red-500 focus:border-red-500'
                                          : 'border-gray-700 focus:border-blue-500'
                                      } focus:outline-none text-sm font-mono`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-dark-textGray mb-1 block">
                                      Latitude (°)
                                      <span className="text-dark-textGray/60 ml-1">[-90 bis 90]</span>
                                    </label>
                                    <input
                                      type="number"
                                      step="0.0001"
                                      value={point.latitude || 0}
                                      onChange={(e) => updateCoordinatePoint(dsIdx, pointIdx, 'latitude', e.target.value)}
                                      className={`w-full px-2 py-1 bg-dark-bg text-dark-textLight rounded border ${
                                        point.latitude < -90 || point.latitude > 90
                                          ? 'border-red-500 focus:border-red-500'
                                          : 'border-gray-700 focus:border-blue-500'
                                      } focus:outline-none text-sm font-mono`}
                                    />
                                  </div>
                                </div>
                                {hasErrors && (
                                  <div className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1 mt-1">
                                    {validationErrors.join(', ')}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => removeCoordinatePoint(dsIdx, pointIdx)}
                                className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all text-xs self-start mt-6"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {dataset.data.length === 0 && (
                        <div className="text-center py-6 text-dark-textGray text-sm">
                          Noch keine Punkte. Klicke auf "+ Punkt" um zu beginnen.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg rounded p-3 border border-gray-700">
        <div className="font-semibold mb-2 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Koordinatendiagramm
        </div>
        <ul className="space-y-1 ml-5">
          <li>• <strong>Longitude</strong> (Längengrad): -180° bis 180° (West nach Ost)</li>
          <li>• <strong>Latitude</strong> (Breitengrad): -90° bis 90° (Süd nach Nord)</li>
          <li>• Punkte werden proportional und akkurat im Koordinatensystem dargestellt</li>
          <li>• Dezimalgrad-Format: z.B. Berlin = 13.4050° Longitude, 52.5200° Latitude</li>
        </ul>
      </div>
    </div>
  )
}

