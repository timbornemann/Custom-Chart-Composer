export default function DatasetEditor({ datasets, labels, onDatasetsChange, onLabelsChange }) {
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

  const addLabel = () => {
    onLabelsChange([...labels, `Label ${labels.length + 1}`])
    // Add data point to all datasets
    const updated = datasets.map(ds => ({
      ...ds,
      data: [...ds.data, 0]
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

  return (
    <div className="space-y-4">
      {/* Labels Management */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-dark-textLight">
            Beschriftungen (X-Achse)
          </label>
          <button
            onClick={addLabel}
            className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
          >
            + Label
          </button>
        </div>
        <div className="space-y-2">
          {labels.map((label, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <input
                type="text"
                value={label}
                onChange={(e) => updateLabel(idx, e.target.value)}
                placeholder={`Label ${idx + 1}`}
                className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
              />
              <button
                onClick={() => removeLabel(idx)}
                className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

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
            <div key={dsIdx} className="bg-dark-bg rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={dataset.label}
                  onChange={(e) => updateDataset(dsIdx, 'label', e.target.value)}
                  placeholder="Datensatz-Name"
                  className="flex-1 px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-medium"
                />
                <div className="flex items-center space-x-2 ml-3">
                  <input
                    type="color"
                    value={dataset.backgroundColor}
                    onChange={(e) => updateDataset(dsIdx, 'backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded border border-gray-700 cursor-pointer"
                  />
                  <button
                    onClick={() => removeDataset(dsIdx)}
                    className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {dataset.data.map((value, pointIdx) => (
                  <div key={pointIdx} className="flex flex-col">
                    <label className="text-xs text-dark-textGray mb-1">{labels[pointIdx]}</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => updateDataPoint(dsIdx, pointIdx, e.target.value)}
                      className="px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {datasets.length === 0 && (
            <div className="text-center py-6 text-dark-textGray text-sm">
              Noch keine Datensätze. Klicke auf "+ Datensatz" um zu beginnen.
            </div>
          )}
        </div>
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

