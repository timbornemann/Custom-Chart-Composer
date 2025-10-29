import { useState } from 'react'
import PropTypes from 'prop-types'

export default function LabeledColorEditor({ labels, colors, onColorsChange, mode = 'single' }) {
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [showColorPicker, setShowColorPicker] = useState(null)
  
  // Predefined color palettes
  const colorPresets = [
    // Standard colors
    { name: 'Hellblau', value: '#3B82F6' },
    { name: 'Grün', value: '#10B981' },
    { name: 'Rot', value: '#EF4444' },
    { name: 'Gelb', value: '#FBBF24' },
    { name: 'Lila', value: '#8B5CF6' },
    { name: 'Rosa', value: '#F472B6' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Türkis', value: '#06B6D4' },
    // Darker shades
    { name: 'Dunkelblau', value: '#1E40AF' },
    { name: 'Dunkelgrün', value: '#047857' },
    { name: 'Dunkelrot', value: '#B91C1C' },
    { name: 'Dunkellila', value: '#5B21B6' },
    // Pastel colors
    { name: 'Pastellblau', value: '#93C5FD' },
    { name: 'Pastellgrün', value: '#86EFAC' },
    { name: 'Pastellrosa', value: '#FBCFE8' },
    { name: 'Pastellgelb', value: '#FDE68A' },
    // Grayscale
    { name: 'Weiß', value: '#FFFFFF' },
    { name: 'Hellgrau', value: '#E5E7EB' },
    { name: 'Grau', value: '#9CA3AF' },
    { name: 'Dunkelgrau', value: '#4B5563' },
    { name: 'Schwarz', value: '#000000' }
  ]
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
    setShowColorPicker(null)
  }

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  const rgbToHex = (r, g, b) => {
    return "#" + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
      return hex.length === 1 ? "0" + hex : hex
    }).join("")
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

  // Helper function for RGB changes that has access to normalizedColors
  const handleRgbChangeForIndex = (idx, component, value) => {
    const currentColor = normalizedColors[idx] || '#3B82F6'
    const rgb = hexToRgb(currentColor)
    if (!rgb) return

    const newRgb = { ...rgb, [component]: Math.max(0, Math.min(255, parseInt(value) || 0)) }
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    handleColorChange(idx, newHex)
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-dark-textLight">
        Farben zuweisen
      </label>
      
      <div className="space-y-2">
        {labels.map((label, idx) => {
          const currentColor = normalizedColors[idx] || '#3B82F6'
          const rgb = hexToRgb(currentColor) || { r: 59, g: 130, b: 246 }
          const isExpanded = expandedIndex === idx
          const isColorPickerOpen = showColorPicker === idx

          return (
            <div key={idx} className="bg-dark-bg rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
              {/* Main color row */}
              <div className="flex items-center space-x-3 p-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(isColorPickerOpen ? null : idx)}
                    className="w-12 h-12 rounded cursor-pointer border-2 border-gray-600 hover:border-dark-accent1 transition-all"
                    style={{ backgroundColor: currentColor }}
                    title="Farbe auswählen"
                  />
                  {isColorPickerOpen && (
                    <div className="absolute left-0 top-14 z-50 bg-dark-secondary rounded-lg shadow-2xl border border-gray-700 p-4 min-w-[280px]">
                      <div className="space-y-3">
                        {/* HTML5 Color Picker */}
                        <div>
                          <label className="text-xs text-dark-textGray mb-2 block">Farbwähler</label>
                          <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => handleColorChange(idx, e.target.value)}
                            className="w-full h-10 rounded cursor-pointer border border-gray-700"
                          />
                        </div>
                        
                        {/* Color Presets */}
                        <div>
                          <label className="text-xs text-dark-textGray mb-2 block">Vordefinierte Farben</label>
                          <div className="grid grid-cols-5 gap-2">
                            {colorPresets.map((preset) => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => handleColorChange(idx, preset.value)}
                                className="w-full aspect-square rounded border-2 transition-all hover:scale-110 hover:border-dark-accent1"
                                style={{ 
                                  backgroundColor: preset.value,
                                  borderColor: preset.value === currentColor ? '#3B82F6' : '#475569'
                                }}
                                title={preset.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* RGB Input */}
                        <div>
                          <label className="text-xs text-dark-textGray mb-2 block">RGB-Werte</label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-dark-textGray mb-1 block">R</label>
                              <input
                                type="number"
                                min="0"
                                max="255"
                                value={rgb.r}
                                onChange={(e) => handleRgbChangeForIndex(idx, 'r', e.target.value)}
                                className="w-full px-2 py-1.5 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-dark-textGray mb-1 block">G</label>
                              <input
                                type="number"
                                min="0"
                                max="255"
                                value={rgb.g}
                                onChange={(e) => handleRgbChangeForIndex(idx, 'g', e.target.value)}
                                className="w-full px-2 py-1.5 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-dark-textGray mb-1 block">B</label>
                              <input
                                type="number"
                                min="0"
                                max="255"
                                value={rgb.b}
                                onChange={(e) => handleRgbChangeForIndex(idx, 'b', e.target.value)}
                                className="w-full px-2 py-1.5 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Hex Input */}
                        <div>
                          <label className="text-xs text-dark-textGray mb-2 block">Hex-Code</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={currentColor}
                              onChange={(e) => {
                                const hex = e.target.value
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                                  if (hex.length === 7) {
                                    handleColorChange(idx, hex)
                                  }
                                }
                              }}
                              className="flex-1 px-2 py-1.5 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs font-mono"
                              placeholder="#3B82F6"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(currentColor)
                              }}
                              className="px-3 py-1.5 bg-dark-accent1 hover:bg-dark-accent1/90 text-white rounded text-xs"
                              title="In Zwischenablage kopieren"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-dark-textLight font-medium">{label}</div>
                  <div className="text-xs text-dark-textGray font-mono">{currentColor}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="px-2 py-2 bg-dark-secondary hover:bg-gray-700 text-dark-textLight rounded transition-all"
                  title={isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
              </div>

              {/* Expanded view with quick options */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-700 pt-3 space-y-3">
                  {/* Quick color presets */}
                  <div>
                    <label className="text-xs text-dark-textGray mb-2 block">Schnellauswahl</label>
                    <div className="flex flex-wrap gap-2">
                      {colorPresets.slice(0, 8).map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handleColorChange(idx, preset.value)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                            preset.value === currentColor
                              ? 'border-2 border-dark-accent1'
                              : 'border border-gray-600 hover:border-gray-500'
                          }`}
                          style={{ 
                            backgroundColor: preset.value,
                            color: preset.value === '#FFFFFF' || preset.value === '#FDE68A' || preset.value === '#E5E7EB' ? '#000' : '#FFF'
                          }}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg/50 rounded-lg p-3 flex items-start space-x-2">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Klicken Sie auf die Farbe für erweiterte Optionen. Wählen Sie aus Vorgaben, verwenden Sie den Farbwähler oder geben Sie RGB/Hex-Werte ein.
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

