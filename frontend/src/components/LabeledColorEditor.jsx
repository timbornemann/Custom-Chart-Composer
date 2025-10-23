import PropTypes from 'prop-types'

export default function LabeledColorEditor({ labels, colors, onColorsChange, mode = 'single' }) {
  // Ensure we have enough colors for all labels
  const ensureColorCount = (newColors) => {
    if (!labels || labels.length === 0) return newColors
    
    const needed = labels.length
    const current = newColors.length
    
    if (current < needed) {
      // Add more colors using a default palette
      const defaultColors = [
        '#4ADE80', '#22D3EE', '#F472B6', '#FBBF24', '#A78BFA',
        '#EF4444', '#3B82F6', '#10B981', '#F97316', '#8B5CF6'
      ]
      const additional = []
      for (let i = current; i < needed; i++) {
        additional.push(defaultColors[i % defaultColors.length])
      }
      return [...newColors, ...additional]
    }
    
    return newColors
  }

  const handleColorChange = (index, newColor) => {
    const updatedColors = [...(colors || [])]
    updatedColors[index] = newColor
    onColorsChange(ensureColorCount(updatedColors))
  }

  const handleAddColor = () => {
    const defaultColor = '#3B82F6'
    onColorsChange([...(colors || []), defaultColor])
  }

  const handleRemoveColor = (index) => {
    const updatedColors = (colors || []).filter((_, i) => i !== index)
    onColorsChange(updatedColors)
  }

  // For datasets mode, we don't need labels
  if (mode === 'multiple' && (!labels || labels.length === 0)) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-dark-textLight">
            Farben
          </label>
          <button
            onClick={handleAddColor}
            className="text-xs px-3 py-1.5 bg-dark-accent1 hover:bg-opacity-90 text-white rounded-lg transition-all flex items-center space-x-1"
          >
            <span>+</span>
            <span>Farbe hinzufügen</span>
          </button>
        </div>
        
        <div className="space-y-2">
          {(colors || []).map((color, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 flex-1 bg-dark-bg rounded-lg p-3 border border-gray-700">
                <input
                  type="color"
                  value={color || '#3B82F6'}
                  onChange={(e) => handleColorChange(idx, e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-2 border-gray-600 hover:border-dark-accent1 transition-all"
                />
                <div className="flex-1">
                  <div className="text-sm text-dark-textLight font-medium">Farbe {idx + 1}</div>
                  <div className="text-xs text-dark-textGray font-mono">{color}</div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveColor(idx)}
                className="px-3 py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all"
                title="Farbe entfernen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {(!colors || colors.length === 0) && (
          <div className="text-xs text-dark-textGray bg-dark-bg rounded-lg p-4 text-center">
            Keine Farben definiert. Fügen Sie Farben hinzu.
          </div>
        )}
      </div>
    )
  }

  // Show labels from data if available
  if (!labels || labels.length === 0) {
    return (
      <div className="text-sm text-dark-textGray bg-dark-bg rounded-lg p-4">
        Fügen Sie zunächst Labels im Daten-Tab hinzu, um Farben zuzuweisen.
      </div>
    )
  }

  // Ensure we have enough colors
  const normalizedColors = ensureColorCount(colors || [])

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-dark-textLight">
        Farben zuweisen
      </label>
      
      <div className="space-y-2">
        {labels.map((label, idx) => (
          <div key={idx} className="flex items-center space-x-3 bg-dark-bg rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-all">
            <input
              type="color"
              value={normalizedColors[idx] || '#3B82F6'}
              onChange={(e) => handleColorChange(idx, e.target.value)}
              className="w-12 h-12 rounded cursor-pointer border-2 border-gray-600 hover:border-dark-accent1 transition-all"
            />
            <div className="flex-1">
              <div className="text-sm text-dark-textLight font-medium">{label}</div>
              <div className="text-xs text-dark-textGray font-mono">{normalizedColors[idx]}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg/50 rounded-lg p-3 flex items-start space-x-2">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Die Farben werden automatisch basierend auf Ihren Labels aus dem Daten-Tab zugewiesen.
        </span>
      </div>
    </div>
  )
}

LabeledColorEditor.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string),
  colors: PropTypes.arrayOf(PropTypes.string),
  onColorsChange: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['single', 'multiple'])
}

