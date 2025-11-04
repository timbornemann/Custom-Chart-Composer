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
  onSave,
  onExportTransformed,
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
  dataScope,
  onDataScopeChange,
  rowsPerPage,
  onRowsPerPageChange,
  showLargeDatasetWarning,
  onDismissWarning
}) {
  return (
    <div className="flex-none border-b border-gray-700 bg-dark-secondary">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-3 shrink-0">
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
        
        <div className="flex items-center gap-2 flex-wrap ml-auto w-full md:w-auto">
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
            className="cursor-pointer rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-dark-accent1 shrink-0"
          >
            📁 Datei
          </label>
          {/* Reset */}
          {totalRows > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-red-600 hover:text-red-200 shrink-0"
              title="Daten zurücksetzen"
            >
              ⟲ Zurücksetzen
            </button>
          )}
          
          {totalRows > 0 && (
            <>
              {/* Save / Export */}
              <div className="flex items-center gap-1 border-r border-gray-700 pr-2 shrink-0">
                <button
                  type="button"
                  onClick={onSave}
                  className="rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-dark-accent1"
                  title="Originaldaten als CSV speichern"
                >
                  💾 Speichern
                </button>
                <button
                  type="button"
                  onClick={onExportTransformed}
                  className="rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight transition-colors hover:border-dark-accent1"
                  title="Aktuelle (gefilterte/ gruppierte) Ansicht als CSV exportieren"
                >
                  ⭳ Export Ansicht
                </button>
              </div>

              {/* Responsive break to second row on small widths */}
              <div className="basis-full md:basis-auto" />

              {/* Undo/Redo */}
              <div className="flex items-center gap-1 border-r border-gray-700 pr-2 shrink-0">
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

              {/* Second-row controls container */}
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                {/* Data Scope Switcher */}
                <div className="flex items-center gap-1 border-r border-gray-700 pr-2 shrink-0">
                <span className="text-xs text-dark-textGray mr-1">Ansicht:</span>
                <button
                  type="button"
                  onClick={() => onDataScopeChange('raw')}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    dataScope === 'raw'
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                  title="Original-Daten"
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => onDataScopeChange('transformed')}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    dataScope === 'transformed'
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                  }`}
                  title="Transformierte Daten (mit Filter, Gruppierung, etc.)"
                >
                  Transformiert
                </button>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-1 border-r border-gray-700 pr-2 shrink-0">
                  <span className="text-xs text-dark-textGray mr-1">Zeilen:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => onRowsPerPageChange(e.target.value)}
                    className="rounded border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="all">Alle</option>
                  </select>
                </div>

                {/* Side Panels (compact) */}
                <div className="flex items-center gap-1 border-r border-gray-700 pr-2 shrink-0">
                  <button
                    type="button"
                    onClick={onToggleLeftPanel}
                    className={`rounded-lg border px-2 py-1 text-xs transition-colors ${
                      leftPanelOpen
                        ? 'border-dark-accent1 bg-dark-accent1 text-white'
                        : 'border-gray-700 bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                    }`}
                    title="Linkes Seitenpanel umschalten"
                  >
                    ◧
                  </button>
                  <button
                    type="button"
                    onClick={onToggleRightPanel}
                    className={`rounded-lg border px-2 py-1 text-xs transition-colors ${
                      rightPanelOpen
                        ? 'border-dark-accent1 bg-dark-accent1 text-white'
                        : 'border-gray-700 bg-dark-bg text-dark-textGray hover:text-dark-textLight'
                    }`}
                    title="Rechtes Seitenpanel umschalten"
                  >
                    ◨
                  </button>
                </div>

                {/* Search Toggle */}
                <button
                  type="button"
                  onClick={onToggleSearch}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors shrink-0 ${
                    showSearch
                      ? 'border-dark-accent1 bg-dark-accent1 text-white'
                      : 'border-gray-700 bg-dark-bg text-dark-textLight hover:border-dark-accent1'
                  }`}
                >
                  🔍 Suchen
                </button>

                {/* Apply to Chart (right-aligned on wrap) */}
                <button
                  type="button"
                  onClick={onApply}
                  disabled={!canApply}
                  className="rounded-lg bg-dark-accent1 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-accent1/90 disabled:cursor-not-allowed disabled:bg-gray-700 shrink-0 md:ml-2 ml-auto"
                >
                  ✓ An Diagramm senden
                </button>
              </div>
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

      {/* Large Dataset Warning */}
      {showLargeDatasetWarning && (
        <div className="border-t border-yellow-600 bg-yellow-900/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div className="text-sm text-yellow-200">
                <strong>Großer Datensatz erkannt:</strong> {totalRows} Zeilen werden angezeigt. 
                Dies kann die Performance beeinträchtigen.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRowsPerPageChange('100')}
                className="rounded border border-yellow-600 bg-yellow-900/40 px-3 py-1 text-xs text-yellow-200 hover:bg-yellow-900/60"
              >
                100 Zeilen anzeigen
              </button>
              <button
                type="button"
                onClick={onDismissWarning}
                className="rounded border border-yellow-600 bg-yellow-900/40 px-3 py-1 text-xs text-yellow-200 hover:bg-yellow-900/60"
              >
                Weiterhin alle anzeigen
              </button>
            </div>
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
  onSave: PropTypes.func,
  onExportTransformed: PropTypes.func,
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
  dataScope: PropTypes.oneOf(['raw', 'transformed']),
  onDataScopeChange: PropTypes.func,
  rowsPerPage: PropTypes.string,
  onRowsPerPageChange: PropTypes.func,
  showLargeDatasetWarning: PropTypes.bool,
  onDismissWarning: PropTypes.func
}

