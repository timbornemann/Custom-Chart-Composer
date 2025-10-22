export default function RangeBarEditor({ labels, datasets, onLabelsChange, onDatasetsChange }) {
  const addLabel = () => {
    onLabelsChange([...labels, `Task ${labels.length + 1}`])
    // Add data point to all datasets
    const updated = datasets.map(ds => ({
      ...ds,
      data: [...ds.data, [0, 10]]
    }))
    onDatasetsChange(updated)
  }

  const removeLabel = (index) => {
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

  const updateRange = (labelIndex, position, value) => {
    const updated = datasets.map(ds => {
      const newData = [...ds.data]
      const range = [...(newData[labelIndex] || [0, 10])]
      range[position] = Number(value) || 0
      newData[labelIndex] = range
      return { ...ds, data: newData }
    })
    onDatasetsChange(updated)
  }

  const dataset = datasets[0] || { label: 'Bereich', data: [], backgroundColor: '#3B82F6' }

  const updateDatasetColor = (color) => {
    const updated = [{
      ...dataset,
      backgroundColor: color,
      borderColor: color
    }]
    onDatasetsChange(updated)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-dark-textLight">
            Farbe
          </label>
          <input
            type="color"
            value={dataset.backgroundColor || '#3B82F6'}
            onChange={(e) => updateDatasetColor(e.target.value)}
            className="w-16 h-8 rounded border border-gray-700 cursor-pointer"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-dark-textLight">
            Bereiche
          </label>
          <button
            onClick={addLabel}
            className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
          >
            + Bereich
          </button>
        </div>
        <div className="space-y-2">
          {labels.map((label, idx) => {
            const range = dataset.data[idx] || [0, 10]
            return (
              <div key={idx} className="bg-dark-bg rounded-lg p-3 border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => updateLabel(idx, e.target.value)}
                    placeholder={`Task ${idx + 1}`}
                    className="flex-1 px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                  <button
                    onClick={() => removeLabel(idx)}
                    className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-dark-textGray mb-1 block">Start</label>
                    <input
                      type="number"
                      value={range[0]}
                      onChange={(e) => updateRange(idx, 0, e.target.value)}
                      className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-textGray mb-1 block">Ende</label>
                    <input
                      type="number"
                      value={range[1]}
                      onChange={(e) => updateRange(idx, 1, e.target.value)}
                      className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg p-3 rounded border border-gray-700">
        💡 Definiere Start- und Endwerte für jeden Bereich
      </div>
    </div>
  )
}

