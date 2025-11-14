import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  formatStatNumber,
  formatStatPercentage,
  formatSamplePreview,
  formatCorrelationValue
} from '../csv/formatting'
import { useCsvWorkbenchCorrelation } from '../../hooks/useCsvWorkbenchCorrelation'
import { computeSegmentTest } from '../../utils/csv/statistics'
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
  const [targetColumnKey, setTargetColumnKey] = useState('')
  const [segmentColumnKey, setSegmentColumnKey] = useState('')
  const [selectedSegmentValues, setSelectedSegmentValues] = useState([])
  const [selectedTargetCategory, setSelectedTargetCategory] = useState('')

  const filteredColumns = useMemo(() => {
    if (columnTypeFilter === 'all') {
      return columns
    }
    return columns.filter((column) => column.type === columnTypeFilter)
  }, [columns, columnTypeFilter])

  const categoricalDistributions = profilingMeta?.categoricalDistributions || {}
  const statisticalSamples = profilingMeta?.statisticalSamples || []
  const statisticalSamplesInfo = profilingMeta?.statisticalSamplesInfo || {}
  const sampleCount = statisticalSamplesInfo.sampleCount ?? statisticalSamples.length
  const sampleMax = statisticalSamplesInfo.maxSamples ?? statisticalSamples.length
  const sampleTotalRows = statisticalSamplesInfo.totalRows ?? null
  const sampleWasLimited = Boolean(
    statisticalSamplesInfo.sampled ||
      (Number.isFinite(sampleMax) && Number.isFinite(sampleTotalRows) && sampleTotalRows > sampleCount)
  )

  const estimatedTotalRows = useMemo(() => {
    if (Number.isFinite(sampleTotalRows) && sampleTotalRows > 0) {
      return sampleTotalRows
    }
    return columns.reduce((max, column) => {
      const total = (column.filledCount ?? 0) + (column.emptyCount ?? 0)
      return total > max ? total : max
    }, 0)
  }, [columns, sampleTotalRows])

  const displayTotalRows = estimatedTotalRows > 0 ? estimatedTotalRows : sampleCount

  const numericTargetOptions = useMemo(
    () =>
      columns.filter(
        (column) => column.type === 'number' && (column.statistics?.numeric?.count ?? column.numericCount ?? 0) >= 2
      ),
    [columns]
  )

  const stringTargetOptions = useMemo(
    () =>
      columns.filter(
        (column) =>
          column.type === 'string' && (categoricalDistributions[column.key]?.categories?.length ?? 0) >= 2
      ),
    [columns, categoricalDistributions]
  )

  const targetColumnOptions = useMemo(
    () => [...numericTargetOptions, ...stringTargetOptions],
    [numericTargetOptions, stringTargetOptions]
  )

  const segmentColumnOptions = stringTargetOptions

  useEffect(() => {
    if (targetColumnOptions.length === 0) {
      if (targetColumnKey) {
        setTargetColumnKey('')
      }
      return
    }
    if (!targetColumnOptions.some((column) => column.key === targetColumnKey)) {
      const fallback = numericTargetOptions[0] || targetColumnOptions[0]
      if (fallback?.key !== targetColumnKey) {
        setTargetColumnKey(fallback?.key || '')
      }
    }
  }, [targetColumnOptions, numericTargetOptions, targetColumnKey])

  useEffect(() => {
    if (segmentColumnOptions.length === 0) {
      if (segmentColumnKey) {
        setSegmentColumnKey('')
      }
      return
    }
    if (!segmentColumnOptions.some((column) => column.key === segmentColumnKey)) {
      const fallback = segmentColumnOptions[0]
      if (fallback?.key !== segmentColumnKey) {
        setSegmentColumnKey(fallback?.key || '')
      }
    }
  }, [segmentColumnOptions, segmentColumnKey])

  useEffect(() => {
    if (!segmentColumnKey) {
      if (selectedSegmentValues.length > 0) {
        setSelectedSegmentValues([])
      }
      return
    }
    const categories = categoricalDistributions[segmentColumnKey]?.categories || []
    if (categories.length === 0) {
      if (selectedSegmentValues.length > 0) {
        setSelectedSegmentValues([])
      }
      return
    }
    setSelectedSegmentValues((prev) => {
      const allowed = categories.map((category) => category.value)
      const filtered = prev.filter((value) => allowed.includes(value))
      if (filtered.length === 0) {
        return categories
          .slice(0, Math.min(2, categories.length))
          .map((category) => category.value)
      }
      if (filtered.length === prev.length && filtered.every((value, index) => value === prev[index])) {
        return prev
      }
      return filtered
    })
  }, [segmentColumnKey, categoricalDistributions, selectedSegmentValues])

  useEffect(() => {
    const targetColumn = columns.find((column) => column.key === targetColumnKey)
    if (!targetColumn || targetColumn.type !== 'string') {
      if (selectedTargetCategory) {
        setSelectedTargetCategory('')
      }
      return
    }
    const categories = categoricalDistributions[targetColumnKey]?.categories || []
    if (categories.length === 0) {
      if (selectedTargetCategory) {
        setSelectedTargetCategory('')
      }
      return
    }
    if (!categories.some((category) => category.value === selectedTargetCategory)) {
      const defaultCategory = categories[0]?.value || ''
      if (defaultCategory !== selectedTargetCategory) {
        setSelectedTargetCategory(defaultCategory)
      }
    }
  }, [columns, targetColumnKey, categoricalDistributions, selectedTargetCategory])

  const targetColumn = useMemo(
    () => columns.find((column) => column.key === targetColumnKey) || null,
    [columns, targetColumnKey]
  )

  const segmentColumn = useMemo(
    () => columns.find((column) => column.key === segmentColumnKey) || null,
    [columns, segmentColumnKey]
  )

  const segmentDistribution = segmentColumnKey ? categoricalDistributions[segmentColumnKey] || null : null
  const targetDistribution = targetColumn?.type === 'string' ? categoricalDistributions[targetColumnKey] || null : null

  const segmentLabelMap = useMemo(() => {
    if (!segmentDistribution?.categories) {
      return {}
    }
    const map = {}
    segmentDistribution.categories.forEach((category) => {
      map[category.value] = category.label
    })
    return map
  }, [segmentDistribution])

  const categoryLabelMap = useMemo(() => {
    if (!targetDistribution?.categories) {
      return {}
    }
    const map = {}
    targetDistribution.categories.forEach((category) => {
      map[category.value] = category.label
    })
    return map
  }, [targetDistribution])

  const formatPValue = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '–'
    }
    if (value < 0.0001) {
      return '< 0,0001'
    }
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    })
  }

  const handleSegmentToggle = (value) => {
    if (!segmentDistribution?.categories?.length) {
      return
    }
    setSelectedSegmentValues((prev) => {
      const allowed = new Set(segmentDistribution.categories.map((category) => category.value))
      if (!allowed.has(value)) {
        return prev
      }
      const nextSet = new Set(prev)
      if (nextSet.has(value)) {
        nextSet.delete(value)
      } else {
        nextSet.add(value)
      }
      const ordered = segmentDistribution.categories
        .map((category) => category.value)
        .filter((categoryValue) => nextSet.has(categoryValue))
      return ordered
    })
  }

  const segmentTestResult = useMemo(() => {
    if (!targetColumn || !segmentColumn) {
      return { ok: false, reason: 'Bitte wählen Sie Ziel- und Segmentspalte.' }
    }
    if (!Array.isArray(statisticalSamples) || statisticalSamples.length === 0) {
      return { ok: false, reason: 'Für die Tests liegen keine Stichprobendaten vor.' }
    }
    if (!segmentDistribution?.categories?.length) {
      return { ok: false, reason: 'Die gewählte Segmentspalte enthält keine auswertbaren Kategorien.' }
    }
    const validSegments = selectedSegmentValues.filter((value) =>
      segmentDistribution.categories.some((category) => category.value === value)
    )
    if (validSegments.length < 2) {
      return { ok: false, reason: 'Wählen Sie mindestens zwei Segmentwerte aus.' }
    }
    const targetType = targetColumn.type === 'number' ? 'number' : 'string'
    let resolvedTargetCategory = ''
    if (targetType === 'string') {
      const categories = targetDistribution?.categories || []
      if (categories.length === 0) {
        return { ok: false, reason: 'Für die Zielspalte sind keine Kategorien verfügbar.' }
      }
      resolvedTargetCategory =
        categories.find((category) => category.value === selectedTargetCategory)?.value || categories[0]?.value || ''
    }
    return computeSegmentTest({
      samples: statisticalSamples,
      targetColumnKey: targetColumn.key,
      targetType,
      segmentColumnKey: segmentColumn.key,
      selectedSegmentValues: validSegments,
      targetCategory: resolvedTargetCategory,
      segmentLabelMap,
      categoryLabelMap,
      significanceLevel: 0.05
    })
  }, [
    targetColumn,
    segmentColumn,
    statisticalSamples,
    selectedSegmentValues,
    segmentDistribution,
    targetDistribution,
    selectedTargetCategory,
    segmentLabelMap,
    categoryLabelMap
  ])

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

          <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3 text-[11px] text-dark-textGray">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-dark-textLight">Vergleichende Tests</h4>
                <p className="text-xs text-dark-textGray">
                  Hypothesentests auf Basis der Profiling-Stichprobe für ausgewählte Ziel- und Segmentspalten.
                </p>
              </div>
              <div className="text-right">
                <div>
                  Stichprobe: {sampleCount.toLocaleString('de-DE')} / {displayTotalRows.toLocaleString('de-DE')}
                </div>
                {sampleWasLimited && (
                  <div className="text-[10px] text-dark-textGray">
                    max. {sampleMax.toLocaleString('de-DE')} Zeilen berücksichtigt
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-dark-textGray">Zielspalte</span>
                <select
                  value={targetColumnKey}
                  onChange={(event) => setTargetColumnKey(event.target.value)}
                  className="rounded border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                >
                  <option value="">–</option>
                  {targetColumnOptions.map((column) => (
                    <option key={`target-option-${column.key}`} value={column.key}>
                      {column.key}
                      {column.type === 'number' ? ' · Zahl' : ' · Text'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-dark-textGray">Segmentspalte</span>
                <select
                  value={segmentColumnKey}
                  onChange={(event) => setSegmentColumnKey(event.target.value)}
                  className="rounded border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                >
                  <option value="">–</option>
                  {segmentColumnOptions.map((column) => (
                    <option key={`segment-option-${column.key}`} value={column.key}>
                      {column.key}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {segmentDistribution?.categories?.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex flex-wrap items-center justify-between text-[10px] text-dark-textGray">
                  <span className="uppercase tracking-wide">Segmentwerte</span>
                  <span>
                    {Number.isFinite(segmentDistribution.totalCount)
                      ? segmentDistribution.totalCount.toLocaleString('de-DE')
                      : '–'}{' '}
                    Werte
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {segmentDistribution.categories.map((category) => {
                    const isSelected = selectedSegmentValues.includes(category.value)
                    return (
                      <button
                        type="button"
                        key={`segment-value-${category.value || 'empty'}`}
                        onClick={() => handleSegmentToggle(category.value)}
                        className={`rounded-full border px-2 py-1 transition-colors ${
                          isSelected
                            ? 'border-dark-accent1 bg-dark-accent1/20 text-dark-textLight'
                            : 'border-gray-700 text-dark-textGray hover:border-dark-accent1 hover:text-dark-textLight'
                        }`}
                      >
                        <span>{category.label}</span>
                        <span className="ml-1 text-[10px] text-dark-textGray">
                          ({category.count.toLocaleString('de-DE')})
                        </span>
                      </button>
                    )
                  })}
                </div>
                {segmentDistribution.truncated && (
                  <p className="mt-1 text-[10px] text-yellow-200">
                    Weitere Segmentausprägungen wurden aus Performance-Gründen ausgeblendet.
                  </p>
                )}
              </div>
            )}

            {targetColumn?.type === 'string' && targetDistribution?.categories?.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wide text-dark-textGray">Zielkategorie</span>
                  <select
                    value={selectedTargetCategory}
                    onChange={(event) => setSelectedTargetCategory(event.target.value)}
                    className="rounded border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                  >
                    {targetDistribution.categories.map((category) => (
                      <option key={`target-category-${category.value || 'empty'}`} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="self-end text-[10px] text-dark-textGray">
                  Zwei Segmente → Z-Test (Anteile); mehrere Segmente/Zielkategorien → Chi²-Test.
                </div>
              </div>
            )}

            <div className="mt-3 rounded border border-gray-700 bg-dark-bg/60 p-2">
              {segmentTestResult.ok ? (
                <>
                  <div className="text-sm font-semibold text-dark-textLight">{segmentTestResult.testName}</div>
                  <div className="mt-1 text-[11px] text-dark-textGray">
                    {segmentTestResult.statisticLabel} = {formatStatNumber(segmentTestResult.statistic)}
                    {Number.isFinite(segmentTestResult.degreesOfFreedom) && (
                      <>
                        {' '}
                        · df ={' '}
                        {segmentTestResult.degreesOfFreedom.toLocaleString('de-DE', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        })}
                      </>
                    )}{' '}
                    · p = {formatPValue(segmentTestResult.pValue)}
                  </div>
                  <div
                    className={`mt-1 text-[11px] ${
                      Number.isFinite(segmentTestResult.pValue) && segmentTestResult.pValue < 0.05
                        ? 'text-green-300'
                        : 'text-dark-textLight'
                    }`}
                  >
                    {segmentTestResult.interpretation}
                  </div>
                  {segmentTestResult.effectSize !== undefined &&
                    segmentTestResult.effectLabel &&
                    Number.isFinite(segmentTestResult.effectSize) && (
                      <div className="mt-1 text-[10px] text-dark-textGray">
                        Δ {segmentTestResult.effectLabel}: {formatStatNumber(segmentTestResult.effectSize)}
                      </div>
                    )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {segmentTestResult.groups?.map((group) => (
                      <div
                        key={`segment-summary-${group.value}`}
                        className="rounded border border-gray-700 bg-dark-secondary/20 p-2"
                      >
                        <div className="text-[11px] font-semibold text-dark-textLight">{group.label}</div>
                        <div className="text-[10px] text-dark-textGray">
                          n = {Number(group.sampleSize).toLocaleString('de-DE')}
                        </div>
                        {segmentTestResult.testType === 'welch-t' && (
                          <>
                            <div className="text-[11px] text-dark-textLight">Ø {formatStatNumber(group.mean)}</div>
                            <div className="text-[10px] text-dark-textGray">
                              σ = {formatStatNumber(group.stdDev)}
                            </div>
                          </>
                        )}
                        {segmentTestResult.testType === 'two-proportion-z' && (
                          <div className="text-[11px] text-dark-textLight">
                            Anteil „{segmentTestResult.targetCategoryLabel}“:{' '}
                            {formatStatPercentage(group.successRatio)} ({Number(group.successCount).toLocaleString('de-DE')})
                          </div>
                        )}
                        {segmentTestResult.testType === 'chi-square' && (
                          <div className="mt-1 space-y-1 text-[10px]">
                            {group.topCategories?.slice(0, 3).map((entry) => (
                              <div
                                key={`segment-top-${group.value}-${entry.value}`}
                                className="flex justify-between"
                              >
                                <span className="text-dark-textLight">{entry.label}</span>
                                <span className="text-dark-textGray">
                                  {Number(entry.count).toLocaleString('de-DE')} · {formatStatPercentage(entry.ratio)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {segmentTestResult.warnings?.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-[10px] text-yellow-200">
                      {segmentTestResult.warnings.map((warning, index) => (
                        <li key={`segment-warning-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <div className="text-[11px] text-yellow-200">
                  {segmentTestResult.reason || 'Keine gültigen Kombinationen für einen Test verfügbar.'}
                  {segmentTestResult.warnings?.length > 0 && (
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-[10px] text-yellow-200">
                      {segmentTestResult.warnings.map((warning, index) => (
                        <li key={`segment-warning-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 rounded bg-dark-secondary/30 p-2 text-[10px] text-dark-textGray">
              <div className="text-[11px] font-semibold text-dark-textLight">Hinweis</div>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>Welch-t-Test: Mittelwertvergleich zweier Segmente für numerische Zielspalten.</li>
                <li>Z-Test: Anteilsvergleich einer Zielkategorie bei zwei Segmenten.</li>
                <li>Chi²-Test: Unabhängigkeitstest bei mehreren Segmenten oder Zielkategorien.</li>
              </ul>
              <p className="mt-1">
                Berechnungen basieren auf der Profiling-Stichprobe ({sampleCount.toLocaleString('de-DE')} Zeilen, max.{' '}
                {sampleMax.toLocaleString('de-DE')}). Niedrige Stichprobengrößen mindern die Aussagekraft.
              </p>
            </div>
          </div>
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

