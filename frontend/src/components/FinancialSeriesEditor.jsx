import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { FiPlus, FiTrash2, FiTrendingUp, FiCopy, FiRefreshCw } from 'react-icons/fi'
import EnhancedColorPicker from './EnhancedColorPicker'

const clampNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const createDefaultPoint = (label, previousPoint) => {
  const reference = previousPoint?.close ?? previousPoint?.open ?? 100
  const open = clampNumber(previousPoint?.close ?? reference)
  const close = clampNumber(reference + 2)
  const high = Math.max(open, close) + 3
  const low = Math.min(open, close) - 3

  return {
    label: label || 'Periode',
    open,
    high,
    low,
    close
  }
}

const ensureValueEntry = (serie, index, labels) => {
  const values = Array.isArray(serie?.values) ? [...serie.values] : []
  if (values[index]) {
    return values[index]
  }
  const previous = values[index - 1]
  return createDefaultPoint(labels[index], previous)
}

const ensureSeriesAligned = (series, labels) => {
  const safeLabels = Array.isArray(labels) ? labels : []
  return series.map((serie) => {
    const values = Array.isArray(serie?.values) ? [...serie.values] : []
    const alignedValues = safeLabels.map((label, index) => {
      const current = values[index]
      if (!current) {
        const previous = alignedValues[index - 1] || values[index - 1]
        return createDefaultPoint(label, previous)
      }
      return {
        label: current.label ?? label,
        open: clampNumber(current.open, 0),
        high: clampNumber(current.high ?? current.open ?? 0, 0),
        low: clampNumber(current.low ?? current.open ?? 0, 0),
        close: clampNumber(current.close ?? current.open ?? 0, 0)
      }
    })

    return {
      name: serie?.name || 'Serie',
      color: serie?.color || '#38BDF8',
      borderColor: serie?.borderColor || serie?.color || '#0EA5E9',
      values: alignedValues
    }
  })
}

const collectLabelsFromSeries = (series) => {
  const labels = []
  series.forEach((serie) => {
    serie.values?.forEach((value) => {
      const key = value?.label?.trim()
      if (key && !labels.includes(key)) {
        labels.push(key)
      }
    })
  })
  return labels
}

const statsForSerie = (serie) => {
  const values = Array.isArray(serie?.values) ? serie.values : []
  if (values.length === 0) {
    return { min: 0, max: 0, delta: 0 }
  }
  const allNumbers = values.flatMap((value) => [value.open, value.high, value.low, value.close])
  const filtered = allNumbers.filter((entry) => Number.isFinite(entry))
  if (filtered.length === 0) {
    return { min: 0, max: 0, delta: 0 }
  }
  const min = Math.min(...filtered)
  const max = Math.max(...filtered)
  return { min, max, delta: clampNumber(values[values.length - 1]?.close - values[0]?.open, 0) }
}

