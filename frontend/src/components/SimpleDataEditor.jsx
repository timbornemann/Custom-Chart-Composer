import { useState } from 'react'

export default function SimpleDataEditor({ labels, values, onLabelsChange, onValuesChange }) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

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

  const moveEntry = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    
    const newLabels = [...labels]
    const newValues = [...values]
    
    const [removedLabel] = newLabels.splice(fromIndex, 1)
    const [removedValue] = newValues.splice(fromIndex, 1)
    
    newLabels.splice(toIndex, 0, removedLabel)
    newValues.splice(toIndex, 0, removedValue)
    
    onLabelsChange(newLabels)
    onValuesChange(newValues)
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target)
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, index) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      moveEntry(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-dark-textLight">
          Datenpunkte ({labels.length})
        </label>
        <button
          onClick={addEntry}
          className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
        >
          + Datenpunkt
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {labels.map((label, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            className={`bg-dark-bg rounded-lg p-3 border border-gray-700 cursor-move transition-all ${
              draggedIndex === idx ? 'opacity-50' : ''
            } ${dragOverIndex === idx ? 'border-blue-500 border-2 shadow-lg' : ''}`}
          >
            <div className="flex items-start space-x-2">
              <div className="flex items-center justify-center w-6 h-6 mt-1 text-dark-textGray cursor-grab active:cursor-grabbing">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Beschriftung</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => updateLabel(idx, e.target.value)}
                    placeholder={`Label ${idx + 1}`}
                    className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Wert</label>
                  <input
                    type="number"
                    value={values[idx] ?? 0}
                    onChange={(e) => updateValue(idx, e.target.value)}
                    className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm font-semibold"
                  />
                </div>
              </div>
              <button
                onClick={() => removeEntry(idx)}
                className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all text-xs self-start"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {labels.length === 0 && (
          <div className="text-center py-6 text-dark-textGray text-sm bg-dark-secondary rounded border border-gray-700">
            Noch keine Datenpunkte. Klicke auf "+ Datenpunkt" um zu beginnen.
          </div>
        )}
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg rounded p-3 border border-gray-700">
        💡 <strong>Tipp:</strong> Jeder Datenpunkt hat eine Beschriftung (für die X-Achse) und einen Wert (für die Y-Achse).
      </div>
    </div>
  )
}

