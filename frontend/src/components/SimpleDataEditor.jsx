export default function SimpleDataEditor({ labels, values, onLabelsChange, onValuesChange }) {
  const addEntry = () => {
    onLabelsChange([...labels, `Label ${labels.length + 1}`])
    onValuesChange([...values, 0])
  }

  const removeEntry = (index) => {
    onLabelsChange(labels.filter((_, i) => i !== index))
    onValuesChange(values.filter((_, i) => i !== index))
  }

  const updateLabel = (index, value) => {
    const updated = [...labels]
    updated[index] = value
    onLabelsChange(updated)
  }

  const updateValue = (index, value) => {
    const updated = [...values]
    updated[index] = Number(value) || 0
    onValuesChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-dark-textLight">
          Daten
        </label>
        <button
          onClick={addEntry}
          className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
        >
          + Eintrag
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {labels.map((label, idx) => (
          <div key={idx} className="bg-dark-bg rounded-lg p-3 border border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Beschriftung</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => updateLabel(idx, e.target.value)}
                    placeholder={`Label ${idx + 1}`}
                    className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Wert</label>
                  <input
                    type="number"
                    value={values[idx] ?? 0}
                    onChange={(e) => updateValue(idx, e.target.value)}
                    className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => removeEntry(idx)}
                className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all self-end"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {labels.length === 0 && (
          <div className="text-center py-6 text-dark-textGray text-sm">
            Noch keine Einträge. Klicke auf "+ Eintrag" um zu beginnen.
          </div>
        )}
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg rounded p-2">
        💡 Füge beliebig viele Datenpunkte hinzu oder entferne sie
      </div>
    </div>
  )
}

