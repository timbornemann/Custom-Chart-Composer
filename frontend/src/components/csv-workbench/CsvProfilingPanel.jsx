import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  formatStatNumber,
  formatStatPercentage,
  formatSamplePreview,
  formatCorrelationValue
} from '../csv/formatting'
import { useCsvWorkbenchCorrelation } from '../../hooks/useCsvWorkbenchCorrelation'
import NumericHistogram from './profiling/NumericHistogram'
import TextValueSparkline from './profiling/TextValueSparkline'

const TYPE_FILTERS = [
  { key: 'all', label: 'Alle' },
  { key: 'number', label: 'Numerisch' },
  { key: 'string', label: 'Text' }
]

const formatCardinality = (cardinality) => {
  if (!cardinality || typeof cardinality.uniqueCount !== 'number') {
    return '–'
  }
  const prefix = cardinality.isLowerBound ? '≥' : ''
  return `${prefix}${cardinality.uniqueCount.toLocaleString('de-DE')}`
}

const getCardinalitySubtitle = (cardinality, filledCount) => {
  if (!cardinality || filledCount === 0) {
    return 'Keine eindeutigen Werte ermittelt'
  }
  if (cardinality.ratio === null || cardinality.ratio === undefined) {
    return `${cardinality.uniqueCount} eindeutige Werte`
  }
  return `${cardinality.uniqueCount.toLocaleString('de-DE')} eindeutige Werte · ${formatStatPercentage(cardinality.ratio)}`
}

