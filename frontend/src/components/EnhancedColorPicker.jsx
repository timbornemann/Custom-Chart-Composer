import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

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

export default function EnhancedColorPicker({ value, onChange, label, showLabel = true, size = 'md', className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const pickerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const currentColor = value || '#3B82F6'
  const rgb = hexToRgb(currentColor) || { r: 59, g: 130, b: 246 }

  const handleColorChange = (newColor) => {
    onChange(newColor)
    setIsOpen(false)
  }

  const handleRgbChange = (component, val) => {
    const numVal = Math.max(0, Math.min(255, parseInt(val) || 0))
    const newRgb = { ...rgb, [component]: numVal }
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    handleColorChange(newHex)
  }

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {showLabel && label && (
        <label className="block text-xs font-medium text-dark-textLight mb-1">{label}</label>
      )}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`${sizeClasses[size]} rounded cursor-pointer border-2 border-gray-600 hover:border-dark-accent1 transition-all`}
            style={{ backgroundColor: currentColor }}
            title="Farbe auswählen"
          />
          {isOpen && (
            <div className="absolute left-0 top-14 z-50 bg-dark-secondary rounded-lg shadow-2xl border border-gray-700 p-4 min-w-[280px]">
              <div className="space-y-3">
                {/* HTML5 Color Picker */}
                <div>
                  <label className="text-xs text-dark-textGray mb-2 block">Farbwähler</label>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => handleColorChange(e.target.value)}
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
                        onClick={() => handleColorChange(preset.value)}
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
                        onChange={(e) => handleRgbChange('r', e.target.value)}
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
                        onChange={(e) => handleRgbChange('g', e.target.value)}
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
                        onChange={(e) => handleRgbChange('b', e.target.value)}
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
                            handleColorChange(hex)
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
          <input
            type="text"
            value={currentColor}
            onChange={(e) => {
              const hex = e.target.value
              if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                if (hex.length === 7) {
                  onChange(hex)
                }
              }
            }}
            className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
            placeholder="#3B82F6"
          />
        </div>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-700 space-y-2">
          <div>
            <label className="text-xs text-dark-textGray mb-2 block">Schnellauswahl</label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.slice(0, 8).map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleColorChange(preset.value)}
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
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-1 text-xs text-dark-textGray hover:text-dark-textLight"
      >
        {expanded ? '▲ Weniger' : '▼ Schnellauswahl'}
      </button>
    </div>
  )
}

EnhancedColorPicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  showLabel: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
}