export default function FinancialSeriesEditor({
  labels = [],
  series = [],
  onLabelsChange,
  onSeriesChange
}) {
  const safeLabels = useMemo(() => (Array.isArray(labels) && labels.length > 0 ? labels : collectLabelsFromSeries(series)), [labels, series])
  const alignedSeries = useMemo(() => ensureSeriesAligned(Array.isArray(series) ? series : [], safeLabels), [series, safeLabels])

  const emitChanges = (nextSeries, nextLabels = safeLabels) => {
    const sanitizedLabels = nextLabels.filter((label) => label && label.trim().length > 0)
    onLabelsChange(sanitizedLabels)
    onSeriesChange(nextSeries)
  }

  const handleAddLabel = () => {
    const label = `Periode ${safeLabels.length + 1}`
    const extendedLabels = [...safeLabels, label]
    const updatedSeries = alignedSeries.map((serie) => ({
      ...serie,
      values: [...serie.values, createDefaultPoint(label, serie.values[serie.values.length - 1])]
    }))
    emitChanges(updatedSeries, extendedLabels)
  }

  const handleDuplicateLabel = (index) => {
    const originalLabel = safeLabels[index]
    if (!originalLabel) return
    const duplicateLabel = `${originalLabel} (neu)`
    const newLabels = [...safeLabels]
    newLabels.splice(index + 1, 0, duplicateLabel)
    const updatedSeries = alignedSeries.map((serie) => {
      const values = [...serie.values]
      const point = { ...values[index], label: duplicateLabel }
      values.splice(index + 1, 0, point)
      return { ...serie, values }
    })
    emitChanges(updatedSeries, newLabels)
  }

  const handleRemoveLabel = (index) => {
    if (safeLabels.length <= 1) return
    const newLabels = safeLabels.filter((_, idx) => idx !== index)
    const updatedSeries = alignedSeries.map((serie) => ({
      ...serie,
      values: serie.values.filter((_, idx) => idx !== index)
    }))
    emitChanges(updatedSeries, newLabels)
  }

  const handleLabelChange = (index, value) => {
    const newLabels = [...safeLabels]
    newLabels[index] = value
    const updatedSeries = alignedSeries.map((serie) => {
      const values = [...serie.values]
      values[index] = {
        ...values[index],
        label: value
      }
      return { ...serie, values }
    })
    emitChanges(updatedSeries, newLabels)
  }

  const handleAddSeries = () => {
    const nextIndex = alignedSeries.length + 1
    const newValues = []
    safeLabels.forEach((label, idx) => {
      const previous = idx > 0 ? newValues[idx - 1] : null
      newValues.push(createDefaultPoint(label, previous))
    })
    const newSerie = {
      name: `Serie ${nextIndex}`,
      color: nextIndex % 2 === 0 ? '#F472B6' : '#38BDF8',
      borderColor: nextIndex % 2 === 0 ? '#EC4899' : '#0EA5E9',
      values: newValues
    }
    emitChanges([...alignedSeries, newSerie])
  }

  const handleRemoveSeries = (index) => {
    if (alignedSeries.length <= 1) return
    const updated = alignedSeries.filter((_, idx) => idx !== index)
    emitChanges(updated)
  }

  const handleSeriePropertyChange = (index, property, value) => {
    const updated = alignedSeries.map((serie, idx) => {
      if (idx !== index) return serie
      return { ...serie, [property]: value }
    })
    emitChanges(updated)
  }

  const handleValueChange = (seriesIndex, labelIndex, key, value) => {
    const updated = alignedSeries.map((serie, idx) => {
      if (idx !== seriesIndex) return serie
      const values = [...serie.values]
      const current = ensureValueEntry(serie, labelIndex, safeLabels)
      values[labelIndex] = {
        ...current,
        [key]: clampNumber(value, current[key])
      }
      return { ...serie, values }
    })
    emitChanges(updated)
  }

  const handleAutoAdjust = (seriesIndex, labelIndex) => {
    const updated = alignedSeries.map((serie, idx) => {
      if (idx !== seriesIndex) return serie
      const values = [...serie.values]
      const current = ensureValueEntry(serie, labelIndex, safeLabels)
      const referenceHigh = Math.max(current.open, current.close, current.high)
      const referenceLow = Math.min(current.open, current.close, current.low)
      values[labelIndex] = {
        ...current,
        high: referenceHigh,
        low: referenceLow
      }
      return { ...serie, values }
    })
    emitChanges(updated)
  }

  const handleResetValues = (seriesIndex) => {
    const updated = alignedSeries.map((serie, idx) => {
      if (idx !== seriesIndex) return serie
      return {
        ...serie,
        values: serie.values.map((value, valueIndex) => createDefaultPoint(safeLabels[valueIndex], valueIndex > 0 ? serie.values[valueIndex - 1] : null))
      }
    })
    emitChanges(updated)
  }

  return (
    <div className="space-y-5">
      <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight flex items-center gap-2">
              <FiTrendingUp /> Zeitachse
            </h3>
            <p className="text-xs text-dark-textGray">Definiere die Zeitabschnitte, die für alle Finanzserien genutzt werden.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddLabel}
              className="px-3 py-2 rounded-md bg-dark-accent1 hover:bg-dark-accent2 text-white text-xs transition-colors"
            >
              <FiPlus className="inline mr-1" /> Periode
            </button>
          </div>
        </div>

        {safeLabels.length === 0 ? (
          <div className="text-sm text-dark-textGray bg-dark-bg rounded-lg p-4 text-center">
            Keine Zeitabschnitte vorhanden. Füge über "Periode" neue Abschnitte hinzu.
          </div>
        ) : (
          <div className="space-y-2">
            {safeLabels.map((label, index) => (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 bg-dark-bg border border-gray-700 rounded-lg p-3"
              >
                <input
                  type="text"
                  value={label}
                  onChange={(event) => handleLabelChange(index, event.target.value)}
                  className="flex-1 min-w-[160px] px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                />
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleDuplicateLabel(index)}
                    className="px-3 py-1 rounded bg-dark-bg border border-gray-700 hover:border-dark-accent1 text-dark-textGray hover:text-dark-textLight"
                  >
                    <FiCopy className="inline mr-1" /> Duplizieren
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(index)}
                    disabled={safeLabels.length <= 1}
                    className="px-3 py-1 rounded bg-red-900/40 border border-red-900/60 text-red-200 hover:bg-red-800/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiTrash2 className="inline mr-1" /> Entfernen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-dark-textLight">Finanzserien ({alignedSeries.length})</h3>
          <p className="text-xs text-dark-textGray">Bearbeite Werte pro Serie. Hohe und niedrige Werte werden automatisch kontrolliert.</p>
        </div>
        <button
          type="button"
          onClick={handleAddSeries}
          className="px-3 py-2 rounded-md bg-dark-accent1 hover:bg-dark-accent2 text-white text-xs transition-colors"
        >
          <FiPlus className="inline mr-1" /> Serie
        </button>
      </div>

      {alignedSeries.map((serie, seriesIndex) => {
        const stats = statsForSerie(serie)
        return (
          <div key={seriesIndex} className="bg-dark-sidebar border border-gray-700 rounded-lg">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-700 p-4">
              <div className="flex-1 min-w-[240px] space-y-2">
                <input
                  type="text"
                  value={serie.name}
                  onChange={(event) => handleSeriePropertyChange(seriesIndex, 'name', event.target.value)}
                  className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  placeholder="Serienname"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <EnhancedColorPicker
                    value={serie.color}
                    onChange={(value) => handleSeriePropertyChange(seriesIndex, 'color', value)}
                    label="Farbe"
                    size="md"
                  />
                  <EnhancedColorPicker
                    value={serie.borderColor}
                    onChange={(value) => handleSeriePropertyChange(seriesIndex, 'borderColor', value)}
                    label="Linienfarbe"
                    size="md"
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs text-dark-textGray">
                <div className="bg-dark-bg rounded px-3 py-2 border border-gray-700">
                  <div>Min: <span className="text-dark-textLight font-medium">{stats.min}</span></div>
                  <div>Max: <span className="text-dark-textLight font-medium">{stats.max}</span></div>
                  <div>Δ Close: <span className="text-dark-textLight font-medium">{stats.delta}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResetValues(seriesIndex)}
                    className="px-3 py-1 rounded bg-dark-bg border border-gray-700 hover:border-dark-accent1 text-dark-textGray hover:text-dark-textLight"
                  >
                    <FiRefreshCw className="inline mr-1" /> Werte zurücksetzen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSeries(seriesIndex)}
                    disabled={alignedSeries.length <= 1}
                    className="px-3 py-1 rounded bg-red-900/40 border border-red-900/60 text-red-200 hover:bg-red-800/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiTrash2 className="inline mr-1" /> Serie löschen
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-dark-textLight">
                <thead className="bg-dark-bg/80">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium">Periode</th>
                    <th className="px-4 py-2 font-medium">Open</th>
                    <th className="px-4 py-2 font-medium">High</th>
                    <th className="px-4 py-2 font-medium">Low</th>
                    <th className="px-4 py-2 font-medium">Close</th>
                    <th className="px-4 py-2 font-medium text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {safeLabels.map((label, labelIndex) => {
                    const current = serie.values[labelIndex] || ensureValueEntry(serie, labelIndex, safeLabels)
                    return (
                      <tr key={labelIndex} className="border-t border-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap text-dark-textGray">{label}</td>
                        {(['open', 'high', 'low', 'close']).map((key) => (
                          <td key={key} className="px-4 py-2">
                            <input
                              type="number"
                              value={current[key] ?? 0}
                              onChange={(event) => handleValueChange(seriesIndex, labelIndex, key, event.target.value)}
                              className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleAutoAdjust(seriesIndex, labelIndex)}
                            className="px-3 py-1 rounded bg-dark-bg border border-gray-700 hover:border-dark-accent1 text-dark-textGray hover:text-dark-textLight"
                          >
                            Werte prüfen
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

FinancialSeriesEditor.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string),
  series: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    color: PropTypes.string,
    borderColor: PropTypes.string,
    values: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string,
      open: PropTypes.number,
      high: PropTypes.number,
      low: PropTypes.number,
      close: PropTypes.number
    }))
  })),
  onLabelsChange: PropTypes.func.isRequired,
  onSeriesChange: PropTypes.func.isRequired
}
