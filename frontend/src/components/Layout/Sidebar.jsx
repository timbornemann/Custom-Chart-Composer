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

const CATEGORY_ICONS = {
  bar: '📊',
  line: '📈',
  pie: '🥧',
  scatter: '🔘',
  special: '✨',
  [FALLBACK_CATEGORY_KEY]: '📁'
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
          icon: chart.icon || getCategoryIcon(key),
          charts: []
        })
      }

      const group = groups.get(key)
      if (!group.icon && chart.icon) {
        group.icon = chart.icon
      }
      group.charts.push(chart)
    })

    if (needsFallbackGroup && !groups.has(FALLBACK_CATEGORY_KEY)) {
      groups.set(FALLBACK_CATEGORY_KEY, {
        key: FALLBACK_CATEGORY_KEY,
        label: CATEGORY_LABELS[FALLBACK_CATEGORY_KEY],
        icon: CATEGORY_ICONS[FALLBACK_CATEGORY_KEY],
        charts: []
      })
    }

    return Array.from(groups.values())
      .map(group => ({
        ...group,
        icon: group.icon || getCategoryIcon(group.key),
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
                <span className="text-lg">{category.icon}</span>
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
                      <span className="text-lg leading-none mt-0.5">{chartType.icon || getCategoryIcon(chartType.category)}</span>
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

