export default function HeatmapEditor({ datasets, onDatasetsChange }) {
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

  return (
    <div className="space-y-4">
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
        💡 Füge Datenpunkte mit X-Position, Y-Position und Intensitätswert (0-100) hinzu
      </div>
    </div>
  )
}

