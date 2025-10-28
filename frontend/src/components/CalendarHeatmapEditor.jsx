import { useState } from 'react'
import PropTypes from 'prop-types'

function getRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export default function CalendarHeatmapEditor({ datasets, onDatasetsChange }) {
  const [expandedDataset, setExpandedDataset] = useState(0)
  const dataset = datasets[0] || { label: 'Aktivität', data: [], backgroundColor: '#3B82F6' }

  const addDataset = () => {
    const newDataset = {
      label: `Aktivität ${datasets.length + 1}`,
      data: [{ x: 0, y: 0, v: 50, label: 'Tag 1' }],
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

  const addPoint = (datasetIndex) => {
    const updated = datasets.map((ds, i) => {
      if (i === datasetIndex) {
        return {
          ...ds,
          data: [...ds.data, { x: 0, y: 0, v: 50, label: `Tag ${ds.data.length + 1}` }]
        }
      }
      return ds
    })
    onDatasetsChange(updated)
  }

  const removePoint = (datasetIndex, pointIndex) => {
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

  const updatePoint = (datasetIndex, pointIndex, field, value) => {
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
          {datasets.map((ds, dsIdx) => (
            <div key={dsIdx} className="bg-dark-bg rounded-lg border border-gray-700">
              {/* Dataset Header */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={ds.label}
                      onChange={(e) => updateDataset(dsIdx, 'label', e.target.value)}
                      placeholder="Datensatz-Name"
                      className="flex-1 px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-medium"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={ds.backgroundColor || '#3B82F6'}
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

              {/* Expanded: Calendar Data */}
              {expandedDataset === dsIdx && (
                <div className="px-3 pb-3 border-t border-gray-700">
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-dark-textGray">
                        Kalender-Tage ({ds.data.length})
                      </div>
                      <button
                        onClick={() => addPoint(dsIdx)}
                        className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
                      >
                        + Tag
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {ds.data.map((point, pointIdx) => (
                        <div key={pointIdx} className="bg-dark-secondary rounded p-3 border border-gray-700/50">
                          <div className="flex items-start space-x-2">
                            <div className="flex-1 space-y-2">
                              <div>
                                <label className="text-xs text-dark-textGray mb-1 block">Name</label>
                                <input
                                  type="text"
                                  value={point.label || `Tag ${pointIdx + 1}`}
                                  onChange={(e) => updatePoint(dsIdx, pointIdx, 'label', e.target.value)}
                                  placeholder={`Tag ${pointIdx + 1}`}
                                  className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-medium"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs text-dark-textGray mb-1 block">Woche (X)</label>
                                  <input
                                    type="number"
                                    value={point.x || 0}
                                    onChange={(e) => updatePoint(dsIdx, pointIdx, 'x', e.target.value)}
                                    className="w-full px-2 py-1 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-dark-textGray mb-1 block">Wochentag (Y)</label>
                                  <input
                                    type="number"
                                    value={point.y || 0}
                                    onChange={(e) => updatePoint(dsIdx, pointIdx, 'y', e.target.value)}
                                    className="w-full px-2 py-1 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-dark-textGray mb-1 block">Aktivität (0-100)</label>
                                  <input
                                    type="number"
                                    value={point.v || 0}
                                    onChange={(e) => updatePoint(dsIdx, pointIdx, 'v', e.target.value)}
                                    min="0"
                                    max="100"
                                    className="w-full px-2 py-1 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-semibold"
                                  />
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removePoint(dsIdx, pointIdx)}
                              className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all text-xs self-start mt-6"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      {ds.data.length === 0 && (
                        <div className="text-center py-6 text-dark-textGray text-sm">
                          Noch keine Tage. Klicke auf "+ Tag" um zu beginnen.
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
        💡 <strong>Kalender-Heatmap:</strong> X = Woche (0-52), Y = Wochentag (0-6), V = Aktivitätswert (0-100). 
        Jeder Tag kann benannt werden und zeigt beim Hover den Namen an.
      </div>
    </div>
  )
}

CalendarHeatmapEditor.propTypes = {
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDatasetsChange: PropTypes.func.isRequired
}

