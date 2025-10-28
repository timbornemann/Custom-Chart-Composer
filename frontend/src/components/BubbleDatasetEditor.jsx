import { useState } from 'react'

function getRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export default function BubbleDatasetEditor({ datasets, onDatasetsChange }) {
  const [expandedDataset, setExpandedDataset] = useState(0)

  const addDataset = () => {
    const newDataset = {
      label: `Dataset ${datasets.length + 1}`,
      data: [{ x: 0, y: 0, r: 10 }],
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

  const addBubblePoint = (datasetIndex) => {
    const dataset = datasets[datasetIndex]
    const updated = datasets.map((ds, i) => {
      if (i === datasetIndex) {
        return {
          ...ds,
          data: [...ds.data, { x: 0, y: 0, r: 10, label: `Punkt ${ds.data.length + 1}` }]
        }
      }
      return ds
    })
    onDatasetsChange(updated)
  }

  const removeBubblePoint = (datasetIndex, pointIndex) => {
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

  const updateBubblePoint = (datasetIndex, pointIndex, field, value) => {
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
                      <input
                        type="color"
                        value={dataset.backgroundColor || '#EC4899'}
                        onChange={(e) => updateDataset(dsIdx, 'backgroundColor', e.target.value)}
                        className="w-10 h-10 rounded border border-gray-700 cursor-pointer"
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
                        Blasen-Daten (x, y, Größe):
                      </div>
                      <button
                        onClick={() => addBubblePoint(dsIdx)}
                        className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-all"
                      >
                        + Blase
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {dataset.data.map((point, pointIdx) => (
                        <div key={pointIdx} className="bg-dark-secondary rounded p-3 border border-gray-700/50">
                          <div className="flex items-start space-x-2">
                            <div className="flex-1 space-y-2">
                              <div>
                                <label className="text-xs text-dark-textGray mb-1 block">Name</label>
                                <input
                                  type="text"
                                  value={point.label || `Punkt ${pointIdx + 1}`}
                                  onChange={(e) => updateBubblePoint(dsIdx, pointIdx, 'label', e.target.value)}
                                  placeholder={`Punkt ${pointIdx + 1}`}
                                  className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-medium"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs text-dark-textGray mb-1 block">X</label>
                                  <input
                                    type="number"
                                    value={point.x || 0}
                                    onChange={(e) => updateBubblePoint(dsIdx, pointIdx, 'x', e.target.value)}
                                    className="w-full px-2 py-1 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-dark-textGray mb-1 block">Y</label>
                                  <input
                                    type="number"
                                    value={point.y || 0}
                                    onChange={(e) => updateBubblePoint(dsIdx, pointIdx, 'y', e.target.value)}
                                    className="w-full px-2 py-1 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-dark-textGray mb-1 block">Größe</label>
                                  <input
                                    type="number"
                                    value={point.r || 10}
                                    onChange={(e) => updateBubblePoint(dsIdx, pointIdx, 'r', e.target.value)}
                                    className="w-full px-2 py-1 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeBubblePoint(dsIdx, pointIdx)}
                              className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all text-xs self-start mt-6"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      {dataset.data.length === 0 && (
                        <div className="text-center py-6 text-dark-textGray text-sm">
                          Noch keine Blasen. Klicke auf "+ Blase" um zu beginnen.
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

      <div className="text-xs text-dark-textGray bg-dark-bg rounded p-3">
        💡 <strong>Blasendiagramm:</strong> X und Y bestimmen die Position, Größe (r) den Radius der Blase. 
        Jeder Datensatz kann unterschiedlich viele Blasen haben. Klicke auf einen Datensatz und füge direkt dort neue Blasen hinzu.
      </div>
    </div>
  )
}

