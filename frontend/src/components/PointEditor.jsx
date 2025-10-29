import { useState } from 'react'

export default function PointEditor({ points, onPointsChange, isBubble = false }) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const addPoint = () => {
    const newPoint = isBubble 
      ? { x: 0, y: 0, r: 10 }
      : { x: 0, y: 0 }
    onPointsChange([...points, newPoint])
  }

  const removePoint = (index) => {
    onPointsChange(points.filter((_, i) => i !== index))
  }

  const updatePoint = (index, field, value) => {
    const updated = points.map((point, i) => {
      if (i === index) {
        return { ...point, [field]: Number(value) || 0 }
      }
      return point
    })
    onPointsChange(updated)
  }

  const movePoint = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    
    const newPoints = [...points]
    const [removed] = newPoints.splice(fromIndex, 1)
    newPoints.splice(toIndex, 0, removed)
    onPointsChange(newPoints)
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
      movePoint(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-dark-textLight">
          {isBubble ? 'Blasen (x, y, Größe)' : 'Punkte (x, y)'}
        </label>
        <button
          onClick={addPoint}
          className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-all"
        >
          + Punkt
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {points.map((point, idx) => (
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
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 text-dark-textGray cursor-grab active:cursor-grabbing">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">X</label>
                  <input
                    type="number"
                    value={point.x}
                    onChange={(e) => updatePoint(idx, 'x', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Y</label>
                  <input
                    type="number"
                    value={point.y}
                    onChange={(e) => updatePoint(idx, 'y', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
                {isBubble && (
                  <div>
                    <label className="text-xs text-dark-textGray mb-1 block">Größe</label>
                    <input
                      type="number"
                      value={point.r}
                      onChange={(e) => updatePoint(idx, 'r', e.target.value)}
                      className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => removePoint(idx)}
                className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all self-end"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {points.length === 0 && (
          <div className="text-center py-6 text-dark-textGray text-sm">
            Noch keine Punkte. Klicke auf "+ Punkt" um zu beginnen.
          </div>
        )}
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg rounded p-2">
        💡 {isBubble 
          ? 'X und Y bestimmen die Position, Größe den Radius der Blase' 
          : 'X und Y bestimmen die Position des Punktes im Koordinatensystem'}
      </div>
    </div>
  )
}

