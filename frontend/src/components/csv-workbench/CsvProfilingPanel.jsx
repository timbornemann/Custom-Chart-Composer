import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { formatStatNumber, formatStatPercentage, formatSamplePreview, formatCorrelationValue } from '../csv/formatting'

export default function CsvProfilingPanel({ columns, profilingMeta }) {
  const [profilingColumnKey, setProfilingColumnKey] = useState(columns[0]?.key || null)
  const [correlationSelectedColumns, setCorrelationSelectedColumns] = useState([])
  const [correlationThreshold, setCorrelationThreshold] = useState(0)
  const [correlationSortKey, setCorrelationSortKey] = useState('')
  const [hoveredCorrelationCell, setHoveredCorrelationCell] = useState(null)

  const profilingColumn = useMemo(
    () => columns.find((column) => column.key === profilingColumnKey) || null,
    [columns, profilingColumnKey]
  )

  const profilingFilledCount = profilingColumn?.filledCount ?? 0
  const profilingEmptyCount = profilingColumn?.emptyCount ?? 0
  const profilingNumericStats = profilingColumn?.statistics?.numeric ?? null
  const profilingTextStats = profilingColumn?.statistics?.text ?? null
  const hasNumericStats = Boolean(profilingNumericStats)
  const hasTextFrequencies = Boolean(profilingTextStats?.topValues?.length)
  const profilingTotalCount = profilingFilledCount + profilingEmptyCount
  const profilingFilledRatio = profilingTotalCount > 0 ? profilingFilledCount / profilingTotalCount : null

  const correlationMatrix = profilingMeta?.correlationMatrix || null

  const correlationColorForValue = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 'transparent'
    const intensity = Math.min(1, Math.abs(value))
    const opacity = 0.12 + intensity * 0.35
    if (value > 0) return `rgba(34, 197, 94, ${opacity})`
    if (value < 0) return `rgba(239, 68, 68, ${opacity})`
    return 'transparent'
  }

  if (columns.length === 0) {
    return (
      <div className="text-xs text-dark-textGray">
        Keine Spalten verfügbar für Profiling
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-dark-textLight mb-2">Spaltenprofil</h3>
        <p className="text-xs text-dark-textGray mb-3">
          Statistiken und Korrelation
        </p>
      </div>

      {/* Column Selector */}
      <select
        value={profilingColumnKey || ''}
        onChange={(e) => setProfilingColumnKey(e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
      >
        {columns.map((col) => (
          <option key={col.key} value={col.key}>{col.key}</option>
        ))}
      </select>

      {/* Stats */}
      {profilingColumn && (
        <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-dark-textGray">Typ:</span>
              <span className="text-dark-textLight">{profilingColumn.type === 'number' ? 'Zahl' : 'Text'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-textGray">Ausgefüllt:</span>
              <span className="text-dark-textLight">
                {profilingFilledCount} / {profilingTotalCount}
                {profilingFilledRatio !== null && profilingTotalCount > 0 && (
                  <span className="ml-1 text-dark-textGray">({formatStatPercentage(profilingFilledRatio)})</span>
                )}
              </span>
            </div>
            
            {hasNumericStats && (
              <>
                <div className="flex justify-between">
                  <span className="text-dark-textGray">Min:</span>
                  <span className="text-dark-textLight">{formatStatNumber(profilingNumericStats.min)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-textGray">Max:</span>
                  <span className="text-dark-textLight">{formatStatNumber(profilingNumericStats.max)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-textGray">Durchschnitt:</span>
                  <span className="text-dark-textLight">{formatStatNumber(profilingNumericStats.mean)}</span>
                </div>
              </>
            )}

            {hasTextFrequencies && (
              <div className="mt-2">
                <div className="text-[11px] font-semibold text-dark-textGray mb-1">Häufigste Werte:</div>
                {profilingTextStats.topValues.slice(0, 3).map((entry, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-dark-textLight truncate">{entry.value || '(leer)'}</span>
                    <span className="text-dark-textGray">{entry.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Correlation Matrix (compact) */}
      {correlationMatrix && correlationMatrix.columns?.length > 1 && (
        <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
          <h4 className="text-sm font-semibold text-dark-textLight mb-2">Korrelation</h4>
          <p className="text-xs text-dark-textGray mb-3">
            Pearson-Korrelation zwischen numerischen Spalten
          </p>
          <div className="text-xs text-dark-textGray">
            {correlationMatrix.columns.length} Spalten analysiert
          </div>
        </div>
      )}
    </div>
  )
}

CsvProfilingPanel.propTypes = {
  columns: PropTypes.array.isRequired,
  profilingMeta: PropTypes.object
}

