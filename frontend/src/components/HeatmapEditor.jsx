import { useState } from 'react'
import PropTypes from 'prop-types'

export default function HeatmapEditor({ labels, yLabels, datasets, onLabelsChange, onYLabelsChange, onDatasetsChange }) {
  const [showAxisEditor, setShowAxisEditor] = useState(false)
  const dataset = datasets[0] || { label: 'Aktivität', data: [] }

  const addPoint = () => {
    const defaultX = (labels && labels.length > 0) ? labels[0] : 'Mo'
    const defaultY = (yLabels && yLabels.length > 0) ? yLabels[0] : '06:00'
    const newPoint = { x: defaultX, y: defaultY, v: 50, label: `Datenpunkt ${dataset.data.length + 1}` }
    const updated = [{
      ...dataset,
      data: [...dataset.data, newPoint]
    }]
    onDatasetsChange(updated)
  }

  const removePoint = (index) => {
    const updated = [{
      ...dataset,
      data: dataset.data.filter((_, i) => i !== index)
    }]
    onDatasetsChange(updated)
  }

  const updatePoint = (index, field, value) => {
    const updated = [{
      ...dataset,
      data: dataset.data.map((point, i) => {
        if (i === index) {
          return {
            ...point,
            [field]: field === 'v' ? (Number(value) || 0) : value
          }
        }
        return point
      })
    }]
    onDatasetsChange(updated)
  }

  const addXLabel = () => {
    onLabelsChange([...(labels || []), 'Neu'])
  }

  const removeXLabel = (index) => {
    onLabelsChange((labels || []).filter((_, i) => i !== index))
  }

  const updateXLabel = (index, value) => {
    onLabelsChange((labels || []).map((label, i) => i === index ? value : label))
  }

  const addYLabel = () => {
    onYLabelsChange([...(yLabels || []), '00:00'])
  }

  const removeYLabel = (index) => {
    onYLabelsChange((yLabels || []).filter((_, i) => i !== index))
  }

  const updateYLabel = (index, value) => {
    onYLabelsChange((yLabels || []).map((label, i) => i === index ? value : label))
  }

  return (
    <div className="space-y-4">
      {/* Axis Labels Configuration (Collapsible) */}
      <div className="bg-dark-bg rounded-lg border border-gray-700">
        <div className="p-3">
          <button
            onClick={() => setShowAxisEditor(!showAxisEditor)}
            className="w-full flex items-center justify-between text-sm font-medium text-dark-textLight hover:text-blue-400 transition-colors"
          >
            <span>⚙️ Achsen-Beschriftungen konfigurieren</span>
            <span>{showAxisEditor ? '▼' : '▶'}</span>
          </button>
        </div>
        
        {showAxisEditor && (
          <div className="px-3 pb-3 border-t border-gray-700 space-y-3 pt-3">
            {/* X-Axis Labels */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-dark-textGray">
                  X-Achse (Spalten)
                </label>
                <button
                  onClick={addXLabel}
                  className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
                >
                  + Spalte
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(labels || []).map((label, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-dark-secondary rounded px-2 py-1 border border-gray-700">
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => updateXLabel(idx, e.target.value)}
                      className="w-16 px-2 py-1 bg-dark-bg text-dark-textLight rounded border-0 focus:outline-none text-xs"
                    />
                    <button
                      onClick={() => removeXLabel(idx)}
                      className="px-1 text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Y-Axis Labels */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-dark-textGray">
                  Y-Achse (Zeilen)
                </label>
                <button
                  onClick={addYLabel}
                  className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
                >
                  + Zeile
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(yLabels || []).map((label, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-dark-secondary rounded px-2 py-1 border border-gray-700">
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => updateYLabel(idx, e.target.value)}
                      className="w-16 px-2 py-1 bg-dark-bg text-dark-textLight rounded border-0 focus:outline-none text-xs"
                    />
                    <button
                      onClick={() => removeYLabel(idx)}
                      className="px-1 text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Datenpunkte */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-dark-textLight">
            Datenpunkte ({dataset.data.length})
          </label>
          <button
            onClick={addPoint}
            className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-all"
          >
            + Datenpunkt
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {dataset.data.map((point, idx) => (
            <div key={idx} className="bg-dark-bg rounded-lg p-3 border border-gray-700">
              <div className="flex items-start space-x-2">
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-xs text-dark-textGray mb-1 block">Name (optional)</label>
                    <input
                      type="text"
                      value={point.label || ''}
                      onChange={(e) => updatePoint(idx, 'label', e.target.value)}
                      placeholder={`Datenpunkt ${idx + 1}`}
                      className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-dark-textGray mb-1 block">X-Position</label>
                      <input
                        type="text"
                        value={point.x}
                        onChange={(e) => updatePoint(idx, 'x', e.target.value)}
                        placeholder="z.B. Mo"
                        className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-dark-textGray mb-1 block">Y-Position</label>
                      <input
                        type="text"
                        value={point.y}
                        onChange={(e) => updatePoint(idx, 'y', e.target.value)}
                        placeholder="z.B. 12:00"
                        className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-dark-textGray mb-1 block">Intensität (0-100)</label>
                      <input
                        type="number"
                        value={point.v}
                        onChange={(e) => updatePoint(idx, 'v', e.target.value)}
                        min="0"
                        max="100"
                        className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removePoint(idx)}
                  className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all text-xs self-start mt-6"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {dataset.data.length === 0 && (
            <div className="text-center py-6 text-dark-textGray text-sm bg-dark-secondary rounded border border-gray-700">
              Noch keine Datenpunkte. Klicke auf "+ Datenpunkt" um zu beginnen.
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg p-3 rounded border border-gray-700">
        💡 <strong>Heatmap:</strong> Definiere erst die Achsen-Beschriftungen (X und Y), dann füge Datenpunkte hinzu. 
        Jeder Punkt hat eine Position (X, Y) und eine Intensität (0-100) für die Farbstärke.
      </div>
    </div>
  )
}

HeatmapEditor.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string),
  yLabels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  onLabelsChange: PropTypes.func.isRequired,
  onYLabelsChange: PropTypes.func.isRequired,
  onDatasetsChange: PropTypes.func.isRequired
}
