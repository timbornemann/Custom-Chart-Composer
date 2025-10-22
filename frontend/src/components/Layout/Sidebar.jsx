export default function Sidebar({ chartTypes, selectedChartType, onSelectChartType }) {
  return (
    <aside className="w-64 bg-dark-secondary border-r border-gray-700 min-h-screen p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-dark-textLight mb-2">Diagrammtypen</h2>
        <p className="text-sm text-dark-textGray">Wähle einen Typ aus</p>
      </div>
      <nav className="space-y-2">
        {chartTypes.map((chartType) => (
          <button
            key={chartType.id}
            onClick={() => onSelectChartType(chartType)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              selectedChartType?.id === chartType.id
                ? 'bg-gradient-to-r from-dark-accent1 to-dark-accent2 text-white shadow-lg'
                : 'bg-dark-bg text-dark-textGray hover:bg-gray-800 hover:text-dark-textLight'
            }`}
          >
            <div className="flex items-center space-x-3">
              <ChartIcon type={chartType.id} />
              <span className="font-medium">{chartType.name}</span>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function ChartIcon({ type }) {
  const icons = {
    bar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    line: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    pie: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    donut: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    radar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
  
  return icons[type] || icons.bar
}