export default function CsvProfilingPanel({ columns, profilingMeta }) {
  const [profilingColumnKey, setProfilingColumnKey] = useState(columns[0]?.key || null)
  const [columnTypeFilter, setColumnTypeFilter] = useState('all')

  const filteredColumns = useMemo(() => {
    if (columnTypeFilter === 'all') {
      return columns
    }
    return columns.filter((column) => column.type === columnTypeFilter)
  }, [columns, columnTypeFilter])

  useEffect(() => {
    if (filteredColumns.length === 0) {
      setProfilingColumnKey(null)
      return
    }
    if (!profilingColumnKey || !filteredColumns.some((column) => column.key === profilingColumnKey)) {
      setProfilingColumnKey(filteredColumns[0]?.key ?? null)
    }
  }, [filteredColumns, profilingColumnKey])

  const profilingColumn = useMemo(() => {
    if (!profilingColumnKey) {
      return null
    }
    return columns.find((column) => column.key === profilingColumnKey) || null
  }, [columns, profilingColumnKey])

  const profilingFilledCount = profilingColumn?.filledCount ?? 0
  const profilingEmptyCount = profilingColumn?.emptyCount ?? 0
  const profilingNumericStats = profilingColumn?.statistics?.numeric ?? null
  const profilingTextStats = profilingColumn?.statistics?.text ?? null
  const hasNumericStats = Boolean(profilingNumericStats && profilingNumericStats.count > 0)
  const hasTextFrequencies = Boolean(profilingTextStats?.topValues?.length)
  const profilingTotalCount = profilingFilledCount + profilingEmptyCount
  const profilingFilledRatio =
    profilingTotalCount > 0 ? profilingFilledCount / profilingTotalCount : null
  const profilingNullRatio =
    profilingColumn?.nullRatio ?? (profilingTotalCount > 0 ? profilingEmptyCount / profilingTotalCount : null)
  const cardinality = profilingColumn?.cardinality ?? null
  const histogram = profilingNumericStats?.histogram ?? null
  const outlierCount = profilingNumericStats?.outlierCount ?? 0
  const outlierRatio = profilingNumericStats?.outlierRatio ?? (
    profilingNumericStats?.count > 0
      ? outlierCount / profilingNumericStats.count
      : null
  )
  const samples = profilingColumn?.samples ?? []

  const {
    correlationMatrix,
    correlationDisplayIndices,
    correlationDisplayColumns,
    correlationSelectedColumns,
    correlationSelectionSummary,
    correlationThreshold,
    correlationSortKey,
    hoveredCorrelationCell,
    hoveredCorrelationRow,
    hoveredCorrelationColumn,
    correlationAvailableColumns,
    correlationTruncatedColumns,
    correlationPairCounts,
    hasCorrelationData,
    handleCorrelationColumnToggle,
    handleCorrelationSelectionReset,
    handleCorrelationSelectionClear,
    handleCorrelationThresholdInput,
    handleCorrelationThresholdChange,
    handleCorrelationSortChange,
    setHoveredCorrelationCell,
    correlationColorForValue
  } = useCsvWorkbenchCorrelation({ profilingMeta })

  const hoveredRowIndex = hoveredCorrelationCell?.row ?? null
  const hoveredColumnIndex = hoveredCorrelationCell?.column ?? null
  const hoveredRowMatrixIndex =
    hoveredRowIndex !== null ? correlationDisplayIndices[hoveredRowIndex] ?? null : null
  const hoveredColumnMatrixIndex =
    hoveredColumnIndex !== null ? correlationDisplayIndices[hoveredColumnIndex] ?? null : null
  const hoveredRowKey =
    hoveredRowMatrixIndex !== null ? correlationMatrix?.columns?.[hoveredRowMatrixIndex] : null
  const hoveredColumnKey =
    hoveredColumnMatrixIndex !== null ? correlationMatrix?.columns?.[hoveredColumnMatrixIndex] : null
  const hoveredValue =
    hoveredRowMatrixIndex !== null && hoveredColumnMatrixIndex !== null
      ? correlationMatrix?.matrix?.[hoveredRowMatrixIndex]?.[hoveredColumnMatrixIndex] ?? null
      : null
  const hoveredPairCount =
    hoveredRowMatrixIndex !== null && hoveredColumnMatrixIndex !== null
      ? correlationPairCounts?.[hoveredRowMatrixIndex]?.[hoveredColumnMatrixIndex] ?? 0
      : 0

  const handleTypeFilterChange = (key) => {
    setColumnTypeFilter(key)
  }

  const handleCorrelationSortToggle = (columnKey) => {
    const nextValue = correlationSortKey === columnKey ? '' : columnKey
    handleCorrelationSortChange({ target: { value: nextValue } })
  }

  if (columns.length === 0) {
    return <div className="text-xs text-dark-textGray">Keine Spalten verfügbar für Profiling</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-dark-textLight">Spaltenprofil</h3>
        <p className="mb-3 text-xs text-dark-textGray">Statistiken und Korrelation</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {TYPE_FILTERS.map((filter) => {
          const isActive = columnTypeFilter === filter.key
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => handleTypeFilterChange(filter.key)}
              className={`rounded-md border px-2 py-1 transition-colors ${
                isActive
                  ? 'border-dark-accent1 bg-dark-accent1/20 text-dark-textLight'
                  : 'border-gray-700 text-dark-textGray hover:border-dark-accent1 hover:text-dark-textLight'
              }`}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      <select
        value={profilingColumnKey || ''}
        onChange={(event) => setProfilingColumnKey(event.target.value || null)}
        className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
        disabled={filteredColumns.length === 0}
      >
        {filteredColumns.length === 0 && <option value="">Keine passende Spalte</option>}
        {filteredColumns.map((column) => (
          <option key={column.key} value={column.key}>
            {column.key}
          </option>
        ))}
      </select>

      {filteredColumns.length === 0 && (
        <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3 text-xs text-dark-textGray">
          Für den gewählten Filter sind keine Spalten verfügbar.
        </div>
      )}

      {profilingColumn && (
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-dark-textGray">Typ:</span>
              <span className="text-dark-textLight">
                {profilingColumn.type === 'number' ? 'Zahl' : 'Text'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-textGray">Ausgefüllt:</span>
              <span className="text-dark-textLight">
                {profilingFilledCount} / {profilingTotalCount}
                {profilingFilledRatio !== null && profilingTotalCount > 0 && (
                  <span className="ml-1 text-dark-textGray">
                    ({formatStatPercentage(profilingFilledRatio)})
                  </span>
                )}
              </span>
            </div>
            {hasNumericStats && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-dark-textGray">Min:</span>
                  <span className="text-dark-textLight">
                    {formatStatNumber(profilingNumericStats.min)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-textGray">Max:</span>
                  <span className="text-dark-textLight">
                    {formatStatNumber(profilingNumericStats.max)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-textGray">Durchschnitt:</span>
                  <span className="text-dark-textLight">
                    {formatStatNumber(profilingNumericStats.mean)}
                  </span>
                </div>
              </div>
            )}
            {hasTextFrequencies && (
              <div className="mt-2">
                <div className="mb-1 text-[11px] font-semibold text-dark-textGray">Häufigste Werte:</div>
                {profilingTextStats.topValues.slice(0, 3).map((entry, index) => (
                  <div key={`${profilingColumn.key}-top-${index}`} className="flex justify-between text-[11px]">
                    <span className="truncate text-dark-textLight">{entry.value || '(leer)'}</span>
                    <span className="text-dark-textGray">{entry.count}</span>
                  </div>
                ))}
              </div>
            )}
            {samples.length > 0 && (
              <div className="mt-2">
                <div className="mb-1 text-[11px] font-semibold text-dark-textGray">Beispiele:</div>
                <ul className="grid grid-cols-2 gap-1 text-[11px] text-dark-textLight">
                  {samples.slice(0, 6).map((sample, index) => (
                    <li key={`${profilingColumn.key}-sample-${index}`} className="truncate">
                      {formatSamplePreview(sample)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
              <div className="text-[11px] uppercase tracking-wide text-dark-textGray">Nullrate</div>
              <div className="text-lg font-semibold text-dark-textLight">
                {profilingNullRatio !== null ? formatStatPercentage(profilingNullRatio) : '–'}
              </div>
              <div className="text-[11px] text-dark-textGray">
                {profilingEmptyCount.toLocaleString('de-DE')} / {profilingTotalCount.toLocaleString('de-DE')}
              </div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
              <div className="text-[11px] uppercase tracking-wide text-dark-textGray">Kardinalität</div>
              <div className="text-lg font-semibold text-dark-textLight">
                {formatCardinality(cardinality)}
              </div>
              <div className="text-[11px] text-dark-textGray">
                {getCardinalitySubtitle(cardinality, profilingFilledCount)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
              <div className="text-[11px] uppercase tracking-wide text-dark-textGray">Ausreißer</div>
              <div className="text-lg font-semibold text-dark-textLight">
                {hasNumericStats ? outlierCount.toLocaleString('de-DE') : '–'}
              </div>
              <div className="text-[11px] text-dark-textGray">
                {hasNumericStats
                  ? outlierRatio !== null
                    ? `${formatStatPercentage(outlierRatio)} der ${
                        profilingNumericStats.count.toLocaleString('de-DE')
                      } Werte`
                    : 'Keine Abweichungen festgestellt'
                  : 'Nur für numerische Spalten verfügbar'}
              </div>
            </div>
          </div>

          {hasNumericStats && histogram && Array.isArray(histogram.bins) && histogram.bins.length > 0 && (
            <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between text-[11px] text-dark-textGray">
                <span>Verteilung (Histogramm)</span>
                {histogram.isSampled && (
                  <span>
                    Stichprobe {histogram.sampleCount.toLocaleString('de-DE')} / {histogram.totalCount.toLocaleString('de-DE')}
                  </span>
                )}
              </div>
              <NumericHistogram histogram={histogram} />
            </div>
          )}

          {hasTextFrequencies && (
            <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between text-[11px] text-dark-textGray">
                <span>Top-Werte (Sparkline)</span>
                <span>
                  {profilingTextStats.topValues
                    .slice(0, 10)
                    .reduce((total, entry) => total + (entry.count ?? 0), 0)
                    .toLocaleString('de-DE')}{' '}
                  Beobachtungen
                </span>
              </div>
              <TextValueSparkline values={profilingTextStats.topValues.slice(0, 10)} />
            </div>
          )}
        </div>
      )}

      {correlationMatrix && correlationMatrix.columns?.length > 1 && (
        <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3 text-[11px] text-dark-textGray">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-dark-textLight">Korrelation</h4>
              <p className="text-xs text-dark-textGray">
                Pearson-Korrelation zwischen {correlationMatrix.columns.length} numerischen Spalten
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <span>Schwelle:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={correlationThreshold}
                  onChange={(event) => handleCorrelationThresholdChange(Number.parseFloat(event.target.value) || 0)}
                  className="h-2 w-28 cursor-pointer"
                />
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={correlationThreshold.toFixed(2)}
                onChange={handleCorrelationThresholdInput}
                className="w-16 rounded border border-gray-700 bg-dark-bg px-2 py-1 text-right text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded border border-dark-accent1/40 bg-dark-secondary/40 px-2 py-1 text-dark-textLight/80">
              Auswahl: {correlationSelectionSummary}
            </span>
            <button
              type="button"
              onClick={handleCorrelationSelectionReset}
              className="rounded border border-gray-700 px-2 py-1 text-dark-textGray transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
            >
              Alle
            </button>
            <button
              type="button"
              onClick={handleCorrelationSelectionClear}
              className="rounded border border-gray-700 px-2 py-1 text-dark-textGray transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
            >
              Keine
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {correlationAvailableColumns.map((columnKey) => {
              const isSelected =
                correlationSelectedColumns.length === 0 || correlationSelectedColumns.includes(columnKey)
              return (
                <button
                  key={`corr-toggle-${columnKey}`}
                  type="button"
                  onClick={() => handleCorrelationColumnToggle(columnKey, !isSelected)}
                  className={`rounded-full border px-2 py-1 transition-colors ${
                    isSelected
                      ? 'border-dark-accent1 bg-dark-accent1/20 text-dark-textLight'
                      : 'border-gray-700 text-dark-textGray hover:border-dark-accent1 hover:text-dark-textLight'
                  }`}
                >
                  {columnKey}
                </button>
              )
            })}
          </div>

          {correlationTruncatedColumns.length > 0 && (
            <p className="mt-2 text-[10px] text-yellow-200">
              {correlationTruncatedColumns.length} weitere numerische Spalten wurden aus Performance-Gründen ausgeblendet.
            </p>
          )}

          {hasCorrelationData ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <label className="flex items-center gap-1">
                  <span>Sortieren:</span>
                  <select
                    value={correlationSortKey}
                    onChange={handleCorrelationSortChange}
                    className="rounded border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  >
                    <option value="">Keine</option>
                    {correlationDisplayColumns.map((columnKey) => (
                      <option key={`corr-sort-${columnKey}`} value={columnKey}>
                        {columnKey}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div
                className="mt-3 overflow-x-auto"
                onMouseLeave={() => setHoveredCorrelationCell(null)}
              >
                <table className="min-w-full table-fixed border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-dark-bg px-2 py-2 text-left font-semibold text-dark-textGray">
                        Spalte
                      </th>
                      {correlationDisplayColumns.map((columnKey, columnPosition) => {
                        const isHovered = hoveredCorrelationColumn === columnPosition
                        const isSorted = correlationSortKey === columnKey
                        return (
                          <th
                            key={`corr-header-${columnKey}`}
                            className={`px-2 py-2 text-center font-semibold transition-colors ${
                              isHovered ? 'bg-dark-secondary/60 text-dark-textLight' : 'text-dark-textGray'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCorrelationSortToggle(columnKey)}
                              onMouseEnter={() => setHoveredCorrelationCell({ row: null, column: columnPosition })}
                              className={`flex w-full items-center justify-center gap-1 rounded px-2 py-1 transition-colors ${
                                isSorted ? 'bg-dark-accent1/30 text-dark-textLight' : 'hover:bg-dark-secondary/40'
                              }`}
                            >
                              <span className="truncate">{columnKey}</span>
                              {isSorted && <span aria-hidden="true">⇅</span>}
                            </button>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationDisplayIndices.map((rowMatrixIndex, rowPosition) => {
                      const rowKey = correlationMatrix.columns[rowMatrixIndex]
                      const rowValues = correlationMatrix.matrix?.[rowMatrixIndex] || []
                      const isHoveredRow = hoveredCorrelationRow === rowPosition
                      return (
                        <tr key={`corr-row-${rowKey}`} className={isHoveredRow ? 'bg-dark-secondary/30' : ''}>
                          <th
                            scope="row"
                            className={`sticky left-0 z-10 bg-dark-bg px-2 py-1 text-left font-semibold transition-colors ${
                              isHoveredRow ? 'text-dark-textLight' : 'text-dark-textGray'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCorrelationSortToggle(rowKey)}
                              onMouseEnter={() => setHoveredCorrelationCell({ row: rowPosition, column: null })}
                              className="flex w-full items-center justify-start gap-1 rounded px-2 py-1 text-left transition-colors hover:bg-dark-secondary/40"
                            >
                              <span className="truncate">{rowKey}</span>
                              {correlationSortKey === rowKey && <span aria-hidden="true">⇅</span>}
                            </button>
                          </th>
                          {correlationDisplayIndices.map((columnMatrixIndex, columnPosition) => {
                            const value = rowValues?.[columnMatrixIndex] ?? null
                            const pairCount = correlationPairCounts?.[rowMatrixIndex]?.[columnMatrixIndex] ?? 0
                            const passesThreshold = value !== null && Math.abs(value) >= correlationThreshold
                            const displayValue = passesThreshold ? formatCorrelationValue(value) : '–'
                            const cellColor = passesThreshold ? correlationColorForValue(value) : 'transparent'
                            const isActiveCell =
                              hoveredCorrelationRow === rowPosition && hoveredCorrelationColumn === columnPosition
                            const cellClass = `px-2 py-1 text-center transition-colors ${
                              hoveredCorrelationColumn === columnPosition ? 'bg-dark-secondary/40' : ''
                            } ${isActiveCell ? 'ring-1 ring-dark-accent1' : ''}`

                            return (
                              <td
                                key={`corr-cell-${rowKey}-${columnMatrixIndex}`}
                                className={cellClass}
                                style={{ backgroundColor: cellColor }}
                                title={
                                  value !== null
                                    ? `r = ${formatCorrelationValue(value)} · ${pairCount} Werte`
                                    : 'Keine gemeinsamen Werte'
                                }
                                onMouseEnter={() =>
                                  setHoveredCorrelationCell({ row: rowPosition, column: columnPosition })
                                }
                              >
                                <span className="font-mono text-[11px] text-dark-textLight">{displayValue}</span>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {hoveredRowKey && hoveredColumnKey && (
                <div className="mt-3 rounded-lg border border-dark-accent1/40 bg-dark-accent1/10 px-3 py-2 text-xs text-dark-textLight">
                  <div className="font-semibold">
                    {hoveredRowKey} ↔ {hoveredColumnKey}
                  </div>
                  <div>
                    r = {hoveredValue !== null ? formatCorrelationValue(hoveredValue) : '–'} ·{' '}
                    {hoveredPairCount.toLocaleString('de-DE')} gemeinsame Werte
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-xs">
              Nicht genügend überlappende Werte, um eine Korrelationsmatrix anzuzeigen. Reduzieren Sie ggf. die Schwelle oder wählen Sie weitere Spalten aus.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

CsvProfilingPanel.propTypes = {
  columns: PropTypes.array.isRequired,
  profilingMeta: PropTypes.object
}

