import PropTypes from 'prop-types'

export default function CsvToolbar({
  fileName,
  totalRows,
  filteredRowCount,
  searchQuery,
  searchMode,
  searchError,
  onSearchChange,
  onSearchModeChange,
  onFileChange,
  onApply,
  onReset,
  canApply,
  manualEditCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showSearch,
  onToggleSearch,
  leftPanelOpen,
  onToggleLeftPanel,
  rightPanelOpen,
  onToggleRightPanel,
  isFullscreen,
  onToggleFullscreen
}) {
  return (
    <div className="flex-none border-b border-gray-700 bg-dark-secondary">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-dark-textLight">CSV Editor</h2>
          {fileName && (
            <span className="text-sm text-dark-textGray">
              {fileName} · {filteredRowCount} / {totalRows} Zeilen
            </span>
          )}
          {manualEditCount > 0 && (
            <span className="rounded bg-dark-accent1/20 px-2 py-0.5 text-xs text-dark-accent1">
              {manualEditCount} Änderung{manualEditCount !== 1 ? 'en' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* File Input */}
          <input
            type="file"
            accept=".csv,.tsv,.txt,.xls,.xlsx,.ods"
            onChange={onFileChange}
            className="hidden"
            id="csv-file-input"
          />
          <label
            htmlFor="csv-file-input"
            className="cursor-pointer rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-dark-accent1"
          >
            📁 Datei
          </label>
          
          {totalRows > 0 && (
            <>
              {/* Undo/Redo */}
              <div className="flex items-center gap-1 border-r border-gray-700 pr-2">
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="rounded px-2 py-1 text-lg text-dark-textGray transition-colors hover:text-dark-textLight disabled:cursor-not-allowed disabled:opacity-40"
                  title="Rückgängig"
                >
                  ↶
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="rounded px-2 py-1 text-lg text-dark-textGray transition-colors hover:text-dark-textLight disabled:cursor-not-allowed disabled:opacity-40"
                  title="Wiederholen"
                >
                  ↷
                </button>
              </div>
              
              {/* View Controls */}
              <div className="flex items-center gap-1 border-r border-gray-700 pr-2">
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isFullscreen
                      ? 'border-dark-accent1 bg-dark-accent1 text-white'
                      : 'border-gray-700 bg-dark-bg text-dark-textLight hover:border-dark-accent1'
                  }`}
                  title={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
                >
                  {isFullscreen ? '⊡' : '⊞'}
                </button>
                {!isFullscreen && (
                  <>
                    <button
                      type="button"
                      onClick={onToggleLeftPanel}
                      className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                        leftPanelOpen
                          ? 'border-dark-accent1 bg-dark-accent1 text-white'
                          : 'border-gray-700 bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                      }`}
                      title="Mapping/Transform Panel"
                    >
                      ◧
                    </button>
                    <button
                      type="button"
                      onClick={onToggleRightPanel}
                      className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                        rightPanelOpen
                          ? 'border-dark-accent1 bg-dark-accent1 text-white'
                          : 'border-gray-700 bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                      }`}
                      title="Tools Panel"
                    >
                      ◨
                    </button>
                  </>
                )}
              </div>
              
              {/* Search Toggle */}
              <button
                type="button"
                onClick={onToggleSearch}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  showSearch
                    ? 'border-dark-accent1 bg-dark-accent1 text-white'
                    : 'border-gray-700 bg-dark-bg text-dark-textLight hover:border-dark-accent1'
                }`}
              >
                🔍 Suchen
              </button>
              
              {/* Apply to Chart */}
              <button
                type="button"
                onClick={onApply}
                disabled={!canApply}
                className="rounded-lg bg-dark-accent1 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-accent1/90 disabled:cursor-not-allowed disabled:bg-gray-700"
              >
                ✓ An Diagramm senden
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Quick Search Bar (collapsible) */}
      {showSearch && totalRows > 0 && (
        <div className="border-t border-gray-700 bg-dark-bg/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Suchen..."
              className="flex-1 rounded-lg border border-gray-700 bg-dark-secondary px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            />
            <select
              value={searchMode}
              onChange={onSearchModeChange}
              className="rounded-lg border border-gray-700 bg-dark-secondary px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="whole">Ganzwort</option>
              <option value="regex">Regex</option>
            </select>
            {searchError && (
              <span className="text-xs text-red-300">{searchError}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

CsvToolbar.propTypes = {
  fileName: PropTypes.string,
  totalRows: PropTypes.number,
  filteredRowCount: PropTypes.number,
  searchQuery: PropTypes.string,
  searchMode: PropTypes.string,
  searchError: PropTypes.string,
  onSearchChange: PropTypes.func,
  onSearchModeChange: PropTypes.func,
  onFileChange: PropTypes.func,
  onApply: PropTypes.func,
  onReset: PropTypes.func,
  canApply: PropTypes.bool,
  manualEditCount: PropTypes.number,
  canUndo: PropTypes.bool,
  canRedo: PropTypes.bool,
  onUndo: PropTypes.func,
  onRedo: PropTypes.func,
  showSearch: PropTypes.bool,
  onToggleSearch: PropTypes.func,
  leftPanelOpen: PropTypes.bool,
  onToggleLeftPanel: PropTypes.func,
  rightPanelOpen: PropTypes.bool,
  onToggleRightPanel: PropTypes.func,
  isFullscreen: PropTypes.bool,
  onToggleFullscreen: PropTypes.func
}

