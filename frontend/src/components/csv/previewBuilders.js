import {
  SUGGESTION_PREVIEW_COLORS,
  SUGGESTION_PREVIEW_MAX_CATEGORIES,
  SUGGESTION_PREVIEW_MAX_DATASETS,
  SUGGESTION_PREVIEW_MAX_POINTS
} from './constants'
import { formatPreviewLabel, parsePreviewNumber, formatSamplePreview } from './formatting'

const sampleSuggestionEntries = (entries, limit) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return []
  }
  if (!limit || entries.length <= limit) {
    return entries
  }
  if (limit <= 1) {
    return [entries[0]]
  }
  const step = (entries.length - 1) / (limit - 1)
  const result = []
  for (let index = 0; index < limit; index += 1) {
    const rawPosition = Math.round(index * step)
    const clamped = Math.min(entries.length - 1, Math.max(0, rawPosition))
    const entry = entries[clamped]
    if (entry) {
      result.push(entry)
    }
  }
  return result
}

const ensureDatasetLength = (dataset, length) => {
  while (dataset.data.length < length) {
    dataset.data.push(null)
  }
}

const ensureAllDatasetsLength = (datasets, length) => {
  datasets.forEach((dataset) => ensureDatasetLength(dataset, length))
}

const convertMetaMapToObject = (metaMap) => {
  const result = {}
  metaMap.forEach((value, key) => {
    result[key] = value
  })
  return result
}

export const createPreviewChartType = (id, name) => ({ id, name, configSchema: {} })

export const getPreviewColor = (index) => SUGGESTION_PREVIEW_COLORS[index % SUGGESTION_PREVIEW_COLORS.length]

export const buildMultiValuePreview = (entries, source, selection, chartHint) => {
  const labelKey = selection?.label
  const valueKeys = Array.isArray(selection?.values)
    ? selection.values.filter(Boolean)
    : selection?.values
      ? [selection.values]
      : []

  if (!labelKey || valueKeys.length === 0) {
    return null
  }

  const sampled = sampleSuggestionEntries(entries, SUGGESTION_PREVIEW_MAX_POINTS)
  if (sampled.length === 0) {
    return null
  }

  const labels = []
  const labelIndexMap = new Map()
  const datasets = valueKeys.map((key, index) => ({
    key,
    label: key,
    data: [],
    backgroundColor: getPreviewColor(index),
    borderColor: getPreviewColor(index),
    metaMap: new Map()
  }))

  sampled.forEach((entry) => {
    const row = entry.row || {}
    const label = formatPreviewLabel(row[labelKey])
    if (!labelIndexMap.has(label)) {
      if (labels.length >= SUGGESTION_PREVIEW_MAX_CATEGORIES) {
        return
      }
      labelIndexMap.set(label, labels.length)
      labels.push(label)
      ensureAllDatasetsLength(datasets, labels.length)
    }
    const labelIndex = labelIndexMap.get(label)
    valueKeys.forEach((valueKey, datasetIndex) => {
      const dataset = datasets[datasetIndex]
      const numeric = parsePreviewNumber(row[valueKey])
      if (numeric === null) {
        return
      }
      if (dataset.data[labelIndex] === null || dataset.data[labelIndex] === undefined) {
        dataset.data[labelIndex] = numeric
      } else {
        dataset.data[labelIndex] += numeric
      }
      if (!dataset.metaMap.has(labelIndex)) {
        dataset.metaMap.set(labelIndex, { source, rowIndex: entry.index })
      }
    })
  })

  const hasValues = datasets.some((dataset) => dataset.data.some((value) => value !== null && value !== undefined))
  if (!hasValues || labels.length === 0) {
    return null
  }

  const chartDatasets = datasets.map((dataset) => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: dataset.backgroundColor,
    borderColor: dataset.borderColor,
    borderWidth: 1
  }))

  const pointMeta = datasets.map((dataset) => convertMetaMapToObject(dataset.metaMap))

  return {
    chartType: createPreviewChartType('groupedBar', chartHint || 'Mehrere Werte'),
    config: {
      labels,
      datasets: chartDatasets,
      options: {
        showLegend: chartDatasets.length > 1,
        animation: false,
        aspectRatio: labels.length > 8 ? 2 : 1.4
      }
    },
    pointMeta
  }
}

