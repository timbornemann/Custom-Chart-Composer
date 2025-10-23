import { useState, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'

const FALLBACK_CATEGORY_KEY = 'misc'

const CATEGORY_LABELS = {
  bar: 'Balkendiagramme',
  line: 'Liniendiagramme',
  pie: 'Kreisdiagramme',
  scatter: 'Punktdiagramme',
  special: 'Spezialdiagramme',
  [FALLBACK_CATEGORY_KEY]: 'Sonstige'
}

// SVG Icon Components
const BarChartIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="4" height="18" rx="1" />
    <rect x="10" y="8" width="4" height="13" rx="1" />
    <rect x="17" y="13" width="4" height="8" rx="1" />
  </svg>
)

const LineChartIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 17 9 11 13 15 21 7" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 7 21 7 21 14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PieChartIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ScatterChartIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="6" cy="6" r="1.5" fill="currentColor" />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" />
    <circle cx="18" cy="5" r="1.5" fill="currentColor" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" />
    <circle cx="14" cy="14" r="1.5" fill="currentColor" />
    <circle cx="9" cy="18" r="1.5" fill="currentColor" />
    <circle cx="17" cy="16" r="1.5" fill="currentColor" />
  </svg>
)

const SpecialChartIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MiscIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CATEGORY_ICONS = {
  bar: <BarChartIcon />,
  line: <LineChartIcon />,
  pie: <PieChartIcon />,
  scatter: <ScatterChartIcon />,
  special: <SpecialChartIcon />,
  [FALLBACK_CATEGORY_KEY]: <MiscIcon />
}

function formatCategoryLabel(category) {
  if (!category) return CATEGORY_LABELS[FALLBACK_CATEGORY_KEY]
  const normalized = category.toLowerCase()
  if (CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized]
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function getCategoryIcon(category) {
  if (!category) return CATEGORY_ICONS[FALLBACK_CATEGORY_KEY]
  const normalized = category.toLowerCase()
  return CATEGORY_ICONS[normalized] || CATEGORY_ICONS[FALLBACK_CATEGORY_KEY]
}

export default function Sidebar({ chartTypes, selectedChartType, onSelectChartType }) {
  const groupedCharts = useMemo(() => {
    const groups = new Map()
    let needsFallbackGroup = false

    chartTypes.forEach(chart => {
      const hasCategory = !!chart.category
      const key = (chart.category || FALLBACK_CATEGORY_KEY).toLowerCase()
      if (!hasCategory) {
        needsFallbackGroup = true
      }
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: formatCategoryLabel(key),
          iconKey: key,
          charts: []
        })
      }

      const group = groups.get(key)
      group.charts.push(chart)
    })

    if (needsFallbackGroup && !groups.has(FALLBACK_CATEGORY_KEY)) {
      groups.set(FALLBACK_CATEGORY_KEY, {
        key: FALLBACK_CATEGORY_KEY,
        label: CATEGORY_LABELS[FALLBACK_CATEGORY_KEY],
        iconKey: FALLBACK_CATEGORY_KEY,
        charts: []
      })
    }

    return Array.from(groups.values())
      .map(group => ({
        ...group,
        charts: group.charts.sort((a, b) => a.name.localeCompare(b.name, 'de-DE'))
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de-DE'))
  }, [chartTypes])

  const [expandedCategories, setExpandedCategories] = useState({})

  useEffect(() => {
    setExpandedCategories(prev => {
      const nextState = {}
      groupedCharts.forEach(group => {
        nextState[group.key] = prev[group.key] ?? true
      })
      return nextState
    })
  }, [groupedCharts])

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }))
  }

  return (
    <aside className="w-64 bg-dark-secondary border-r border-gray-700 h-screen sticky top-0 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-dark-textLight mb-2">Diagrammtypen</h2>
        <p className="text-sm text-dark-textGray">Wähle einen Typ aus</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-3">
        {groupedCharts.map((category) => (
          <div key={category.key} className="space-y-1">
            {/* Kategorie Header */}
            <button
              onClick={() => toggleCategory(category.key)}
              className="w-full flex items-center justify-between px-3 py-2 text-dark-textLight hover:bg-gray-800 rounded-lg transition-colors duration-150"
            >
              <div className="flex items-center space-x-2">
                <span className="text-dark-accent1">{getCategoryIcon(category.iconKey)}</span>
                <span className="font-semibold text-sm">{category.label}</span>
                <span className="text-xs text-dark-textGray">({category.charts.length})</span>
              </div>
              <svg
                className={`w-4 h-4 text-dark-textGray transition-transform duration-200 ${
                  expandedCategories[category.key] ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Kategorie Inhalte */}
            {expandedCategories[category.key] && (
              <div className="space-y-1 pl-2">
                {category.charts.map((chartType) => (
                  <button
                    key={chartType.id}
                    onClick={() => onSelectChartType(chartType)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      selectedChartType?.id === chartType.id
                        ? 'bg-gradient-to-r from-dark-accent1 to-dark-accent2 text-white shadow-lg'
                        : 'bg-dark-bg text-dark-textGray hover:bg-gray-800 hover:text-dark-textLight'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className={`leading-none mt-0.5 ${selectedChartType?.id === chartType.id ? 'text-white' : 'text-dark-accent1'}`}>
                        {getCategoryIcon(chartType.category)}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium text-xs text-dark-textLight block">{chartType.name}</span>
                        {chartType.description && (
                          <span className="text-[11px] text-dark-textGray leading-tight block mt-1">
                            {chartType.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

Sidebar.propTypes = {
  chartTypes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string,
    icon: PropTypes.string,
    description: PropTypes.string,
    configSchema: PropTypes.object
  })).isRequired,
  selectedChartType: PropTypes.shape({
    id: PropTypes.string.isRequired
  }),
  onSelectChartType: PropTypes.func.isRequired
}

