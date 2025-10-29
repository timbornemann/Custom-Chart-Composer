import PropTypes from 'prop-types'
import AppLogo from '../../Custom-Chart-Composer-Icon.png'

export default function Header({ onNewChart, hasUnsavedChanges = false }) {
  return (
    <header className="bg-dark-secondary border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={AppLogo}
            alt="Custom Chart Composer"
            className="w-10 h-10 rounded-xl object-contain shadow-sm"
            draggable={false}
          />
          <div>
            <h1 className="text-2xl font-bold text-dark-textLight">Custom Chart Composer</h1>
            <p className="text-sm text-dark-textGray">Erstelle beeindruckende Diagramme mit Leichtigkeit</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-dark-textGray">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                hasUnsavedChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
              aria-hidden="true"
            />
            <span>
              {hasUnsavedChanges ? 'Eigene Änderungen aktiv' : 'Zwischenspeicherung aktiviert'}
            </span>
          </div>
          <button
            type="button"
            onClick={onNewChart}
            className="flex items-center space-x-2 rounded-lg bg-dark-accent1/90 hover:bg-dark-accent1 px-4 py-2 text-sm font-medium text-white transition-colors shadow-lg shadow-dark-accent1/20"
            title="Neues Diagramm starten"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Neues Diagramm</span>
          </button>
          <div className="text-sm text-dark-textGray">
            Version 1.0.0
          </div>
        </div>
      </div>
    </header>
  )
}

Header.propTypes = {
  onNewChart: PropTypes.func.isRequired,
  hasUnsavedChanges: PropTypes.bool
}


