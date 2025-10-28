import { useState } from 'react'

export default function DatasetEditor({ datasets, labels, onDatasetsChange, onLabelsChange }) {
  const [expandedDataset, setExpandedDataset] = useState(0)

  const addDataset = () => {
    const newDataset = {
      label: `Serie ${datasets.length + 1}`,
      data: labels.map(() => 0),
      backgroundColor: getRandomColor(),
      borderColor: getRandomColor()
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

  const updateDataPoint = (datasetIndex, pointIndex, value) => {
    const updated = datasets.map((ds, i) => {
      if (i === datasetIndex) {
        const newData = [...ds.data]
        newData[pointIndex] = Number(value) || 0
        return { ...ds, data: newData }
      }
      return ds
    })
    onDatasetsChange(updated)
  }

  const addDataPoint = () => {
    onLabelsChange([...labels, `Label ${labels.length + 1}`])
    // Add data point to all datasets
    const updated = datasets.map(ds => ({
      ...ds,
      data: [...ds.data, 0]
    }))
    onDatasetsChange(updated)
  }

  const removeDataPoint = (index) => {
    onLabelsChange(labels.filter((_, i) => i !== index))
    // Remove data point from all datasets
    const updated = datasets.map(ds => ({
      ...ds,
      data: ds.data.filter((_, i) => i !== index)
    }))
    onDatasetsChange(updated)
  }

  const updateLabel = (index, value) => {
    const updated = [...labels]
    updated[index] = value
    onLabelsChange(updated)
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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={dataset.label}
                      onChange={(e) => updateDataset(dsIdx, 'label', e.target.value)}
                      placeholder="Datensatz-Name"
                      className="flex-1 px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-medium"
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
                
                {/* Compact Styling Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-dark-textGray mb-1 block">Füllfarbe</label>
                    <input
                      type="color"
                      value={dataset.backgroundColor || '#3B82F6'}
                      onChange={(e) => updateDataset(dsIdx, 'backgroundColor', e.target.value)}
                      className="w-full h-10 rounded border border-gray-700 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-textGray mb-1 block">Randfarbe</label>
                    <input
                      type="color"
                      value={dataset.borderColor || dataset.backgroundColor || '#3B82F6'}
                      onChange={(e) => updateDataset(dsIdx, 'borderColor', e.target.value)}
                      className="w-full h-10 rounded border border-gray-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Expanded: Data Points and Styling */}
              {expandedDataset === dsIdx && (
                <div className="px-3 pb-3 border-t border-gray-700">
                  {/* Line/Bar Style Controls */}
                  <div className="mt-3 mb-3 grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-dark-textGray mb-1 block">Linienstil</label>
                      <select
                        value={Array.isArray(dataset.borderDash) && dataset.borderDash.length > 0 ? 'dashed' : 'solid'}
                        onChange={(e) => {
                          if (e.target.value === 'dashed') {
                            updateDataset(dsIdx, 'borderDash', [5, 5])
                          } else {
                            updateDataset(dsIdx, 'borderDash', [])
                          }
                        }}
                        className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                      >
                        <option value="solid">Durchgezogen</option>
                        <option value="dashed">Gestrichelt</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-dark-textGray mb-1 block">Linienbreite</label>
                      <input
                        type="number"
                        value={dataset.borderWidth || 2}
                        onChange={(e) => updateDataset(dsIdx, 'borderWidth', Number(e.target.value))}
                        min="1"
                        max="10"
                        className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-dark-textGray mb-1 block">Glättung</label>
                      <input
                        type="number"
                        value={dataset.tension !== undefined ? dataset.tension : 0}
                        onChange={(e) => updateDataset(dsIdx, 'tension', Number(e.target.value))}
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* Data Points */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-dark-textGray">
                        Datenpunkte ({dataset.data.length})
                      </label>
                      <button
                        onClick={addDataPoint}
                        className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
                      >
                        + Datenpunkt
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                      {dataset.data.map((value, pointIdx) => (
                        <div key={pointIdx} className="bg-dark-secondary rounded p-2 border border-gray-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <input
                              type="text"
                              value={labels[pointIdx] || `Label ${pointIdx + 1}`}
                              onChange={(e) => updateLabel(pointIdx, e.target.value)}
                              placeholder={`Label ${pointIdx + 1}`}
                              className="flex-1 px-2 py-1 bg-dark-bg text-dark-textLight rounded border-0 focus:outline-none text-xs font-medium"
                            />
                            <button
                              onClick={() => removeDataPoint(pointIdx)}
                              className="px-1 text-red-400 hover:text-red-300 text-xs ml-1"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => updateDataPoint(dsIdx, pointIdx, e.target.value)}
                            className="w-full px-2 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-semibold"
                          />
                        </div>
                      ))}
                      {dataset.data.length === 0 && (
                        <div className="col-span-2 text-center py-6 text-dark-textGray text-sm">
                          Noch keine Datenpunkte. Klicke auf "+ Datenpunkt" um zu beginnen.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {datasets.length === 0 && (
            <div className="text-center py-6 text-dark-textGray text-sm">
              Noch keine Datensätze. Klicke auf "+ Datensatz" um zu beginnen.
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg rounded p-3 border border-gray-700">
        💡 <strong>Tipp:</strong> Klicke auf einen Datensatz (▶) um Details zu sehen. 
        Datenpunkte werden automatisch auf alle Datensätze angewendet, so dass alle die gleichen X-Achsen-Werte haben.
      </div>
    </div>
  )
}

function getRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