export const buildSingleValuePreview = (entries, source, selection, chartHint) => {
  const labelKey = selection?.label
  const valueKey = selection?.value || (Array.isArray(selection?.values) ? selection.values[0] : null)
  if (!labelKey || !valueKey) {
    return null
  }

  const sampled = sampleSuggestionEntries(entries, SUGGESTION_PREVIEW_MAX_POINTS)
  if (sampled.length === 0) {
    return null
  }

  const aggregates = new Map()
  sampled.forEach((entry) => {
    const row = entry.row || {}
    const label = formatPreviewLabel(row[labelKey])
    const numeric = parsePreviewNumber(row[valueKey])
    if (numeric === null) {
      return
    }
    const existing = aggregates.get(label)
    if (existing) {
      existing.value += numeric
    } else if (aggregates.size < SUGGESTION_PREVIEW_MAX_CATEGORIES) {
      aggregates.set(label, { value: numeric, rowIndex: entry.index })
    }
  })

  if (aggregates.size === 0) {
    return null
  }

  const maxSlices = Math.min(12, SUGGESTION_PREVIEW_MAX_CATEGORIES)
  const sorted = Array.from(aggregates.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, maxSlices)

  const labels = sorted.map(([label]) => label)
  const values = sorted.map(([, data]) => data.value)
  const pointMeta = [sorted.reduce((accumulator, [, data], index) => {
    accumulator[index] = { source, rowIndex: data.rowIndex }
    return accumulator
  }, {})]

  return {
    chartType: createPreviewChartType('donut', chartHint || 'Einzelwert'),
    config: {
      labels,
      values,
      colors: labels.map((_, index) => getPreviewColor(index)),
      options: {
        animation: false,
        showLegend: labels.length <= 8
      }
    },
    pointMeta
  }
}

export const buildLongFormatPreview = (entries, source, selection, chartHint) => {
  const labelKey = selection?.label
  const valueKey = selection?.value
  const datasetKey = selection?.dataset
  if (!labelKey || !valueKey || !datasetKey) {
    return null
  }

  const sampled = sampleSuggestionEntries(entries, SUGGESTION_PREVIEW_MAX_POINTS)
  if (sampled.length === 0) {
    return null
  }

  const labels = []
  const labelIndexMap = new Map()
  const datasets = new Map()

  sampled.forEach((entry) => {
    const row = entry.row || {}
    const label = formatPreviewLabel(row[labelKey])
    if (!labelIndexMap.has(label)) {
      if (labels.length >= SUGGESTION_PREVIEW_MAX_CATEGORIES) {
        return
      }
      labelIndexMap.set(label, labels.length)
      labels.push(label)
      datasets.forEach((dataset) => ensureDatasetLength(dataset, labels.length))
    }
    const labelIndex = labelIndexMap.get(label)
    const datasetLabel = formatSamplePreview(row[datasetKey])
    let dataset = datasets.get(datasetLabel)
    if (!dataset) {
      if (datasets.size >= SUGGESTION_PREVIEW_MAX_DATASETS) {
        return
      }
      const color = getPreviewColor(datasets.size)
      dataset = {
        key: datasetLabel,
        label: datasetLabel,
        data: Array(labels.length).fill(null),
        backgroundColor: color,
        borderColor: color,
        metaMap: new Map()
      }
      datasets.set(datasetLabel, dataset)
    } else {
      ensureDatasetLength(dataset, labels.length)
    }

    const numeric = parsePreviewNumber(row[valueKey])
    if (numeric === null) {
      return
    }

    if (dataset.data[labelIndex] === null || dataset.data[labelIndex] === undefined) {
      dataset.data[labelIndex] = numeric
    } else {
      dataset.data[labelIndex] += numeric
    }

    if (!dataset.metaMap.has(labelIndex)) {
      dataset.metaMap.set(labelIndex, { source, rowIndex: entry.index })
    }
  })

  if (labels.length === 0 || datasets.size === 0) {
    return null
  }

  const chartDatasets = Array.from(datasets.values()).map((dataset) => ({
    label: dataset.label,
    data: dataset.data,
    borderColor: dataset.borderColor,
    backgroundColor: dataset.backgroundColor,
    fill: false
  }))

  const pointMeta = Array.from(datasets.values()).map((dataset) => convertMetaMapToObject(dataset.metaMap))

  return {
    chartType: createPreviewChartType('multiLine', chartHint || 'Datensatz-Vergleich'),
    config: {
      labels,
      datasets: chartDatasets,
      options: {
        showLegend: true,
        animation: false,
        smooth: true,
        tension: 0.3
      }
    },
    pointMeta
  }
}

