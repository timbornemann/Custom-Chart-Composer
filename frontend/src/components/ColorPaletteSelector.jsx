import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

// Comprehensive color palettes collection
const COLOR_PALETTES = [
  {
    name: 'Standard',
    colors: ['#4ADE80', '#22D3EE', '#F472B6', '#FBBF24', '#A78BFA']
  },
  {
    name: 'Lebhaft',
    colors: ['#EF4444', '#3B82F6', '#FBBF24', '#10B981', '#A78BFA']
  },
  {
    name: 'Pastell',
    colors: ['#FECACA', '#BFDBFE', '#FDE68A', '#BBF7D0', '#DDD6FE']
  },
  {
    name: 'Dunkel',
    colors: ['#DC2626', '#1D4ED8', '#D97706', '#059669', '#7C3AED']
  },
  {
    name: 'Ozean',
    colors: ['#06B6D4', '#0891B2', '#0E7490', '#155E75', '#164E63']
  },
  {
    name: 'Sonnenuntergang',
    colors: ['#F59E0B', '#F97316', '#EF4444', '#EC4899', '#8B5CF6']
  },
  {
    name: 'Wald',
    colors: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B']
  },
  {
    name: 'Beeren',
    colors: ['#EC4899', '#DB2777', '#BE185D', '#9F1239', '#881337']
  },
  {
    name: 'Business',
    colors: ['#1E40AF', '#7C3AED', '#059669', '#D97706', '#DC2626']
  },
  {
    name: 'Neon',
    colors: ['#22D3EE', '#A78BFA', '#FB923C', '#4ADE80', '#F472B6']
  },
  {
    name: 'Graustufen',
    colors: ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB']
  },
  {
    name: 'Erdtöne',
    colors: ['#78350F', '#92400E', '#B45309', '#D97706', '#F59E0B']
  },
  {
    name: 'Regenbogen',
    colors: ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899']
  },
  {
    name: 'Mint',
    colors: ['#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981']
  },
  {
    name: 'Lavendel',
    colors: ['#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA']
  },
  {
    name: 'Koralle',
    colors: ['#FED7AA', '#FDBA74', '#FB923C', '#F97316', '#EA580C']
  },
  {
    name: 'Türkis',
    colors: ['#99F6E4', '#5EEAD4', '#2DD4BF', '#14B8A6', '#0D9488']
  },
  {
    name: 'Material',
    colors: ['#F44336', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0']
  },
  {
    name: 'Warm',
    colors: ['#FCA5A5', '#FDBA74', '#FCD34D', '#FDE047', '#FEF08A']
  },
  {
    name: 'Kalt',
    colors: ['#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6']
  },
  {
    name: 'Herbst',
    colors: ['#DC2626', '#EA580C', '#CA8A04', '#65A30D', '#059669']
  },
  {
    name: 'Frühling',
    colors: ['#FDE047', '#BEF264', '#86EFAC', '#6EE7B7', '#5EEAD4']
  },
  {
    name: 'Sommer',
    colors: ['#FDE047', '#FB923C', '#F87171', '#F472B6', '#E879F9']
  },
  {
    name: 'Winter',
    colors: ['#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0EA5E9']
  },
  {
    name: 'Vintage',
    colors: ['#D4A373', '#BC8F8F', '#8B7355', '#A0826D', '#C19A6B']
  },
  {
    name: 'Tropical',
    colors: ['#10B981', '#06B6D4', '#F59E0B', '#EF4444', '#EC4899']
  },
  {
    name: 'Professional',
    colors: ['#0F172A', '#334155', '#64748B', '#94A3B8', '#CBD5E1']
  },
  {
    name: 'Energetic',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
  },
  {
    name: 'Monochrom Blau',
    colors: ['#DBEAFE', '#93C5FD', '#3B82F6', '#1E40AF', '#1E3A8A']
  },
  {
    name: 'Monochrom Grün',
    colors: ['#D1FAE5', '#6EE7B7', '#10B981', '#047857', '#064E3B']
  }
]

export default function ColorPaletteSelector({ selectedColors, onSelectPalette }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const filteredPalettes = COLOR_PALETTES.filter(palette =>
    palette.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCurrentPaletteName = () => {
    if (!selectedColors || selectedColors.length === 0) return 'Farbpalette wählen'
    
    // Check if current colors match any palette
    const matchingPalette = COLOR_PALETTES.find(palette => {
      if (palette.colors.length !== selectedColors.length) return false
      return palette.colors.every((color, idx) => 
        color.toLowerCase() === selectedColors[idx]?.toLowerCase()
      )
    })

    return matchingPalette ? matchingPalette.name : 'Benutzerdefiniert'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-dark-textLight mb-3">
        Farbpalette
      </label>
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 hover:border-dark-accent1 focus:border-dark-accent1 focus:outline-none transition-all flex items-center justify-between"
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex space-x-1">
            {selectedColors && selectedColors.slice(0, 5).map((color, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="text-sm">{getCurrentPaletteName()}</span>
        </div>
        <svg
          className={`w-5 h-5 text-dark-textGray transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-dark-secondary rounded-lg border border-gray-700 shadow-2xl max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-700">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Palette suchen..."
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight text-sm rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Palette List */}
          <div className="overflow-y-auto max-h-80 p-2">
            {filteredPalettes.length === 0 ? (
              <div className="px-4 py-8 text-center text-dark-textGray text-sm">
                Keine Paletten gefunden
              </div>
            ) : (
              filteredPalettes.map((palette, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectPalette(palette.colors)
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                  className="w-full px-3 py-3 rounded-lg hover:bg-dark-bg transition-all flex items-center space-x-3 group"
                >
                  <div className="flex space-x-1 flex-shrink-0">
                    {palette.colors.map((color, colorIdx) => (
                      <div
                        key={colorIdx}
                        className="w-7 h-7 rounded shadow-sm group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-dark-textLight font-medium flex-1 text-left">
                    {palette.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

ColorPaletteSelector.propTypes = {
  selectedColors: PropTypes.arrayOf(PropTypes.string),
  onSelectPalette: PropTypes.func.isRequired
}

