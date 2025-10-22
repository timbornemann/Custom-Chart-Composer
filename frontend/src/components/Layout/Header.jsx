export default function Header() {
  return (
    <header className="bg-dark-secondary border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-dark-accent1 to-dark-accent2 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-textLight">Custom Chart Composer</h1>
            <p className="text-sm text-dark-textGray">Erstelle beeindruckende Diagramme mit Leichtigkeit</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-dark-textGray">
            Version 1.0.0
          </div>
        </div>
      </div>
    </header>
  )
}

