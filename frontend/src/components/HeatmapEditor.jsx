import PropTypes from 'prop-types'

export default function HeatmapEditor({ labels, yLabels, datasets, onLabelsChange, onYLabelsChange, onDatasetsChange }) {
  const dataset = datasets[0] || { label: 'Aktivität', data: [] }

  const addPoint = () => {
    const newPoint = { x: 'Mo', y: '06:00', v: 50 }
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
      {/* X-Achsen Labels (z.B. Tage) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-dark-textLight">
            X-Achsen Labels (z.B. Tage)
          </label>
          <button
            onClick={addXLabel}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
          >
            + Label
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(labels || []).map((label, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-dark-bg rounded px-2 py-1 border border-gray-700">
              <input
                type="text"
                value={label}
                onChange={(e) => updateXLabel(idx, e.target.value)}
                className="w-16 px-2 py-1 bg-dark-secondary text-dark-textLight rounded border-0 focus:outline-none text-xs"
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

      {/* Y-Achsen Labels (z.B. Uhrzeiten) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-dark-textLight">
            Y-Achsen Labels (z.B. Uhrzeiten)
          </label>
          <button
            onClick={addYLabel}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
          >
            + Label
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(yLabels || []).map((label, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-dark-bg rounded px-2 py-1 border border-gray-700">
              <input
                type="text"
                value={label}
                onChange={(e) => updateYLabel(idx, e.target.value)}
                className="w-16 px-2 py-1 bg-dark-secondary text-dark-textLight rounded border-0 focus:outline-none text-xs"
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

      {/* Datenpunkte */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-dark-textLight">
            Datenpunkte
          </label>
          <button
            onClick={addPoint}
            className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
          >
            + Punkt
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {dataset.data.map((point, idx) => (
            <div key={idx} className="bg-dark-bg rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-dark-textGray">Punkt {idx + 1}</span>
                <button
                  onClick={() => removePoint(idx)}
                  className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">X (z.B. Mo)</label>
                  <input
                    type="text"
                    value={point.x}
                    onChange={(e) => updatePoint(idx, 'x', e.target.value)}
                    className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Y (z.B. 06:00)</label>
                  <input
                    type="text"
                    value={point.y}
                    onChange={(e) => updatePoint(idx, 'y', e.target.value)}
                    className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Wert (0-100)</label>
                  <input
                    type="number"
                    value={point.v}
                    onChange={(e) => updatePoint(idx, 'v', e.target.value)}
                    min="0"
                    max="100"
                    className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          {dataset.data.length === 0 && (
            <div className="text-center py-6 text-dark-textGray text-sm bg-dark-bg rounded border border-gray-700">
              Noch keine Datenpunkte. Klicke auf "+ Punkt" um zu beginnen.
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg p-3 rounded border border-gray-700">
        💡 Definiere zuerst die Achsen-Labels, dann füge Datenpunkte hinzu (X, Y und Intensität 0-100)
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

