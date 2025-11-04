import { useState } from 'react'
import PropTypes from 'prop-types'
import DuplicatesSection from '../csv/DuplicatesSection'
import ValidationRulesPanel from '../csv/ValidationRulesPanel'
import QuickAggregationPanel from '../csv/QuickAggregationPanel'

export default function CsvToolsPanel({
  activeTab,
  onTabChange,
  // Duplicates props
  columns,
  duplicateKeyColumns,
  hasDuplicateSelection,
  hasDuplicates,
  duplicateGroups,
  duplicateRowCount,
  duplicateActionFeedback,
  onDuplicateToggle,
  onDuplicateSelectAll,
  onDuplicateClear,
  onDuplicateResolve,
  // Validation props
  validationRules,
  validationIssues,
  validationSummary,
  onAddValidationRule,
  onUpdateValidationRule,
  onRemoveValidationRule,
  onFocusValidationIssue,
  // Aggregation props
  numericColumns,
  textColumns,
  quickAggregationConfig,
  quickAggregationResult,
  onAggregationConfigChange,
  onRunAggregation,
  onExportAggregation,
  // Search props
  searchMatches,
  searchMatchSummary,
  hasSearchMatches,
  onNavigateMatch,
  onOpenFindReplace
}) {
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => onTabChange('search')}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-dark-accent1 text-white'
              : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
          }`}
        >
          Suche
        </button>
        <button
          onClick={() => onTabChange('duplicates')}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'duplicates'
              ? 'bg-dark-accent1 text-white'
              : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
          }`}
        >
          Duplikate
        </button>
        <button
          onClick={() => onTabChange('validation')}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'validation'
              ? 'bg-dark-accent1 text-white'
              : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
          }`}
        >
          Regeln
        </button>
        <button
          onClick={() => onTabChange('aggregation')}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'aggregation'
              ? 'bg-dark-accent1 text-white'
              : 'bg-dark-bg text-dark-textGray hover:text-dark-textLight'
          }`}
        >
          Aggregat
        </button>
      </div>

      {/* Content */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-dark-textLight">Erweiterte Suche</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateMatch(-1)}
                disabled={!hasSearchMatches}
                className="flex-1 rounded border border-gray-700 px-2 py-1 text-xs text-dark-textLight transition-colors hover:border-dark-accent1 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Vorheriger
              </button>
              <button
                type="button"
                onClick={() => onNavigateMatch(1)}
                disabled={!hasSearchMatches}
                className="flex-1 rounded border border-gray-700 px-2 py-1 text-xs text-dark-textLight transition-colors hover:border-dark-accent1 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Nächster →
              </button>
            </div>
            <div className="text-center text-xs text-dark-textGray">
              Treffer: {searchMatchSummary}
            </div>
            <button
              type="button"
              onClick={onOpenFindReplace}
              disabled={!hasSearchMatches}
              className="w-full rounded border border-dark-accent1/40 px-3 py-2 text-sm text-dark-accent1 transition-colors hover:bg-dark-accent1/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suchen & Ersetzen...
            </button>
          </div>
        </div>
      )}

      {activeTab === 'duplicates' && (
        <DuplicatesSection
          columns={columns}
          duplicateKeyColumns={duplicateKeyColumns}
          hasDuplicateSelection={hasDuplicateSelection}
          hasDuplicates={hasDuplicates}
          duplicateGroups={duplicateGroups}
          duplicateRowCount={duplicateRowCount}
          duplicateActionFeedback={duplicateActionFeedback}
          onToggleColumn={onDuplicateToggle}
          onSelectAll={onDuplicateSelectAll}
          onClear={onDuplicateClear}
          onResolveAction={onDuplicateResolve}
        />
      )}

      {activeTab === 'validation' && (
        <ValidationRulesPanel
          columns={columns}
          rules={validationRules}
          issues={validationIssues}
          summary={validationSummary}
          onAddRule={onAddValidationRule}
          onUpdateRule={onUpdateValidationRule}
          onRemoveRule={onRemoveValidationRule}
          onFocusIssue={onFocusValidationIssue}
        />
      )}

      {activeTab === 'aggregation' && (
        <QuickAggregationPanel
          config={quickAggregationConfig}
          numericColumns={numericColumns}
          textColumns={textColumns}
          result={quickAggregationResult}
          onConfigChange={onAggregationConfigChange}
          onRun={onRunAggregation}
          onExport={onExportAggregation}
        />
      )}
    </div>
  )
}

CsvToolsPanel.propTypes = {
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  columns: PropTypes.array,
  duplicateKeyColumns: PropTypes.array,
  hasDuplicateSelection: PropTypes.bool,
  hasDuplicates: PropTypes.bool,
  duplicateGroups: PropTypes.array,
  duplicateRowCount: PropTypes.number,
  duplicateActionFeedback: PropTypes.object,
  onDuplicateToggle: PropTypes.func,
  onDuplicateSelectAll: PropTypes.func,
  onDuplicateClear: PropTypes.func,
  onDuplicateResolve: PropTypes.func,
  validationRules: PropTypes.array,
  validationIssues: PropTypes.array,
  validationSummary: PropTypes.array,
  onAddValidationRule: PropTypes.func,
  onUpdateValidationRule: PropTypes.func,
  onRemoveValidationRule: PropTypes.func,
  onFocusValidationIssue: PropTypes.func,
  numericColumns: PropTypes.array,
  textColumns: PropTypes.array,
  quickAggregationConfig: PropTypes.object,
  quickAggregationResult: PropTypes.object,
  onAggregationConfigChange: PropTypes.func,
  onRunAggregation: PropTypes.func,
  onExportAggregation: PropTypes.func,
  searchMatches: PropTypes.array,
  searchMatchSummary: PropTypes.string,
  hasSearchMatches: PropTypes.bool,
  onNavigateMatch: PropTypes.func,
  onOpenFindReplace: PropTypes.func,
  transformations: PropTypes.object,
  onUpdateTransformations: PropTypes.func
}