export const buildScatterPreview = (entries, source, selection, chartHint, hasRadius) => {
  const xColumn = selection?.xColumn
  const yColumn = selection?.yColumn
  if (!xColumn || !yColumn) {
    return null
  }

  const sampled = sampleSuggestionEntries(entries, SUGGESTION_PREVIEW_MAX_POINTS)
  if (sampled.length === 0) {
    return null
  }

  const datasetColumn = selection?.datasetLabel
  const pointLabelColumn = selection?.pointLabelColumn
  const datasets = new Map()

  sampled.forEach((entry) => {
    const row = entry.row || {}
    const xValue = parsePreviewNumber(row[xColumn])
    const yValue = parsePreviewNumber(row[yColumn])
    if (xValue === null || yValue === null) {
      return
    }

    const datasetLabel = datasetColumn ? formatSamplePreview(row[datasetColumn]) : 'Daten'
    let dataset = datasets.get(datasetLabel)
    if (!dataset) {
      if (datasets.size >= SUGGESTION_PREVIEW_MAX_DATASETS) {
        return
      }
      const color = getPreviewColor(datasets.size)
      dataset = {
        key: datasetLabel,
        label: datasetLabel,
        data: [],
        backgroundColor: color,
        borderColor: color,
        meta: []
      }
      datasets.set(datasetLabel, dataset)
    }

    const rValue = hasRadius && selection?.rColumn ? parsePreviewNumber(row[selection.rColumn]) : null
    const label = pointLabelColumn ? formatSamplePreview(row[pointLabelColumn]) : `Zeile ${entry.index + 1}`

    const point = {
      x: xValue,
      y: yValue,
      label
    }

    if (hasRadius) {
      point.r = rValue !== null ? Math.max(2, Math.abs(rValue)) : 6
    }

    dataset.data.push(point)
    dataset.meta.push({ source, rowIndex: entry.index })
  })

  if (datasets.size === 0) {
    return null
  }

  const chartDatasets = Array.from(datasets.values()).map((dataset) => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: dataset.backgroundColor,
    borderColor: dataset.borderColor,
    pointRadius: hasRadius ? undefined : 6
  }))

  const pointMeta = Array.from(datasets.values()).map((dataset) => {
    const meta = {}
    dataset.meta.forEach((entryMeta, index) => {
      meta[index] = entryMeta
    })
    return meta
  })

  return {
    chartType: createPreviewChartType(hasRadius ? 'bubble' : 'scatter', chartHint || 'Punkte'),
    config: {
      datasets: chartDatasets,
      options: {
        animation: false,
        showLegend: datasets.size > 1
      }
    },
    pointMeta
  }
}

export const buildCoordinatePreview = (entries, source, selection, chartHint) => {
  const longitudeColumn = selection?.longitudeColumn
  const latitudeColumn = selection?.latitudeColumn
  if (!longitudeColumn || !latitudeColumn) {
    return null
  }

  const sampled = sampleSuggestionEntries(entries, SUGGESTION_PREVIEW_MAX_POINTS)
  if (sampled.length === 0) {
    return null
  }

  const datasetColumn = selection?.datasetLabel
  const pointLabelColumn = selection?.pointLabelColumn
  const datasets = new Map()

  sampled.forEach((entry) => {
    const row = entry.row || {}
    const longitude = parsePreviewNumber(row[longitudeColumn])
    const latitude = parsePreviewNumber(row[latitudeColumn])
    if (longitude === null || latitude === null) {
      return
    }

    const datasetLabel = datasetColumn ? formatSamplePreview(row[datasetColumn]) : 'Koordinaten'
    let dataset = datasets.get(datasetLabel)
    if (!dataset) {
      if (datasets.size >= SUGGESTION_PREVIEW_MAX_DATASETS) {
        return
      }
      const color = getPreviewColor(datasets.size)
      dataset = {
        key: datasetLabel,
        label: datasetLabel,
        data: [],
        backgroundColor: color,
        borderColor: color,
        meta: []
      }
      datasets.set(datasetLabel, dataset)
    }

    const label = pointLabelColumn ? formatSamplePreview(row[pointLabelColumn]) : `Zeile ${entry.index + 1}`
    dataset.data.push({ longitude, latitude, label })
    dataset.meta.push({ source, rowIndex: entry.index })
  })

  if (datasets.size === 0) {
    return null
  }

  const chartDatasets = Array.from(datasets.values()).map((dataset) => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: dataset.backgroundColor,
    borderColor: dataset.borderColor
  }))

  const pointMeta = Array.from(datasets.values()).map((dataset) => {
    const meta = {}
    dataset.meta.forEach((entryMeta, index) => {
      meta[index] = entryMeta
    })
    return meta
  })

  return {
    chartType: createPreviewChartType('coordinate', chartHint || 'Koordinaten'),
    config: {
      datasets: chartDatasets,
      options: {
        animation: false,
        showLegend: datasets.size > 1
      }
    },
    pointMeta
  }
}

