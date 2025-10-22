export default function ColorListEditor({ colors, onColorsChange }) {
  const addColor = () => {
    const defaultColors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ]
    const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)]
    onColorsChange([...(colors || []), randomColor])
  }

  const removeColor = (index) => {
    onColorsChange((colors || []).filter((_, i) => i !== index))
  }

  const updateColor = (index, value) => {
    const updated = [...(colors || [])]
    updated[index] = value
    onColorsChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-dark-textLight">
          Benutzerdefinierte Farben
        </label>
        <button
          onClick={addColor}
          className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-all"
        >
          + Farbe
        </button>
      </div>

      <div className="space-y-2">
        {(colors || []).map((color, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <input
              type="color"
              value={color}
              onChange={(e) => updateColor(idx, e.target.value)}
              className="w-12 h-10 rounded border border-gray-700 cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => updateColor(idx, e.target.value)}
              placeholder="#FF0000"
              className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
            />
            <button
              onClick={() => removeColor(idx)}
              className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all"
            >
              ✕
            </button>
          </div>
        ))}
        {(!colors || colors.length === 0) && (
          <div className="text-center py-4 text-dark-textGray text-xs">
            Keine benutzerdefinierten Farben. Klicke auf "+ Farbe" um eine hinzuzufügen.
          </div>
        )}
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg rounded p-2">
        💡 Verwende den Farbwähler oder gib Hex-Farben manuell ein
      </div>
    </div>
  )
}

