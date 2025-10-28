import { useState } from 'react'

export default function RangeBarEditor({ labels, datasets, onLabelsChange, onDatasetsChange }) {
  const [expandedItem, setExpandedItem] = useState(0)
  
  const addDataPoint = () => {
    onLabelsChange([...labels, `Task ${labels.length + 1}`])
    // Add data point to all datasets
    const updated = datasets.map(ds => ({
      ...ds,
      data: [...ds.data, [0, 10]]
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

  const updateRange = (datasetIndex, pointIndex, position, value) => {
    const updated = datasets.map((ds, dsIdx) => {
      if (dsIdx === datasetIndex) {
        const newData = [...ds.data]
        const range = [...(newData[pointIndex] || [0, 10])]
        range[position] = Number(value) || 0
        newData[pointIndex] = range
        return { ...ds, data: newData }
      }
      return ds
    })
    onDatasetsChange(updated)
  }

  const addDataset = () => {
    const newDataset = {
      label: `Bereich ${datasets.length + 1}`,
      data: labels.map(() => [0, 10]),
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
                      className="flex-1 px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-medium"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={dataset.backgroundColor || '#3B82F6'}
                        onChange={(e) => updateDataset(dsIdx, 'backgroundColor', e.target.value)}
                        className="w-10 h-10 rounded border border-gray-700 cursor-pointer"
                      />
                      <button
                        onClick={() => setExpandedItem(expandedItem === dsIdx ? -1 : dsIdx)}
                        className="px-3 py-2 bg-dark-secondary hover:bg-gray-700 text-dark-textLight rounded transition-all"
                      >
                        {expandedItem === dsIdx ? '▼' : '▶'}
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

              {/* Expanded: Range Data */}
              {expandedItem === dsIdx && (
                <div className="px-3 pb-3 border-t border-gray-700">
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-dark-textGray">
                        Zeitbereiche ({labels.length})
                      </label>
                      <button
                        onClick={addDataPoint}
                        className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
                      >
                        + Zeitbereich
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {labels.map((label, labelIdx) => {
                        const range = dataset.data[labelIdx] || [0, 10]
                        return (
                          <div key={labelIdx} className="bg-dark-secondary rounded p-3 border border-gray-700/50">
                            <div className="flex items-start space-x-2">
                              <div className="flex-1 space-y-2">
                                <div>
                                  <label className="text-xs text-dark-textGray mb-1 block">Name</label>
                                  <input
                                    type="text"
                                    value={label}
                                    onChange={(e) => updateLabel(labelIdx, e.target.value)}
                                    placeholder={`Task ${labelIdx + 1}`}
                                    className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-medium"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-dark-textGray mb-1 block">Von</label>
                                    <input
                                      type="number"
                                      value={range[0]}
                                      onChange={(e) => updateRange(dsIdx, labelIdx, 0, e.target.value)}
                                      className="w-full px-2 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-dark-textGray mb-1 block">Bis</label>
                                    <input
                                      type="number"
                                      value={range[1]}
                                      onChange={(e) => updateRange(dsIdx, labelIdx, 1, e.target.value)}
                                      className="w-full px-2 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeDataPoint(labelIdx)}
                                className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all text-xs self-start mt-6"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {labels.length === 0 && (
                        <div className="text-center py-6 text-dark-textGray text-sm">
                          Noch keine Zeitbereiche. Klicke auf "+ Zeitbereich" um zu beginnen.
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
        💡 <strong>Bereichs-Balken:</strong> Jeder Datenpunkt hat einen Start- und Endwert (Von/Bis). 
        Perfekt für Zeitpläne, Gantt-Charts und Intervalle.
      </div>
    </div>
  )
}

function getRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
