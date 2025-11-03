import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Papa from 'papaparse'
import useDataImport, { createSearchConfig, rowMatchesQuery } from '../hooks/useDataImport'
import CsvFindReplaceModal from './CsvFindReplaceModal'
import ChartPreview from './ChartPreview'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AVAILABLE_FORMULAS, formatCellReference, formatRangeReference } from '../utils/csv/formulas'

const formatCellValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') {
    return value.trim()
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : ''
  }
  return String(value)
}

const MAX_HIGHLIGHT_SEGMENTS = 100
const DEFAULT_COLUMN_WIDTH = 160
const MIN_COLUMN_WIDTH = 60
const ACTION_COLUMN_WIDTH = 72
const DEFAULT_ROW_HEIGHT = 36

const STAT_NUMBER_FORMAT = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 3,
  minimumFractionDigits: 0
})

const STAT_PERCENT_FORMAT = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  maximumFractionDigits: 1
})

const formatStatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '–'
  }
  return STAT_NUMBER_FORMAT.format(value)
}

const formatStatPercentage = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '–'
  }
  return STAT_PERCENT_FORMAT.format(value)
}

const DEFAULT_PIVOT_CONFIG = {
  enabled: false,
  indexColumns: [],
  keyColumn: '',
  valueColumn: '',
  prefix: ''
}

const DEFAULT_UNPIVOT_CONFIG = {
  enabled: false,
  idColumns: [],
  valueColumns: [],
  variableColumn: 'Kategorie',
  valueColumnName: 'Wert',
  dropEmptyValues: true
}

const DEFAULT_PIVOT_META = {
  enabled: false,
  createdColumns: [],
  groups: 0,
  skippedMissingKey: 0,
  skippedMissingValue: 0,
  duplicateAssignments: 0,
  indexColumns: [],
  sourceColumn: '',
  valueColumn: '',
  fillValueUsed: false,
  prefix: ''
}

const DEFAULT_UNPIVOT_META = {
  enabled: false,
  idColumns: [],
  valueColumns: [],
  variableColumn: 'Kategorie',
  valueColumnName: 'Wert',
  dropEmptyValues: true,
  createdRows: 0,
  skippedEmpty: 0
}

const SUGGESTION_PREVIEW_MAX_POINTS = 200
const SUGGESTION_PREVIEW_MAX_CATEGORIES = 25
const SUGGESTION_PREVIEW_MAX_DATASETS = 5
const SUGGESTION_PREVIEW_COLORS = [
  '#38BDF8',
  '#34D399',
  '#F97316',
  '#A855F7',
  '#F43F5E',
  '#FACC15',
  '#22D3EE',
  '#F472B6'
]

const renderHighlightedValue = (value, matches) => {
  const formatted = formatCellValue(value)
  const text = formatted === null || formatted === undefined ? '' : String(formatted)
  if (!matches || matches.length === 0 || !text) {
    return text
  }

  const segments = []
  let cursor = 0
  const sortedMatches = [...matches].sort((a, b) => a.start - b.start)

  for (let index = 0; index < sortedMatches.length && segments.length < MAX_HIGHLIGHT_SEGMENTS * 2; index += 1) {
    const match = sortedMatches[index]
    if (!match) continue
    const start = Math.max(0, Math.min(match.start, text.length))
    const end = Math.max(start, Math.min(match.end, text.length))
    if (start > cursor) {
      segments.push(text.slice(cursor, start))
    }
    if (end > start) {
      segments.push(
        <mark key={`highlight-${start}-${index}`} className="rounded bg-yellow-500/30 px-0.5 text-dark-textLight">
          {text.slice(start, end)}
        </mark>
      )
    }
    cursor = end
    if (cursor >= text.length) {
      break
    }
  }

  if (cursor < text.length) {
    segments.push(text.slice(cursor))
  }

  return segments
}

const escapeForReplacement = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const applyReplacementToText = (value, searchConfig, replacement) => {
  if (!searchConfig?.isActive) {
    return value
  }

  const text = value === null || value === undefined ? '' : String(value)
  if (!text) {
    return text
  }

  try {
    if (searchConfig.mode === 'regex' && searchConfig.regexSource) {
      const regex = new RegExp(searchConfig.regexSource, searchConfig.regexFlags || 'giu')
      return text.replace(regex, replacement)
    }

    if (searchConfig.mode === 'whole' && searchConfig.regexSource) {
      const regex = new RegExp(searchConfig.regexSource, searchConfig.regexFlags || 'giu')
      return text.replace(regex, () => replacement)
    }

    const pattern = searchConfig.query || ''
    if (!pattern) {
      return text
    }
    const regex = new RegExp(escapeForReplacement(pattern), 'giu')
    return text.replace(regex, () => replacement)
  } catch (_error) {
    return text
  }
}

const formatSamplePreview = (value) => {
  const formatted = formatCellValue(value)
  if (formatted === null || formatted === undefined) {
    return '∅'
  }
  const asString = typeof formatted === 'string' ? formatted : String(formatted)
  return asString.trim() === '' ? '∅' : formatted
}

const isCellValueEmpty = (value) => {
  if (value === null || value === undefined) {
    return true
  }
  if (typeof value === 'number') {
    return Number.isNaN(value)
  }
  if (typeof value === 'string') {
    return value.trim() === ''
  }
  return false
}

const parsePreviewNumber = (value) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const text = String(value).trim()
  if (!text) return null

  let normalized = text.replace(/\s+/g, '')

  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (/^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/,/g, '')
  } else if (normalized.includes(',') && !normalized.includes('.')) {
    normalized = normalized.replace(',', '.')
  }

  const sanitized = normalized.replace(/[^0-9eE+\-.]/g, '')
  const parsed = Number(sanitized)
  if (Number.isFinite(parsed)) {
    return parsed
  }

  const fallback = Number(normalized.replace(/,/g, '.'))
  return Number.isFinite(fallback) ? fallback : null
}

const formatPreviewLabel = (value) => {
  const formatted = formatSamplePreview(value)
  return formatted === null || formatted === undefined ? '∅' : String(formatted)
}

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

const createPreviewChartType = (id, name) => ({ id, name, configSchema: {} })

const getPreviewColor = (index) => SUGGESTION_PREVIEW_COLORS[index % SUGGESTION_PREVIEW_COLORS.length]

const buildMultiValuePreview = (entries, source, selection, chartHint) => {
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

const buildSingleValuePreview = (entries, source, selection, chartHint) => {
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

const buildLongFormatPreview = (entries, source, selection, chartHint) => {
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
    const datasetLabel = formatPreviewLabel(row[datasetKey])
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

const buildScatterPreview = (entries, source, selection, chartHint, hasRadius) => {
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

    const datasetLabel = datasetColumn ? formatPreviewLabel(row[datasetColumn]) : 'Daten'
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
    const label = pointLabelColumn ? formatPreviewLabel(row[pointLabelColumn]) : `Zeile ${entry.index + 1}`

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

const buildCoordinatePreview = (entries, source, selection, chartHint) => {
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

    const datasetLabel = datasetColumn ? formatPreviewLabel(row[datasetColumn]) : 'Koordinaten'
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

    const label = pointLabelColumn ? formatPreviewLabel(row[pointLabelColumn]) : `Zeile ${entry.index + 1}`
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

const FILTER_OPERATORS = [
  // Text operators
  { value: 'equalsText', label: 'Text ist gleich' },
  { value: 'notEqualsText', label: 'Text ist ungleich' },
  { value: 'containsText', label: 'Text enthält' },
  { value: 'notContainsText', label: 'Text enthält nicht' },
  { value: 'matchesRegex', label: 'passt auf Regex' },
  { value: 'notMatchesRegex', label: 'passt nicht auf Regex' },
  // Number operators
  { value: 'equals', label: 'Zahl ist gleich' },
  { value: 'notEquals', label: 'Zahl ist ungleich' },
  { value: 'greaterThan', label: 'größer als' },
  { value: 'greaterThanOrEqual', label: 'größer oder gleich' },
  { value: 'lessThan', label: 'kleiner als' },
  { value: 'lessThanOrEqual', label: 'kleiner oder gleich' },
  { value: 'between', label: 'liegt zwischen' },
  // DateTime operators
  { value: 'dateEquals', label: 'Datum ist gleich' },
  { value: 'dateGreaterThan', label: 'Datum nach' },
  { value: 'dateGreaterThanOrEqual', label: 'Datum nach oder gleich' },
  { value: 'dateLessThan', label: 'Datum vor' },
  { value: 'dateLessThanOrEqual', label: 'Datum vor oder gleich' },
  { value: 'dateBetween', label: 'Datum zwischen' },
  // Type checks
  { value: 'isEmpty', label: 'ist leer' },
  { value: 'isNotEmpty', label: 'ist nicht leer' },
  { value: 'isNumber', label: 'ist Zahl' },
  { value: 'isText', label: 'ist Text' },
  { value: 'isDateTime', label: 'ist Datum/Zeit' }
]

const AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Summe (Gesamte Werte)' },
  { value: 'average', label: 'Durchschnitt' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Anzahl gültiger Werte' },
  { value: 'countRows', label: 'Anzahl Datenpunkte' },
  { value: 'countValid', label: 'Anzahl Werte (nach Kriterien)' },
  { value: 'median', label: 'Median' },
  { value: 'stdDev', label: 'Standardabweichung' },
  { value: 'variance', label: 'Varianz' },
  { value: 'product', label: 'Produkt' },
  { value: 'first', label: 'Erster Wert' },
  { value: 'last', label: 'Letzter Wert' }
]

const createUniqueId = (prefix) => {
  const globalCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// Value rule options
const VALUE_RULE_CONDITIONS = [
  { value: 'containsText', label: 'wenn Text enthält' },
  { value: 'notContainsText', label: 'wenn Text nicht enthält' },
  { value: 'equalsText', label: 'wenn Text gleich ist' },
  { value: 'isNumber', label: 'wenn Zahl' },
  { value: 'isEmpty', label: 'wenn leer' },
  { value: 'isNotEmpty', label: 'wenn nicht leer' },
  { value: 'matchesRegex', label: 'wenn Regex passt' }
]

const VALUE_RULE_ACTIONS = [
  { value: 'replaceText', label: 'ersetze Text' },
  { value: 'regexReplace', label: 'Regex ersetzen' },
  { value: 'setText', label: 'setze Text' },
  { value: 'toNumber', label: 'in Zahl umwandeln' },
  { value: 'multiply', label: 'Zahl multiplizieren' },
  { value: 'divide', label: 'Zahl dividieren' },
  { value: 'removeNonDigits', label: 'Nicht-Ziffern entfernen' },
  { value: 'uppercase', label: 'in GROSS' },
  { value: 'lowercase', label: 'in klein' },
  { value: 'trim', label: 'Leerzeichen trimmen' }
]

const WORKBENCH_STEPS = [
  { key: 'mapping', label: 'Zuordnung' },
  { key: 'duplicates', label: 'Duplikate' },
  { key: 'transformations', label: 'Transformation' }
]

function SortableHeaderCell({
  column,
  sortEntry,
  sortIndex,
  onSortToggle,
  onToggleVisibility,
  onTogglePinned,
  onResizeStart,
  registerRef,
  isPinnedLeft,
  isPinnedRight,
  leftOffset,
  rightOffset,
  width
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.key })
  const headerRef = useCallback(
    (node) => {
      registerRef(column.key, node)
    },
    [registerRef, column.key]
  )

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab'
  }

  const stickyPosition = {}
  if (isPinnedLeft) {
    stickyPosition.left = leftOffset || 0
  }
  if (isPinnedRight) {
    stickyPosition.right = rightOffset || 0
  }

  const computedWidth = width ? Math.max(width, ACTION_COLUMN_WIDTH) : null
  const widthStyle = {
    minWidth: computedWidth ? `${computedWidth}px` : `${DEFAULT_COLUMN_WIDTH}px`,
    width: computedWidth ? `${computedWidth}px` : undefined
  }

  const headerStyle = {
    ...widthStyle,
    ...stickyPosition,
    top: 0,
    position: 'sticky',
    zIndex: (isPinnedLeft || isPinnedRight ? 40 : 35) + (isDragging ? 5 : 0),
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(2px)'
  }

  const isSorted = Boolean(sortEntry)
  const sortSymbol = sortEntry ? (sortEntry.direction === 'desc' ? '▼' : '▲') : ''

  return (
    <th ref={headerRef} style={headerStyle} className="group border-b border-gray-700 px-3 py-2 text-left text-xs uppercase tracking-wide text-dark-textGray">
      <div
        ref={setNodeRef}
        style={dragStyle}
        className={`flex items-center gap-2 ${isDragging ? 'opacity-80' : ''}`}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="h-4 w-4 shrink-0 cursor-grab text-[10px] text-dark-textGray/60 transition-colors hover:text-dark-textLight focus:outline-none"
          title="Spalte ziehen"
          onMouseDown={(event) => event.stopPropagation()}
        >
          ⋮⋮
        </button>
        <button
          type="button"
          onClick={(event) => onSortToggle(column.key, event)}
          className={`flex flex-1 items-center gap-1 text-left transition-colors ${
            isSorted ? 'text-dark-textLight' : 'text-dark-textGray'
          } hover:text-dark-textLight focus:outline-none`}
        >
          <span className="truncate font-medium">{column.key}</span>
          {isSorted && (
            <span className="flex items-center gap-1 text-[10px]">
              <span>{sortSymbol}</span>
              <span className="rounded bg-dark-textGray/30 px-1 text-[9px] leading-none text-dark-textLight">{sortIndex + 1}</span>
            </span>
          )}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onTogglePinned(column.key)
            }}
            className={`relative flex items-center justify-center rounded px-1 text-[10px] transition-colors ${
              column.display?.pinned
                ? 'text-dark-accent1'
                : 'text-dark-textGray group-hover:text-dark-textLight'
            } hover:text-dark-accent1 focus:outline-none`}
            title={
              column.display?.pinned === 'left'
                ? 'Spalte rechts fixieren'
                : column.display?.pinned === 'right'
                ? 'Fixierung lösen'
                : 'Spalte links fixieren'
            }
          >
            <span className="leading-none">📌</span>
            {column.display?.pinned && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-semibold">
                {column.display.pinned === 'left' ? 'L' : 'R'}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleVisibility(column.key)
            }}
            className="rounded px-1 text-[10px] text-dark-textGray transition-colors hover:text-dark-textLight focus:outline-none"
            title="Spalte ausblenden"
          >
            👁
          </button>
          <button
            type="button"
            onPointerDown={(event) => onResizeStart(column.key, event)}
            className="relative h-6 w-2 cursor-col-resize select-none text-dark-textGray/50 hover:text-dark-textLight focus:outline-none"
            title="Spaltenbreite anpassen"
          >
            <span className="pointer-events-none block h-full w-px bg-dark-textGray/40" />
          </button>
        </div>
      </div>
    </th>
  )
}

export default function CsvWorkbench({
  onApplyToChart,
  onImportStateChange,
  onResetWorkbench,
  allowMultipleValueColumns = true,
  requireDatasets = false,
  initialData = null,
  chartType = null,
  isScatterBubble = false,
  isCoordinate = false
}) {
  const [activeTab, setActiveTab] = useState('mapping')

  const {
    fileName,
    columns: rawColumns,
    mapping,
    transformations,
    updateMapping: internalUpdateMapping,
    updateTransformations: internalUpdateTransformations,
    toggleValueColumn: internalToggleValueColumn,
    reorderColumns: internalReorderColumns,
    setColumnWidth: internalSetColumnWidth,
    setColumnVisibility: internalSetColumnVisibility,
    setColumnPinned: internalSetColumnPinned,
    rowDisplay,
    setRowHidden: internalSetRowHidden,
    setRowPinned: internalSetRowPinned,
    parseFile: internalParseFile,
    reset,
    previewRows,
    totalRows,
    transformedPreviewRows,
    transformedRowCount,
    transformationWarnings,
    transformationMeta,
    isLoading,
    parseError,
    validationErrors,
    warnings,
    previewLimit,
    setPreviewLimit,
    getImportResult,
    getImportState,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    searchColumns,
    setSearchColumns,
    searchError,
    sortConfig,
    setSortConfig,
    previewEntries,
    filteredRowCount,
    transformedPreviewEntries,
    transformedFilteredRowCount,
    transformedRows,
    updateCell: internalUpdateCell,
    updateCellValue: internalUpdateCellValue,
    profilingMeta,
    duplicateKeyColumns,
    setDuplicateKeyColumns: internalSetDuplicateKeyColumns,
    duplicateInfo,
    resolveDuplicates: internalResolveDuplicates,
    manualEdits,
    canUndoManualEdit,
    undoLastManualEdit: internalUndoLastManualEdit,
    formulaErrors,
    setCellFormula: internalSetCellFormula,
    clearCellFormula: internalClearCellFormula,
    getCellFormula: internalGetCellFormula
  } = useDataImport({ allowMultipleValueColumns, requireDatasets, initialData, chartType, isScatterBubble, isCoordinate })

  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [activeSection, setActiveSection] = useState('mapping')
  const [selectionState, setSelectionState] = useState({ anchor: null, focus: null })
  const [isSelecting, setIsSelecting] = useState(false)
  const pendingFocusRef = useRef(null)
  const setCellFormula = internalSetCellFormula
  const clearCellFormula = internalClearCellFormula
  const getCellFormula = internalGetCellFormula
  const [profilingColumnKey, setProfilingColumnKey] = useState(null)
  const [correlationSelectedColumns, setCorrelationSelectedColumns] = useState([])
  const [correlationThreshold, setCorrelationThreshold] = useState(0)
  const [correlationSortKey, setCorrelationSortKey] = useState('')
  const [hoveredCorrelationCell, setHoveredCorrelationCell] = useState(null)
  const correlationMatrix = profilingMeta?.correlationMatrix || null
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false)
  const [findReplaceData, setFindReplaceData] = useState({
    raw: { matches: [], total: 0 },
    transformed: { matches: [], total: 0 }
  })
  const [findReplaceDefaultScope, setFindReplaceDefaultScope] = useState('raw')
  const [chartPreviewHighlight, setChartPreviewHighlight] = useState(null)
  const findReplaceHistoryRef = useRef([])
  const [formulaInputValue, setFormulaInputValue] = useState('')
  const [formulaCaretPosition, setFormulaCaretPosition] = useState(null)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [suppressFormulaSuggestions, setSuppressFormulaSuggestions] = useState(false)
  const [isFormulaEditing, setIsFormulaEditing] = useState(false)
  const formulaInputRef = useRef(null)
  const formulaEditingRef = useRef(false)
  const [duplicateActionFeedback, setDuplicateActionFeedback] = useState(null)
  const [groupingColumnToAdd, setGroupingColumnToAdd] = useState('')
  const [activeSearchMatchIndex, setActiveSearchMatchIndex] = useState(-1)
  const searchMatchSignatureRef = useRef('')
  const formulaMetadataByName = useMemo(() => {
    const map = new Map()
    AVAILABLE_FORMULAS.forEach((formula) => {
      map.set(formula.name.toUpperCase(), formula)
    })
    return map
  }, [])
  const activeSearchConfig = useMemo(
    () => createSearchConfig({ query: searchQuery, mode: searchMode, columns: searchColumns }),
    [searchQuery, searchMode, searchColumns]
  )
  const availableColumnsForModal = useMemo(
    () => columns.map((column) => ({ key: column.key, label: column.key })),
    [columns]
  )
  const transformedScopeDisabledReason = useMemo(() => {
    if (!Array.isArray(transformedRows) || transformedRows.length === 0) {
      if (totalRows === 0) {
        return 'Keine Daten vorhanden.'
      }
      return 'Transformationsvorschau enthält keine Zeilen.'
    }
    if (!transformationMeta) {
      return ''
    }
    if ((transformationMeta.filteredOut ?? 0) > 0) {
      return 'Aktive Filter verändern die Zeilenanzahl. Ersetzen im Transformationspfad ist deaktiviert.'
    }
    const aggregatedFrom = transformationMeta.aggregatedFrom ?? transformedRows.length
    const aggregatedTo = transformationMeta.aggregatedTo ?? transformedRows.length
    if (aggregatedFrom !== aggregatedTo) {
      return 'Gruppierung oder Aggregation verändern die Zeilenanzahl.'
    }
    if (transformedRows.length !== totalRows && totalRows > 0) {
      return 'Transformationsdaten und Originalzeilen stimmen nicht überein.'
    }
    return ''
  }, [transformationMeta, transformedRows, totalRows])
  const canReplaceInTransformed = transformedScopeDisabledReason === ''
  const canOpenFindReplace = activeSearchConfig?.isActive && totalRows > 0
  const searchMatches = useMemo(() => {
    if (!activeSearchConfig?.isActive) {
      return []
    }
    const columnOrder = new Map()
    visibleColumns.forEach((column, index) => {
      columnOrder.set(column.key, index)
    })
    const collectMatches = (entries, scope) => {
      if (!Array.isArray(entries) || entries.length === 0) {
        return []
      }
      const result = []
      entries.forEach((entry, rowPosition) => {
        const matchInfo = entry?.matchInfo || null
        if (!matchInfo) {
          return
        }
        Object.entries(matchInfo).forEach(([columnKey, positions]) => {
          if (!Array.isArray(positions) || positions.length === 0) {
            return
          }
          result.push({
            scope,
            rowIndex: entry.index,
            rowPosition,
            columnKey,
            positions,
            rowRefKey: `${scope}-${entry.index}`
          })
        })
      })
      return result
    }
    const rawMatches = collectMatches(previewEntries, 'raw')
    const transformedMatches = collectMatches(transformedPreviewEntries, 'transformed')
    const combined = [...rawMatches, ...transformedMatches]
    combined.sort((a, b) => {
      if (a.scope !== b.scope) {
        if (a.scope === 'raw') return -1
        if (b.scope === 'raw') return 1
        return a.scope.localeCompare(b.scope)
      }
      if (a.rowIndex !== b.rowIndex) {
        return a.rowIndex - b.rowIndex
      }
      const orderA = columnOrder.has(a.columnKey) ? columnOrder.get(a.columnKey) : Number.MAX_SAFE_INTEGER
      const orderB = columnOrder.has(b.columnKey) ? columnOrder.get(b.columnKey) : Number.MAX_SAFE_INTEGER
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return a.columnKey.localeCompare(b.columnKey, undefined, { sensitivity: 'base' })
    })
    return combined
  }, [activeSearchConfig, previewEntries, transformedPreviewEntries, visibleColumns])
  const activeSearchMatch = activeSearchMatchIndex >= 0 ? searchMatches[activeSearchMatchIndex] : null
  const hasSearchMatches = searchMatches.length > 0
  const searchMatchSummary = hasSearchMatches && activeSearchMatchIndex >= 0
    ? `${activeSearchMatchIndex + 1}/${searchMatches.length}`
    : `0/${searchMatches.length}`
  useEffect(() => {
    if (!activeSearchConfig?.isActive) {
      searchMatchSignatureRef.current = ''
      setActiveSearchMatchIndex(-1)
      return
    }
    const columnsKey = Array.isArray(activeSearchConfig.columns) && activeSearchConfig.columns.length > 0
      ? activeSearchConfig.columns.join('|')
      : 'ALL'
    const signature = `${activeSearchConfig.mode || 'normal'}|${activeSearchConfig.query || ''}|${columnsKey}`
    if (signature !== searchMatchSignatureRef.current) {
      searchMatchSignatureRef.current = signature
      setActiveSearchMatchIndex(searchMatches.length > 0 ? 0 : -1)
      return
    }
    if (searchMatches.length === 0) {
      setActiveSearchMatchIndex(-1)
      return
    }
    setActiveSearchMatchIndex((previous) => {
      if (previous >= 0 && previous < searchMatches.length) {
        return previous
      }
      return 0
    })
  }, [activeSearchConfig, searchMatches.length])
  useEffect(() => {
    if (!activeSearchMatch || activeSearchMatch.scope !== 'raw') {
      return
    }
    const rowPosition = previewEntries.findIndex((entry) => entry.index === activeSearchMatch.rowIndex)
    if (rowPosition === -1) {
      return
    }
    const target = createCellTarget(activeSearchMatch.rowIndex, rowPosition, activeSearchMatch.columnKey)
    setSelectionState((previous) => {
      const focus = previous.focus || previous.anchor
      if (
        focus &&
        focus.rowIndex === target.rowIndex &&
        focus.columnKey === target.columnKey &&
        focus.rowPosition === target.rowPosition &&
        focus.columnIndex === target.columnIndex
      ) {
        return previous
      }
      return { anchor: target, focus: target }
    })
    pendingFocusRef.current = { rowIndex: target.rowIndex, columnKey: target.columnKey }
  }, [activeSearchMatch, createCellTarget, previewEntries])
  useEffect(() => {
    if (!activeSearchMatch) {
      return
    }
    const key = activeSearchMatch.rowRefKey || `${activeSearchMatch.scope}-${activeSearchMatch.rowIndex}`
    const node = rowRefs.current.get(key)
    if (node && typeof node.scrollIntoView === 'function') {
      try {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } catch (_error) {
        node.scrollIntoView()
      }
    }
  }, [activeSearchMatch])
  const handleSearchMatchNavigate = useCallback(
    (direction) => {
      if (!Array.isArray(searchMatches) || searchMatches.length === 0) {
        return
      }
      setActiveSearchMatchIndex((previous) => {
        if (previous === -1) {
          return direction >= 0 ? 0 : searchMatches.length - 1
        }
        const next = (previous + direction + searchMatches.length) % searchMatches.length
        return next
      })
    },
    [searchMatches]
  )
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) {
        return
      }
      if (event.key === 'F3') {
        if (!activeSearchConfig?.isActive) {
          return
        }
        event.preventDefault()
        handleSearchMatchNavigate(event.shiftKey ? -1 : 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeSearchConfig, handleSearchMatchNavigate])

  useEffect(() => {
    if (!correlationMatrix || !Array.isArray(correlationMatrix.columns) || correlationMatrix.columns.length === 0) {
      setCorrelationSelectedColumns([])
      setCorrelationSortKey('')
      return
    }

    const availableColumns = correlationMatrix.columns
    setCorrelationSelectedColumns((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) {
        return [...availableColumns]
      }
      const availableSet = new Set(availableColumns)
      const filtered = prev.filter((key) => availableSet.has(key))
      if (filtered.length === prev.length && filtered.length > 0) {
        return filtered
      }
      return filtered.length > 0 ? filtered : [...availableColumns]
    })
    setCorrelationSortKey((prev) => (prev && availableColumns.includes(prev) ? prev : ''))
  }, [correlationMatrix])

  const computeMatchesForRows = useCallback(
    (rowsSource, scopeLabel) => {
      if (!activeSearchConfig?.isActive || !Array.isArray(rowsSource)) {
        return { matches: [], total: 0 }
      }
      const columnKeys = new Set(columns.map((column) => column.key))
      const columnOrder = new Map()
      columns.forEach((column, index) => {
        columnOrder.set(column.key, index)
      })
      const matches = []
      rowsSource.forEach((row, rowIndex) => {
        if (!row) return
        const result = rowMatchesQuery(row, activeSearchConfig)
        const entries = Object.entries(result.matchesByColumn || {})
        entries.forEach(([columnKey, positions]) => {
          if (!columnKeys.has(columnKey)) return
          if (!Array.isArray(positions) || positions.length === 0) return
          const rawValue = row[columnKey]
          const formattedRaw = formatCellValue(rawValue)
          const formattedValue =
            formattedRaw === null || formattedRaw === undefined
              ? ''
              : typeof formattedRaw === 'string'
                ? formattedRaw
                : String(formattedRaw)
          matches.push({
            scope: scopeLabel,
            rowIndex,
            columnKey,
            positions,
            formattedValue,
            rawValue
          })
        })
      })
      matches.sort((a, b) => {
        if (a.rowIndex !== b.rowIndex) {
          return a.rowIndex - b.rowIndex
        }
        const orderA = columnOrder.has(a.columnKey) ? columnOrder.get(a.columnKey) : Number.MAX_SAFE_INTEGER
        const orderB = columnOrder.has(b.columnKey) ? columnOrder.get(b.columnKey) : Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return a.columnKey.localeCompare(b.columnKey, undefined, { sensitivity: 'base' })
      })
      const total = matches.reduce((sum, entry) => sum + (entry.positions?.length || 0), 0)
      return { matches, total }
    },
    [activeSearchConfig, columns, rowMatchesQuery]
  )

  useEffect(() => {
    if (!isFindReplaceOpen) {
      return
    }

    if (!activeSearchConfig?.isActive) {
      setFindReplaceData({ raw: { matches: [], total: 0 }, transformed: { matches: [], total: 0 } })
      return
    }

    const state = getImportState()
    const rawRows = Array.isArray(state?.rows) ? state.rows : []
    const rawResult = computeMatchesForRows(rawRows, 'raw')
    const transformedResult = canReplaceInTransformed
      ? computeMatchesForRows(transformedRows || [], 'transformed')
      : { matches: [], total: 0 }
    setFindReplaceData({ raw: rawResult, transformed: transformedResult })
  }, [
    isFindReplaceOpen,
    activeSearchConfig,
    getImportState,
    computeMatchesForRows,
    canReplaceInTransformed,
    transformedRows
  ])

  const correlationDisplayIndices = useMemo(() => {
    if (!correlationMatrix || !Array.isArray(correlationMatrix.columns) || correlationMatrix.columns.length === 0) {
      return []
    }

    const availableColumns = correlationMatrix.columns
    const selectedColumns =
      Array.isArray(correlationSelectedColumns) && correlationSelectedColumns.length > 0
        ? correlationSelectedColumns.filter((key) => availableColumns.includes(key))
        : availableColumns

    if (selectedColumns.length === 0) {
      return []
    }

    const uniqueIndices = Array.from(
      new Set(selectedColumns.map((key) => availableColumns.indexOf(key)).filter((index) => index >= 0))
    )

    if (!Array.isArray(correlationMatrix.matrix) || correlationMatrix.matrix.length === 0) {
      return uniqueIndices
    }

    if (correlationSortKey && availableColumns.includes(correlationSortKey)) {
      const sortIndex = availableColumns.indexOf(correlationSortKey)
      uniqueIndices.sort((a, b) => {
        const valueA = correlationMatrix.matrix?.[a]?.[sortIndex] ?? null
        const valueB = correlationMatrix.matrix?.[b]?.[sortIndex] ?? null
        const absA = valueA === null ? -1 : Math.abs(valueA)
        const absB = valueB === null ? -1 : Math.abs(valueB)
        if (absA === absB) {
          return availableColumns[a].localeCompare(availableColumns[b], undefined, { sensitivity: 'base' })
        }
        return absB - absA
      })
    } else {
      uniqueIndices.sort((a, b) =>
        availableColumns[a].localeCompare(availableColumns[b], undefined, { sensitivity: 'base' })
      )
    }

    return uniqueIndices
  }, [correlationMatrix, correlationSelectedColumns, correlationSortKey])

  const correlationDisplayColumns = useMemo(() => {
    if (!correlationMatrix || !Array.isArray(correlationMatrix.columns)) {
      return []
    }
    return correlationDisplayIndices.map((index) => correlationMatrix.columns[index]).filter(Boolean)
  }, [correlationMatrix, correlationDisplayIndices])

  const hasCorrelationData = Boolean(correlationMatrix && correlationDisplayIndices.length > 0)
  const correlationAvailableColumns = correlationMatrix?.columns || []
  const correlationSelectionSummary = useMemo(() => {
    if (!correlationMatrix || !Array.isArray(correlationMatrix.columns) || correlationMatrix.columns.length === 0) {
      return '–'
    }
    const selectedCount = Array.isArray(correlationSelectedColumns) && correlationSelectedColumns.length > 0
      ? correlationSelectedColumns.filter((key) => correlationMatrix.columns.includes(key)).length
      : correlationMatrix.columns.length
    return `${selectedCount}/${correlationMatrix.columns.length}`
  }, [correlationMatrix, correlationSelectedColumns])
  const correlationTruncatedColumns = correlationMatrix?.truncatedColumns || []
  const correlationPairCounts = correlationMatrix?.pairCounts || []

  const handleCorrelationColumnToggle = useCallback(
    (columnKey, isSelected) => {
      setCorrelationSelectedColumns((prev) => {
        const availableSet = new Set(correlationAvailableColumns)
        if (!availableSet.has(columnKey)) {
          return prev
        }

        const previous = Array.isArray(prev) ? prev : []

        if (previous.length === 0) {
          if (isSelected) {
            return previous
          }
          return correlationAvailableColumns.filter((key) => key !== columnKey)
        }

        if (isSelected) {
          if (previous.includes(columnKey)) {
            return previous
          }
          return [...previous, columnKey]
        }

        return previous.filter((key) => key !== columnKey)
      })
    },
    [correlationAvailableColumns]
  )

  const handleCorrelationSelectionReset = useCallback(() => {
    if (!correlationAvailableColumns || correlationAvailableColumns.length === 0) {
      setCorrelationSelectedColumns([])
      return
    }
    setCorrelationSelectedColumns([...correlationAvailableColumns])
  }, [correlationAvailableColumns])

  const handleCorrelationSelectionClear = useCallback(() => {
    setCorrelationSelectedColumns([])
  }, [])

  const clampCorrelationThreshold = useCallback((value) => {
    if (!Number.isFinite(value)) {
      return 0
    }
    if (value < 0) {
      return 0
    }
    if (value > 1) {
      return 1
    }
    return value
  }, [])

  const handleCorrelationThresholdChange = useCallback(
    (nextValue) => {
      setCorrelationThreshold(clampCorrelationThreshold(nextValue))
    },
    [clampCorrelationThreshold]
  )

  const handleCorrelationThresholdInput = useCallback(
    (event) => {
      const raw = Number.parseFloat(event.target.value)
      handleCorrelationThresholdChange(Number.isNaN(raw) ? 0 : raw)
    },
    [handleCorrelationThresholdChange]
  )

  const handleCorrelationSortChange = useCallback((event) => {
    setCorrelationSortKey(event.target.value)
  }, [])

  const hoveredCorrelationRow = hoveredCorrelationCell?.row ?? null
  const hoveredCorrelationColumn = hoveredCorrelationCell?.column ?? null

  const formatCorrelationValue = useCallback((value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '–'
    }
    return value.toFixed(2)
  }, [])

  const correlationColorForValue = useCallback((value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'transparent'
    }
    const intensity = Math.min(1, Math.abs(value))
    const opacity = 0.12 + intensity * 0.35
    if (value > 0) {
      return `rgba(34, 197, 94, ${opacity})`
    }
    if (value < 0) {
      return `rgba(239, 68, 68, ${opacity})`
    }
    return 'transparent'
  }, [])

  const orderedColumns = useMemo(() => {
    if (!rawColumns || rawColumns.length === 0) {
      return []
    }
    return [...rawColumns].sort((a, b) => {
      const orderA = typeof a.display?.order === 'number' ? a.display.order : 0
      const orderB = typeof b.display?.order === 'number' ? b.display.order : 0
      if (orderA === orderB) {
        return a.key.localeCompare(b.key)
      }
      return orderA - orderB
    })
  }, [rawColumns])

  const columns = orderedColumns

  const visibleColumns = useMemo(
    () => columns.filter((column) => column.display?.isVisible !== false),
    [columns]
  )

  const hiddenColumns = useMemo(
    () => columns.filter((column) => column.display?.isVisible === false),
    [columns]
  )

  const columnByKey = useMemo(() => {
    const map = new Map()
    columns.forEach((column) => {
      map.set(column.key, column)
    })
    return map
  }, [columns])

  const columnIndexMap = useMemo(() => {
    const map = new Map()
    visibleColumns.forEach((column, index) => {
      map.set(column.key, index)
    })
    return map
  }, [visibleColumns])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const columnRefs = useRef(new Map())
  const rowRefs = useRef(new Map())
  const duplicateGroups = duplicateInfo?.groups ?? []
  const duplicateRowCount = duplicateInfo?.flaggedIndices?.length ?? 0
  const duplicateMetaByIndex = duplicateInfo?.indexToGroup ?? new Map()
  const hasDuplicateSelection = duplicateKeyColumns.length > 0
  const hasDuplicates = duplicateGroups.length > 0

  useEffect(() => {
    setDuplicateActionFeedback(null)
  }, [duplicateKeyColumns, duplicateGroups.length])

  const handleDuplicateColumnToggle = useCallback(
    (columnKey, enabled) => {
      setDuplicateKeyColumns((previous) => {
        const current = Array.isArray(previous) ? previous : []
        if (enabled) {
          if (current.includes(columnKey)) {
            return current
          }
          return [...current, columnKey]
        }
        return current.filter((key) => key !== columnKey)
      })
    },
    [setDuplicateKeyColumns]
  )

  const handleDuplicateSelectAll = useCallback(() => {
    setDuplicateKeyColumns(columns.map((column) => column.key))
  }, [setDuplicateKeyColumns, columns])

  const handleDuplicateClear = useCallback(() => {
    setDuplicateKeyColumns([])
  }, [setDuplicateKeyColumns])

  const handleResolveDuplicatesAction = useCallback(
    (mode) => {
      const result = resolveDuplicates(mode)
      if (!result) {
        setDuplicateActionFeedback({ type: 'info', message: 'Keine Duplikate zum Bearbeiten gefunden.' })
        return
      }
      if (result.changed) {
        const parts = []
        if (result.removed > 0) {
          parts.push(
            `${result.removed} ${result.removed === 1 ? 'Zeile entfernt' : 'Zeilen entfernt'}`
          )
        }
        if (result.mode === 'merge' && result.mergedCells > 0) {
          parts.push(
            `${result.mergedCells} ${result.mergedCells === 1 ? 'Wert übernommen' : 'Werte übernommen'}`
          )
        }
        if (parts.length === 0) {
          parts.push('Keine Anpassungen erforderlich')
        }
        setDuplicateActionFeedback({
          type: 'success',
          message: `Duplikatbereinigung abgeschlossen (${parts.join(', ')}).`
        })
      } else {
        setDuplicateActionFeedback({ type: 'info', message: 'Keine Änderungen notwendig.' })
      }
    },
    [resolveDuplicates]
  )
  const [columnMeasurements, setColumnMeasurements] = useState({})
  const [rowMeasurements, setRowMeasurements] = useState({})
  const headerRef = useRef(null)
  const transformedHeaderRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [transformedHeaderHeight, setTransformedHeaderHeight] = useState(0)
  const [resizingColumn, setResizingColumn] = useState(null)
  const rowDisplayRaw = rowDisplay?.raw || {}
  const rowDisplayTransformed = rowDisplay?.transformed || {}
  const manualEditCount = manualEdits?.count || 0
  const manualEditMap = manualEdits?.map || {}

  const registerColumnRef = useCallback((key, node) => {
    if (!key) return
    if (node) {
      columnRefs.current.set(key, node)
    } else {
      columnRefs.current.delete(key)
    }
  }, [])

  const registerRowRef = useCallback((source, index, node) => {
    const key = `${source}-${index}`
    if (node) {
      rowRefs.current.set(key, node)
    } else {
      rowRefs.current.delete(key)
    }
  }, [])

  useLayoutEffect(() => {
    const measurements = {}
    columnRefs.current.forEach((node, key) => {
      const rect = node.getBoundingClientRect()
      measurements[key] = Math.ceil(rect.width)
    })
    setColumnMeasurements((prev) => {
      let changed = false
      const next = {}
      Object.entries(measurements).forEach(([key, value]) => {
        next[key] = value
        if (prev[key] !== value) {
          changed = true
        }
      })
      Object.keys(prev).forEach((key) => {
        if (!(key in measurements)) {
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [visibleColumns, previewEntries, transformedPreviewEntries])

  useLayoutEffect(() => {
    const measurements = {}
    rowRefs.current.forEach((node, key) => {
      const rect = node.getBoundingClientRect()
      measurements[key] = Math.ceil(rect.height)
    })
    setRowMeasurements((prev) => {
      let changed = false
      const next = {}
      Object.entries(measurements).forEach(([key, value]) => {
        next[key] = value
        if (prev[key] !== value) {
          changed = true
        }
      })
      Object.keys(prev).forEach((key) => {
        if (!(key in measurements)) {
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [previewEntries, transformedPreviewEntries])

  useLayoutEffect(() => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect()
      setHeaderHeight(Math.ceil(rect.height))
    }
  }, [visibleColumns, columnMeasurements])

  useLayoutEffect(() => {
    if (transformedHeaderRef.current) {
      const rect = transformedHeaderRef.current.getBoundingClientRect()
      setTransformedHeaderHeight(Math.ceil(rect.height))
    }
  }, [visibleColumns, columnMeasurements, transformedPreviewEntries])

  useEffect(() => {
    if (!resizingColumn) {
      return undefined
    }

    const handlePointerMove = (event) => {
      event.preventDefault()
      const delta = event.clientX - resizingColumn.startX
      const nextWidth = resizingColumn.startWidth + delta
      setColumnWidth(resizingColumn.columnKey, nextWidth)
    }

    const handlePointerUp = () => {
      setResizingColumn(null)
    }

    if (typeof document !== 'undefined') {
      const previous = document.body.style.userSelect
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp, { once: true })
      return () => {
        document.body.style.userSelect = previous
        window.removeEventListener('pointermove', handlePointerMove)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [resizingColumn, setColumnWidth])

  const getColumnWidth = useCallback(
    (columnKey) => {
      const column = columnByKey.get(columnKey)
      if (!column) {
        return DEFAULT_COLUMN_WIDTH
      }
      if (typeof column.display?.width === 'number' && Number.isFinite(column.display.width)) {
        return Math.max(MIN_COLUMN_WIDTH, column.display.width)
      }
      return columnMeasurements[columnKey] ?? DEFAULT_COLUMN_WIDTH
    },
    [columnByKey, columnMeasurements]
  )

  const handleColumnResizeStart = useCallback(
    (columnKey, event) => {
      event.preventDefault()
      event.stopPropagation()
      const startWidth = getColumnWidth(columnKey)
      setResizingColumn({ columnKey, startX: event.clientX, startWidth })
    },
    [getColumnWidth]
  )

  const handleColumnDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      if (!active || !over || active.id === over.id) {
        return
      }
      const currentIndex = visibleColumns.findIndex((column) => column.key === active.id)
      const newIndex = visibleColumns.findIndex((column) => column.key === over.id)
      if (currentIndex === -1 || newIndex === -1) {
        return
      }
      const reordered = arrayMove(visibleColumns.map((column) => column.key), currentIndex, newIndex)
      reorderColumns(reordered)
    },
    [visibleColumns, reorderColumns]
  )

  const pinnedLeftOffsets = useMemo(() => {
    let offset = ACTION_COLUMN_WIDTH
    const offsets = new Map()
    visibleColumns.forEach((column) => {
      if (column.display?.pinned === 'left') {
        offsets.set(column.key, offset)
        offset += getColumnWidth(column.key)
      }
    })
    return offsets
  }, [visibleColumns, getColumnWidth])

  const pinnedRightOffsets = useMemo(() => {
    let offset = 0
    const offsets = new Map()
    const reversed = [...visibleColumns].reverse()
    reversed.forEach((column) => {
      if (column.display?.pinned === 'right') {
        offsets.set(column.key, offset)
        offset += getColumnWidth(column.key)
      }
    })
    return offsets
  }, [visibleColumns, getColumnWidth])

  const pinnedRawRowOffsets = useMemo(() => {
    let offset = headerHeight
    const offsets = new Map()
    previewEntries.forEach((entry) => {
      if (rowDisplayRaw[entry.index]?.pinned) {
        const height = rowMeasurements[`raw-${entry.index}`] ?? DEFAULT_ROW_HEIGHT
        offsets.set(entry.index, offset)
        offset += height
      }
    })
    return offsets
  }, [previewEntries, rowDisplayRaw, rowMeasurements, headerHeight])

  const pinnedTransformedRowOffsets = useMemo(() => {
    let offset = transformedHeaderHeight
    const offsets = new Map()
    transformedPreviewEntries.forEach((entry) => {
      if (rowDisplayTransformed[entry.index]?.pinned) {
        const height = rowMeasurements[`transformed-${entry.index}`] ?? DEFAULT_ROW_HEIGHT
        offsets.set(entry.index, offset)
        offset += height
      }
    })
    return offsets
  }, [transformedPreviewEntries, rowDisplayTransformed, rowMeasurements, transformedHeaderHeight])

  const hiddenRawRowIndices = useMemo(() => {
    return Object.entries(rowDisplayRaw)
      .filter(([, value]) => value?.hidden)
      .map(([key]) => Number(key))
      .filter((index) => Number.isInteger(index))
      .sort((a, b) => a - b)
  }, [rowDisplayRaw])

  const hiddenTransformedRowIndices = useMemo(() => {
    return Object.entries(rowDisplayTransformed)
      .filter(([, value]) => value?.hidden)
      .map(([key]) => Number(key))
      .filter((index) => Number.isInteger(index))
      .sort((a, b) => a - b)
  }, [rowDisplayTransformed])

  const handleToggleColumnPinned = useCallback(
    (columnKey) => {
      const column = columnByKey.get(columnKey)
      const current = column?.display?.pinned
      const nextPinned = current === 'left' ? 'right' : current === 'right' ? null : 'left'
      setColumnPinned(columnKey, nextPinned)
    },
    [columnByKey, setColumnPinned]
  )

  const handleHideColumn = useCallback(
    (columnKey) => {
      setColumnVisibility(columnKey, false)
    },
    [setColumnVisibility]
  )

  const handleShowColumn = useCallback(
    (columnKey) => {
      setColumnVisibility(columnKey, true)
    },
    [setColumnVisibility]
  )

  const handleToggleRowHidden = useCallback(
    (source, rowIndex) => {
      const sourceState = source === 'transformed' ? rowDisplayTransformed : rowDisplayRaw
      const isHidden = sourceState[rowIndex]?.hidden === true
      setRowHidden(source, rowIndex, !isHidden)
    },
    [rowDisplayRaw, rowDisplayTransformed, setRowHidden]
  )

  const handleToggleRowPinned = useCallback(
    (source, rowIndex) => {
      const sourceState = source === 'transformed' ? rowDisplayTransformed : rowDisplayRaw
      const isPinned = sourceState[rowIndex]?.pinned === true
      setRowPinned(source, rowIndex, !isPinned)
    },
    [rowDisplayRaw, rowDisplayTransformed, setRowPinned]
  )

  useEffect(() => {
    if (columns.length === 0) {
      if (profilingColumnKey !== null) {
        setProfilingColumnKey(null)
      }
      return
    }

    const exists = columns.some((column) => column.key === profilingColumnKey)
    if (!exists) {
      setProfilingColumnKey(columns[0].key)
    }
  }, [columns, profilingColumnKey])

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
  const profilingNumericRatio =
    profilingFilledCount > 0
      ? (profilingColumn?.numericCount ?? 0) / profilingFilledCount
      : null
  const profilingTextRatio =
    profilingFilledCount > 0
      ? (profilingColumn?.textCount ?? 0) / profilingFilledCount
      : null

  const focusCellElement = useCallback((rowIndex, columnKey) => {
    if (typeof document === 'undefined') return
    const selector = `button[data-row-index="${rowIndex}"][data-column-key="${columnKey}"]`
    const element = document.querySelector(selector)
    if (element) {
      element.focus()
    }
  }, [])

  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false)
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    const pending = pendingFocusRef.current
    if (pending) {
      pendingFocusRef.current = null
      focusCellElement(pending.rowIndex, pending.columnKey)
    }
  }, [selectionState, focusCellElement])

  useEffect(() => {
    setSelectionState((previous) => {
      if (!previous.anchor || !previous.focus) {
        return previous
      }

      const remapTarget = (target) => {
        const rowPosition = previewEntries.findIndex((entry) => entry.index === target.rowIndex)
        if (rowPosition === -1) {
          return null
        }
        const columnIndex = columnIndexMap.get(target.columnKey)
        if (columnIndex === undefined) {
          return null
        }
        if (rowPosition === target.rowPosition && columnIndex === target.columnIndex) {
          return target
        }
        return { ...target, rowPosition, columnIndex }
      }

      const anchor = remapTarget(previous.anchor)
      const focus = remapTarget(previous.focus)

      if (!anchor || !focus) {
        return { anchor: null, focus: null }
      }

      if (
        anchor === previous.anchor &&
        focus === previous.focus
      ) {
        return previous
      }

      if (
        anchor.rowPosition === previous.anchor.rowPosition &&
        anchor.columnIndex === previous.anchor.columnIndex &&
        focus.rowPosition === previous.focus.rowPosition &&
        focus.columnIndex === previous.focus.columnIndex
      ) {
        return previous
      }

      return { anchor, focus }
    })
  }, [previewEntries, columnIndexMap])

  const createCellTarget = useCallback(
    (rowIndex, rowPosition, columnKey) => {
      const columnIndex = columnIndexMap.get(columnKey)
      return {
        rowIndex,
        rowPosition,
        columnKey,
        columnIndex:
          columnIndex === undefined ? visibleColumns.findIndex((column) => column.key === columnKey) : columnIndex
      }
    },
    [columnIndexMap, visibleColumns]
  )

  const selectedRange = useMemo(() => {
    if (!selectionState.anchor || !selectionState.focus) {
      return null
    }
    const rowStart = Math.min(selectionState.anchor.rowPosition, selectionState.focus.rowPosition)
    const rowEnd = Math.max(selectionState.anchor.rowPosition, selectionState.focus.rowPosition)
    const columnStart = Math.min(selectionState.anchor.columnIndex, selectionState.focus.columnIndex)
    const columnEnd = Math.max(selectionState.anchor.columnIndex, selectionState.focus.columnIndex)

    if (rowStart < 0 || columnStart < 0) {
      return null
    }

    return {
      rowStart,
      rowEnd,
      columnStart,
      columnEnd
    }
  }, [selectionState])

  const selectedTargets = useMemo(() => {
    if (!selectedRange) {
      return []
    }
    const targets = []
    for (let rowPosition = selectedRange.rowStart; rowPosition <= selectedRange.rowEnd; rowPosition += 1) {
      const entry = previewEntries[rowPosition]
      if (!entry) continue
      for (let columnIndex = selectedRange.columnStart; columnIndex <= selectedRange.columnEnd; columnIndex += 1) {
        const column = visibleColumns[columnIndex]
        if (!column) continue
        targets.push({
          rowIndex: entry.index,
          rowPosition,
          columnKey: column.key,
          columnIndex
        })
      }
    }
    return targets
  }, [selectedRange, previewEntries, visibleColumns])

  const selectedCellSet = useMemo(() => {
    if (!selectedTargets || selectedTargets.length === 0) {
      return new Set()
    }
    const cellSet = new Set()
    selectedTargets.forEach((target) => {
      cellSet.add(`${target.rowIndex}::${target.columnKey}`)
    })
    return cellSet
  }, [selectedTargets])

  const hasSelection = selectedTargets.length > 0

  const activeCell = useMemo(() => selectionState.focus || selectionState.anchor, [selectionState])

  const getDisplayValueForCell = useCallback(
    (cell) => {
      if (!cell) {
        return ''
      }
      const formula = getCellFormula(cell.rowIndex, cell.columnKey)
      if (formula) {
        return formula
      }
      let entry = null
      if (typeof cell.rowPosition === 'number') {
        entry = previewEntries[cell.rowPosition]
      }
      if (!entry || entry.index !== cell.rowIndex) {
        entry = previewEntries.find((item) => item.index === cell.rowIndex)
      }
      const value = entry?.row?.[cell.columnKey]
      if (value === null || value === undefined) {
        return ''
      }
      return String(value)
    },
    [getCellFormula, previewEntries]
  )

  useEffect(() => {
    if (isFormulaEditing) {
      return
    }
    setSuppressFormulaSuggestions(true)
    setFormulaCaretPosition(null)
    setFormulaInputValue(getDisplayValueForCell(activeCell))
  }, [activeCell, getDisplayValueForCell, isFormulaEditing])

  useEffect(() => {
    formulaEditingRef.current = isFormulaEditing
  }, [isFormulaEditing])

  const activeCellLabel = useMemo(() => {
    if (!activeCell || !Number.isInteger(activeCell.rowIndex) || !Number.isInteger(activeCell.columnIndex)) {
      return ''
    }
    return formatCellReference(activeCell.columnIndex, activeCell.rowIndex)
  }, [activeCell])

  const selectionReference = useMemo(() => {
    if (!selectedTargets || selectedTargets.length === 0) {
      return ''
    }
    let minRow = Infinity
    let maxRow = -Infinity
    let minCol = Infinity
    let maxCol = -Infinity
    selectedTargets.forEach((target) => {
      if (Number.isInteger(target.rowIndex)) {
        minRow = Math.min(minRow, target.rowIndex)
        maxRow = Math.max(maxRow, target.rowIndex)
      }
      if (Number.isInteger(target.columnIndex)) {
        minCol = Math.min(minCol, target.columnIndex)
        maxCol = Math.max(maxCol, target.columnIndex)
      }
    })
    if (!Number.isFinite(minRow) || !Number.isFinite(maxRow) || !Number.isFinite(minCol) || !Number.isFinite(maxCol)) {
      return ''
    }
    return formatRangeReference(minCol, minRow, maxCol, maxRow)
  }, [selectedTargets])

  const activeFormulaError = useMemo(() => {
    if (!activeCell) {
      return ''
    }
    const rowKey = String(activeCell.rowIndex)
    return formulaErrors?.[rowKey]?.[activeCell.columnKey] || ''
  }, [activeCell, formulaErrors])

  const formulaSuggestionContext = useMemo(() => {
    if (suppressFormulaSuggestions) {
      return null
    }
    if (typeof formulaInputValue !== 'string') {
      return null
    }
    if (!formulaInputValue.startsWith('=')) {
      return null
    }
    if (!Number.isInteger(formulaCaretPosition)) {
      return null
    }
    const clampedCaret = Math.min(
      Math.max(formulaCaretPosition, 1),
      formulaInputValue.length
    )
    if (clampedCaret < 1) {
      return null
    }
    const query = formulaInputValue.slice(1, clampedCaret)
    if (!/^[A-Za-z]*$/.test(query)) {
      return null
    }
    return {
      query,
      start: 1,
      end: clampedCaret
    }
  }, [formulaInputValue, formulaCaretPosition, suppressFormulaSuggestions])

  const formulaSuggestions = useMemo(() => {
    if (!formulaSuggestionContext) {
      return []
    }
    const normalizedQuery = formulaSuggestionContext.query.toLowerCase()
    return AVAILABLE_FORMULAS.filter((formula) =>
      formula.name.toLowerCase().startsWith(normalizedQuery)
    )
  }, [formulaSuggestionContext])

  const suggestionsOpen = formulaSuggestionContext && formulaSuggestions.length > 0

  useEffect(() => {
    if (!suggestionsOpen) {
      setActiveSuggestionIndex(0)
      return
    }
    setActiveSuggestionIndex((previous) => {
      if (previous < 0 || previous >= formulaSuggestions.length) {
        return 0
      }
      return previous
    })
  }, [suggestionsOpen, formulaSuggestions.length])

  const highlightedSuggestionIndex = suggestionsOpen
    ? Math.min(activeSuggestionIndex, formulaSuggestions.length - 1)
    : -1

  const activeSuggestion =
    highlightedSuggestionIndex >= 0 ? formulaSuggestions[highlightedSuggestionIndex] : null

  const typedFunctionName = useMemo(() => {
    if (typeof formulaInputValue !== 'string') {
      return ''
    }
    const trimmed = formulaInputValue.trim()
    if (!trimmed.startsWith('=')) {
      return ''
    }
    const match = trimmed.slice(1).match(/^([A-Za-z_][A-Za-z0-9_]*)/)
    if (!match) {
      return ''
    }
    return match[1].toUpperCase()
  }, [formulaInputValue])

  const currentFormulaHelp = useMemo(() => {
    if (activeSuggestion) {
      return activeSuggestion
    }
    if (!typedFunctionName) {
      return null
    }
    return formulaMetadataByName.get(typedFunctionName) || null
  }, [activeSuggestion, typedFunctionName, formulaMetadataByName])

  const hasActiveCell = Boolean(activeCell)

  const handleFormulaSelectionChange = useCallback((event) => {
    const target = event?.target
    if (!target) {
      return
    }
    const position =
      typeof target.selectionStart === 'number'
        ? target.selectionStart
        : target.value?.length ?? 0
    setFormulaCaretPosition(position)
  }, [])

  const applyFormulaSuggestion = useCallback(
    (suggestion) => {
      if (!suggestion) {
        return
      }
      let nextCursorPosition = null
      setFormulaInputValue((previous) => {
        const baseText = typeof previous === 'string' ? previous : ''
        const ensuredBase = baseText.startsWith('=') ? baseText : `=${baseText}`
        const context = formulaSuggestionContext || { start: 1, end: 1 }
        const safeStart = Math.max(1, Math.min(context.start, ensuredBase.length))
        const safeEnd = Math.max(safeStart, Math.min(context.end, ensuredBase.length))
        const before = ensuredBase.slice(0, safeStart)
        const after = ensuredBase.slice(safeEnd)
        const insertion = `${suggestion.name}()`
        nextCursorPosition = before.length + suggestion.name.length + 1
        const schedule =
          typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame
            : (callback) => setTimeout(callback, 0)
        schedule(() => {
          if (formulaInputRef.current) {
            formulaInputRef.current.focus()
            formulaInputRef.current.setSelectionRange(nextCursorPosition, nextCursorPosition)
          }
        })
        return `${before}${insertion}${after}`
      })
      if (nextCursorPosition !== null) {
        setFormulaCaretPosition(nextCursorPosition)
      }
      setSuppressFormulaSuggestions(true)
      setActiveSuggestionIndex(0)
      formulaEditingRef.current = true
      setIsFormulaEditing(true)
    },
    [formulaSuggestionContext, formulaInputRef]
  )

  const handleFormulaInputChange = useCallback((event) => {
    const { value, selectionStart } = event.target
    setSuppressFormulaSuggestions(false)
    setFormulaInputValue(value)
    if (typeof selectionStart === 'number') {
      setFormulaCaretPosition(selectionStart)
    } else {
      setFormulaCaretPosition(value.length)
    }
  }, [])

  const handleFormulaFocus = useCallback((event) => {
    formulaEditingRef.current = true
    setIsFormulaEditing(true)
    setSuppressFormulaSuggestions(false)
    if (event?.target) {
      const position =
        typeof event.target.selectionStart === 'number'
          ? event.target.selectionStart
          : event.target.value?.length ?? 0
      setFormulaCaretPosition(position)
    }
  }, [])

  const handleFormulaCancel = useCallback(() => {
    formulaEditingRef.current = false
    setIsFormulaEditing(false)
    setSuppressFormulaSuggestions(true)
    setFormulaCaretPosition(null)
    setFormulaInputValue(getDisplayValueForCell(activeCell))
    if (formulaInputRef.current) {
      formulaInputRef.current.blur()
    }
  }, [activeCell, getDisplayValueForCell])

  const applyFormulaInput = useCallback(() => {
    if (!activeCell) {
      return
    }
    const rawValue = formulaInputValue ?? ''
    const textValue = typeof rawValue === 'string' ? rawValue : String(rawValue)
    const trimmed = textValue.trim()
    const columnInfo =
      Number.isInteger(activeCell.columnIndex) && activeCell.columnIndex >= 0
        ? visibleColumns[activeCell.columnIndex]
        : null

    if (trimmed.startsWith('=')) {
      setCellFormula(activeCell.rowIndex, activeCell.columnKey, trimmed)
    } else {
      clearCellFormula(activeCell.rowIndex, activeCell.columnKey)
      let valueToSet = textValue
      if (columnInfo?.type === 'number') {
        if (trimmed === '') {
          valueToSet = ''
        } else {
          const numeric = Number(trimmed.replace(',', '.'))
          valueToSet = Number.isNaN(numeric) ? textValue : numeric
        }
      }
      updateCellValue(activeCell.rowIndex, activeCell.columnKey, valueToSet)
    }
    formulaEditingRef.current = false
    setIsFormulaEditing(false)
    setSuppressFormulaSuggestions(true)
    setFormulaCaretPosition(null)
  }, [activeCell, formulaInputValue, visibleColumns, setCellFormula, clearCellFormula, updateCellValue])

  const handleFormulaBlur = useCallback(() => {
    if (!formulaEditingRef.current) {
      return
    }
    setSuppressFormulaSuggestions(true)
    applyFormulaInput()
  }, [applyFormulaInput])

  const handleFormulaKeyDown = useCallback(
    (event) => {
      if (suggestionsOpen && formulaSuggestions.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setActiveSuggestionIndex((previous) => {
            if (formulaSuggestions.length === 0) {
              return 0
            }
            const nextIndex = previous + 1
            return nextIndex >= formulaSuggestions.length ? 0 : nextIndex
          })
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setActiveSuggestionIndex((previous) => {
            if (formulaSuggestions.length === 0) {
              return 0
            }
            const nextIndex = previous - 1
            return nextIndex < 0 ? formulaSuggestions.length - 1 : nextIndex
          })
          return
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          const suggestion =
            (highlightedSuggestionIndex >= 0
              ? formulaSuggestions[highlightedSuggestionIndex]
              : formulaSuggestions[0]) || null
          applyFormulaSuggestion(suggestion)
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          setSuppressFormulaSuggestions(true)
          return
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        applyFormulaInput()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleFormulaCancel()
      }
    },
    [
      applyFormulaInput,
      applyFormulaSuggestion,
      formulaSuggestions,
      handleFormulaCancel,
      highlightedSuggestionIndex,
      suggestionsOpen
    ]
  )

  const handleInsertRange = useCallback(() => {
    if (!selectionReference) {
      return
    }
    let nextCursorPosition = null
    setFormulaInputValue((previous) => {
      const base = typeof previous === 'string' ? previous : ''
      const inputElement = formulaInputRef.current
      const schedule =
        typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame
          : (callback) => setTimeout(callback, 0)
      if (!base.trim()) {
        if (inputElement) {
          schedule(() => {
            inputElement.focus()
            const position = selectionReference.length + 1
            inputElement.setSelectionRange(position, position)
            setFormulaCaretPosition(position)
          })
        }
        nextCursorPosition = selectionReference.length + 1
        return `=${selectionReference}`
      }
      if (!inputElement) {
        nextCursorPosition = base.length + selectionReference.length
        return `${base}${selectionReference}`
      }
      const start = inputElement.selectionStart ?? base.length
      const end = inputElement.selectionEnd ?? base.length
      const next = `${base.slice(0, start)}${selectionReference}${base.slice(end)}`
      schedule(() => {
        inputElement.focus()
        const position = start + selectionReference.length
        inputElement.setSelectionRange(position, position)
        setFormulaCaretPosition(position)
      })
      nextCursorPosition = start + selectionReference.length
      return next
    })
    if (nextCursorPosition !== null) {
      setFormulaCaretPosition(nextCursorPosition)
    }
    formulaEditingRef.current = true
    setIsFormulaEditing(true)
    setSuppressFormulaSuggestions(false)
    if (formulaInputRef.current) {
      formulaInputRef.current.focus()
    }
  }, [selectionReference])

  const moveSelection = useCallback(
    (deltaRow, deltaColumn, extend) => {
      setSelectionState((previous) => {
        const current = previous.focus || previous.anchor
        if (!current) {
          return previous
        }

        const nextRowPosition = Math.max(
          0,
          Math.min(previewEntries.length - 1, current.rowPosition + deltaRow)
        )
        const nextColumnIndex = Math.max(
          0,
          Math.min(visibleColumns.length - 1, current.columnIndex + deltaColumn)
        )

        const entry = previewEntries[nextRowPosition]
        const column = visibleColumns[nextColumnIndex]
        if (!entry || !column) {
          return previous
        }

        const nextTarget = {
          rowIndex: entry.index,
          rowPosition: nextRowPosition,
          columnKey: column.key,
          columnIndex: nextColumnIndex
        }

        pendingFocusRef.current = nextTarget

        if (
          previous.focus &&
          previous.focus.rowIndex === nextTarget.rowIndex &&
          previous.focus.columnKey === nextTarget.columnKey &&
          previous.focus.rowPosition === nextTarget.rowPosition &&
          previous.focus.columnIndex === nextTarget.columnIndex &&
          extend
        ) {
          return previous
        }

        const anchor = extend && previous.anchor ? previous.anchor : nextTarget
        return { anchor, focus: nextTarget }
      })
    },
    [previewEntries, visibleColumns]
  )

  const handleCellMouseDown = useCallback(
    (event, entry, rowPosition, columnKey) => {
      const target = createCellTarget(entry.index, rowPosition, columnKey)
      pendingFocusRef.current = target
      setIsSelecting(true)
      setSelectionState((previous) => {
        const extend = Boolean(event.shiftKey && previous.anchor)
        const anchor = extend && previous.anchor ? previous.anchor : target
        if (
          previous.focus &&
          previous.focus.rowIndex === target.rowIndex &&
          previous.focus.columnKey === target.columnKey &&
          previous.focus.rowPosition === target.rowPosition &&
          previous.focus.columnIndex === target.columnIndex &&
          anchor === previous.anchor
        ) {
          return previous
        }
        return { anchor, focus: target }
      })
    },
    [createCellTarget]
  )

  const handleCellMouseEnter = useCallback(
    (entry, rowPosition, columnKey) => {
      if (!isSelecting) return
      const target = createCellTarget(entry.index, rowPosition, columnKey)
      setSelectionState((previous) => {
        if (!previous.anchor) {
          return previous
        }
        if (
          previous.focus &&
          previous.focus.rowIndex === target.rowIndex &&
          previous.focus.columnKey === target.columnKey &&
          previous.focus.rowPosition === target.rowPosition &&
          previous.focus.columnIndex === target.columnIndex
        ) {
          return previous
        }
        return { anchor: previous.anchor, focus: target }
      })
    },
    [isSelecting, createCellTarget]
  )

  const handleCellKeyDown = useCallback(
    (event, entry, rowPosition, columnKey) => {
      if (event.key === 'Enter') {
        startEditCell(entry, columnKey, rowPosition)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveSelection(-1, 0, event.shiftKey)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveSelection(1, 0, event.shiftKey)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        moveSelection(0, -1, event.shiftKey)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        moveSelection(0, 1, event.shiftKey)
      }
    },
    [moveSelection, startEditCell]
  )

  const selectedColumnOrder = useMemo(() => visibleColumns.map((column) => column.key), [visibleColumns])

  const handleFillSelection = useCallback(() => {
    if (!hasSelection) return
    const value = window.prompt('Welcher Wert soll in den ausgewählten Zellen gesetzt werden?', '')
    if (value === null) return
    const updates = selectedTargets.map((target) => ({ rowIndex: target.rowIndex, columnKey: target.columnKey, value }))
    if (updates.length === 0) return
    updateCell({ type: 'set', updates })
  }, [hasSelection, selectedTargets, updateCell])

  const handleClearSelection = useCallback(() => {
    if (!hasSelection) return
    const updates = selectedTargets.map((target) => ({ rowIndex: target.rowIndex, columnKey: target.columnKey, value: '' }))
    if (updates.length === 0) return
    updateCell({ type: 'set', updates })
  }, [hasSelection, selectedTargets, updateCell])

  const handleIncrementSelection = useCallback(() => {
    if (!hasSelection) return
    const input = window.prompt('Um welchen Wert sollen die ausgewählten Zellen inkrementiert werden?', '1')
    if (input === null) return
    const amount = Number(input)
    if (!Number.isFinite(amount)) {
      window.alert('Bitte geben Sie eine gültige Zahl ein.')
      return
    }
    const updates = selectedTargets.map((target) => ({ rowIndex: target.rowIndex, columnKey: target.columnKey }))
    updateCell({ type: 'increment', amount, updates })
  }, [hasSelection, selectedTargets, updateCell])

  const handleFillSeries = useCallback(
    (orientationHint = 'vertical') => {
      if (!hasSelection || !selectedRange) {
        return
      }

      const resolveValueForTarget = (target) => {
        const entry = previewEntries[target.rowPosition]
        if (!entry || !entry.row) {
          return undefined
        }
        return entry.row[target.columnKey]
      }

      let orientation = orientationHint
      if (orientation === 'auto') {
        const rowSpan = selectedRange.rowEnd - selectedRange.rowStart + 1
        const columnSpan = selectedRange.columnEnd - selectedRange.columnStart + 1
        orientation = rowSpan >= columnSpan ? 'vertical' : 'horizontal'
      }

      const groups = []
      if (orientation === 'horizontal') {
        const rowMap = new Map()
        selectedTargets.forEach((target) => {
          if (!rowMap.has(target.rowIndex)) {
            rowMap.set(target.rowIndex, [])
          }
          rowMap.get(target.rowIndex).push(target)
        })
        rowMap.forEach((targets, key) => {
          groups.push({ key: String(key), targets, orientation: 'horizontal' })
        })
      } else {
        const columnMap = new Map()
        selectedTargets.forEach((target) => {
          if (!columnMap.has(target.columnKey)) {
            columnMap.set(target.columnKey, [])
          }
          columnMap.get(target.columnKey).push(target)
        })
        columnMap.forEach((targets, key) => {
          groups.push({ key, targets, orientation: 'vertical' })
        })
      }

      if (groups.length === 0) {
        return
      }

      const series = []
      const updates = []
      let cancelled = false

      groups.forEach((group) => {
        if (cancelled) {
          return
        }

        const sortedTargets = [...group.targets].sort((a, b) => {
          if (group.orientation === 'horizontal') {
            if (a.columnIndex === b.columnIndex) {
              return a.rowPosition - b.rowPosition
            }
            return a.columnIndex - b.columnIndex
          }
          if (a.rowPosition === b.rowPosition) {
            return a.columnIndex - b.columnIndex
          }
          return a.rowPosition - b.rowPosition
        })

        let seedsFound = 0
        const cells = sortedTargets.map((target, index) => {
          const value = resolveValueForTarget(target)
          let isSeed = false
          if (!isCellValueEmpty(value) && seedsFound < 2) {
            isSeed = true
            seedsFound += 1
          }
          return {
            rowIndex: target.rowIndex,
            columnKey: target.columnKey,
            order: index,
            isSeed,
            rowPosition: target.rowPosition,
            columnIndex: target.columnIndex
          }
        })

        const fillCells = cells.filter((cell) => !cell.isSeed)
        if (fillCells.length === 0) {
          return
        }

        let manualStep = null
        if (seedsFound > 0 && seedsFound < 2) {
          const label =
            group.orientation === 'vertical'
              ? `Spalte „${group.key}“`
              : `Zeile ${sortedTargets[0] ? sortedTargets[0].rowIndex + 1 : group.key}`
          const input = window.prompt(
            `Nur ein Startwert für ${label} gefunden. Bitte Schrittweite oder Muster angeben (z. B. 1, 0.5, 1d, 30m).`,
            '1'
          )
          if (input === null) {
            cancelled = true
            return
          }
          if (!input.trim()) {
            window.alert('Bitte geben Sie eine gültige Schrittweite ein.')
            cancelled = true
            return
          }
          manualStep = input.trim()
        }

        const seriesLabel =
          group.orientation === 'vertical'
            ? group.key
            : `Zeile ${sortedTargets[0] ? sortedTargets[0].rowIndex + 1 : group.key}`

        series.push({
          key: `${group.orientation}-${group.key}`,
          label: seriesLabel,
          direction: group.orientation,
          manualStep: manualStep || undefined,
          cells
        })

        fillCells.forEach((cell) => {
          updates.push({ rowIndex: cell.rowIndex, columnKey: cell.columnKey })
        })
      })

      if (cancelled) {
        return
      }

      if (updates.length === 0) {
        window.alert('Keine Zellen zum Ausfüllen erkannt.')
        return
      }

      updateCell({ type: 'fillSeries', updates, series })
    },
    [hasSelection, selectedRange, selectedTargets, previewEntries, updateCell]
  )

  const handleCopyFromDirection = useCallback(
    (direction) => {
      if (!hasSelection) return
      const updates = selectedTargets
        .map((target) => {
          if (direction === 'up') {
            const sourceRowPosition = target.rowPosition - 1
            if (sourceRowPosition < 0) return null
            const sourceEntry = previewEntries[sourceRowPosition]
            if (!sourceEntry) return null
            return {
              rowIndex: target.rowIndex,
              columnKey: target.columnKey,
              source: { rowIndex: sourceEntry.index, columnKey: target.columnKey }
            }
          }
          if (direction === 'down') {
            const sourceRowPosition = target.rowPosition + 1
            if (sourceRowPosition >= previewEntries.length) return null
            const sourceEntry = previewEntries[sourceRowPosition]
            if (!sourceEntry) return null
            return {
              rowIndex: target.rowIndex,
              columnKey: target.columnKey,
              source: { rowIndex: sourceEntry.index, columnKey: target.columnKey }
            }
          }
          if (direction === 'left') {
            const sourceColumnIndex = target.columnIndex - 1
            if (sourceColumnIndex < 0) return null
            const sourceColumn = visibleColumns[sourceColumnIndex]
            if (!sourceColumn) return null
            return {
              rowIndex: target.rowIndex,
              columnKey: target.columnKey,
              source: { rowIndex: target.rowIndex, columnKey: sourceColumn.key }
            }
          }
          if (direction === 'right') {
            const sourceColumnIndex = target.columnIndex + 1
            if (sourceColumnIndex >= visibleColumns.length) return null
            const sourceColumn = visibleColumns[sourceColumnIndex]
            if (!sourceColumn) return null
            return {
              rowIndex: target.rowIndex,
              columnKey: target.columnKey,
              source: { rowIndex: target.rowIndex, columnKey: sourceColumn.key }
            }
          }
          return null
        })
        .filter(Boolean)
      if (updates.length === 0) return
      updateCell({ type: 'copy', updates, columnOrder: selectedColumnOrder, direction })
    },
    [hasSelection, selectedTargets, previewEntries, visibleColumns, updateCell, selectedColumnOrder]
  )

  const schedulePersist = useCallback(() => {
    if (!onImportStateChange) return
    setTimeout(() => {
      const state = getImportState()
      onImportStateChange({ ...state, stateVersion: Date.now() })
    }, 0)
  }, [onImportStateChange, getImportState])

  const handleOpenFindReplace = useCallback(() => {
    if (!canOpenFindReplace) {
      return
    }
    const scope =
      activeSearchMatch?.scope === 'transformed' && canReplaceInTransformed ? 'transformed' : 'raw'
    setFindReplaceDefaultScope(scope)
    setIsFindReplaceOpen(true)
  }, [canOpenFindReplace, activeSearchMatch, canReplaceInTransformed])
  const handleModalMatchFocus = useCallback(
    (match) => {
      if (!match) {
        return
      }
      const index = searchMatches.findIndex(
        (candidate) =>
          candidate.scope === match.scope &&
          candidate.rowIndex === match.rowIndex &&
          candidate.columnKey === match.columnKey
      )
      if (index >= 0) {
        setActiveSearchMatchIndex(index)
      }
    },
    [searchMatches]
  )

  const handleFindReplaceConfirm = useCallback(
    ({ scope, replacement }) => {
      if (!activeSearchConfig?.isActive) {
        return { applied: false, reason: 'Suchkonfiguration ist inaktiv.' }
      }

      const targetScope = scope === 'transformed' && canReplaceInTransformed ? 'transformed' : 'raw'
      const scopeMatches =
        targetScope === 'transformed' ? findReplaceData.transformed.matches : findReplaceData.raw.matches

      if (!Array.isArray(scopeMatches) || scopeMatches.length === 0) {
        return { applied: false, reason: 'Keine Treffer im ausgewählten Pfad.' }
      }

      const state = getImportState()
      const rawRows = Array.isArray(state?.rows) ? state.rows : []
      if (rawRows.length === 0) {
        return { applied: false, reason: 'Keine Datenzeilen vorhanden.' }
      }

      const updates = []
      const previousValues = []

      scopeMatches.forEach((match) => {
        const { rowIndex, columnKey } = match
        if (rowIndex < 0 || rowIndex >= rawRows.length) {
          return
        }
        const formattedCurrent =
          match.formattedValue === null || match.formattedValue === undefined
            ? ''
            : typeof match.formattedValue === 'string'
              ? match.formattedValue
              : String(match.formattedValue)
        const nextValue = applyReplacementToText(formattedCurrent, activeSearchConfig, replacement)
        if (nextValue === formattedCurrent) {
          return
        }

        const originalValue = rawRows[rowIndex]?.[columnKey]
        const normalizedNext = typeof nextValue === 'string' ? nextValue : String(nextValue)
        const trimmedNext = normalizedNext.trim()

        if (typeof originalValue === 'number' && trimmedNext !== '') {
          const numericCandidate = Number(normalizedNext)
          if (Number.isFinite(numericCandidate)) {
            updates.push({ rowIndex, columnKey, value: numericCandidate })
            previousValues.push({ rowIndex, columnKey, previousValue: originalValue })
            return
          }
        }

        updates.push({ rowIndex, columnKey, value: normalizedNext })
        previousValues.push({ rowIndex, columnKey, previousValue: originalValue })
      })

      if (updates.length === 0) {
        return { applied: false, reason: 'Keine ersetzbaren Werte gefunden.' }
      }

      updateCell({ type: 'set', updates })
      findReplaceHistoryRef.current = [
        ...findReplaceHistoryRef.current,
        {
          type: 'bulkReplace',
          timestamp: Date.now(),
          scope: targetScope,
          searchQuery,
          searchMode,
          searchColumns,
          replacement,
          updates,
          previousValues
        }
      ]
      setIsFindReplaceOpen(false)
      return { applied: true, updatedCells: updates.length }
    },
    [
      activeSearchConfig,
      canReplaceInTransformed,
      findReplaceData,
      getImportState,
      searchColumns,
      searchMode,
      searchQuery,
      updateCell
    ]
  )

  const parseFile = useCallback(
    async (file) => {
      if (!file) return
      await internalParseFile(file)
      schedulePersist()
    },
    [internalParseFile, schedulePersist]
  )

  const updateMapping = useCallback(
    (changes) => {
      internalUpdateMapping(changes)
      schedulePersist()
    },
    [internalUpdateMapping, schedulePersist]
  )

  const updateTransformations = useCallback(
    (updater) => {
      internalUpdateTransformations(updater)
      schedulePersist()
    },
    [internalUpdateTransformations, schedulePersist]
  )

  const toggleValueColumn = useCallback(
    (columnKey) => {
      internalToggleValueColumn(columnKey)
      schedulePersist()
    },
    [internalToggleValueColumn, schedulePersist]
  )

  const reorderColumns = useCallback(
    (orderedKeys) => {
      internalReorderColumns(orderedKeys)
      schedulePersist()
    },
    [internalReorderColumns, schedulePersist]
  )

  const setColumnWidth = useCallback(
    (columnKey, width) => {
      internalSetColumnWidth(columnKey, width)
      schedulePersist()
    },
    [internalSetColumnWidth, schedulePersist]
  )

  const setColumnVisibility = useCallback(
    (columnKey, isVisible) => {
      internalSetColumnVisibility(columnKey, isVisible)
      schedulePersist()
    },
    [internalSetColumnVisibility, schedulePersist]
  )

  const setColumnPinned = useCallback(
    (columnKey, pinned) => {
      internalSetColumnPinned(columnKey, pinned)
      schedulePersist()
    },
    [internalSetColumnPinned, schedulePersist]
  )

  const setRowHidden = useCallback(
    (source, rowIndex, hidden) => {
      internalSetRowHidden(source, rowIndex, hidden)
      schedulePersist()
    },
    [internalSetRowHidden, schedulePersist]
  )

  const setRowPinned = useCallback(
    (source, rowIndex, pinned) => {
      internalSetRowPinned(source, rowIndex, pinned)
      schedulePersist()
    },
    [internalSetRowPinned, schedulePersist]
  )

  const updateCell = useCallback(
    (config, columnKey, value) => {
      internalUpdateCell(config, columnKey, value)
      schedulePersist()
    },
    [internalUpdateCell, schedulePersist]
  )

  const updateCellValue = useCallback(
    (rowIndex, columnKey, value, options) => {
      const changed = internalUpdateCellValue(rowIndex, columnKey, value, options)
      if (changed) {
        schedulePersist()
      }
      return changed
    },
    [internalUpdateCellValue, schedulePersist]
  )

  const setDuplicateKeyColumns = useCallback(
    (updater) => {
      internalSetDuplicateKeyColumns(updater)
      schedulePersist()
    },
    [internalSetDuplicateKeyColumns, schedulePersist]
  )

  const resolveDuplicates = useCallback(
    (mode) => {
      const result = internalResolveDuplicates(mode)
      if (result?.changed) {
        schedulePersist()
      }
      return result
    },
    [internalResolveDuplicates, schedulePersist]
  )

  const undoLastManualEdit = useCallback(() => {
    const result = internalUndoLastManualEdit()
    if (result?.undone) {
      schedulePersist()
    }
    return result
  }, [internalUndoLastManualEdit, schedulePersist])

  const handleResetWorkbench = useCallback(() => {
    reset()
    setEditingCell(null)
    setEditingValue('')
    if (onImportStateChange) {
      onImportStateChange(null)
    }
    if (onResetWorkbench) {
      onResetWorkbench()
    }
  }, [reset, onImportStateChange, onResetWorkbench])

  const handleSearchChange = useCallback(
    (event) => {
      setSearchQuery(event.target.value)
    },
    [setSearchQuery]
  )

  const handleSearchModeChange = useCallback(
    (event) => {
      setSearchMode(event.target.value)
      schedulePersist()
    },
    [setSearchMode, schedulePersist]
  )

  const handleSearchColumnToggle = useCallback(
    (columnKey, enabled) => {
      setSearchColumns((previous) => {
        if (enabled) {
          return [...previous, columnKey]
        }
        return previous.filter((key) => key !== columnKey)
      })
      schedulePersist()
    },
    [setSearchColumns, schedulePersist]
  )

  const handleSearchColumnsReset = useCallback(() => {
    setSearchColumns([])
    schedulePersist()
  }, [setSearchColumns, schedulePersist])

  const handleSortToggle = useCallback(
    (columnKey, event) => {
      if (!columnKey) return
      const isMultiSort = Boolean(event?.shiftKey || event?.metaKey || event?.ctrlKey)

      setSortConfig((previous) => {
        const current = Array.isArray(previous) ? previous : []
        const existingIndex = current.findIndex((entry) => entry.column === columnKey)
        const existing = existingIndex >= 0 ? current[existingIndex] : null
        const currentDirection = existing?.direction || 'none'
        const nextDirection = currentDirection === 'asc' ? 'desc' : currentDirection === 'desc' ? 'none' : 'asc'

        if (!isMultiSort) {
          if (nextDirection === 'none') {
            return []
          }
          return [{ column: columnKey, direction: nextDirection }]
        }

        const next = [...current]
        if (nextDirection === 'none') {
          if (existingIndex >= 0) {
            next.splice(existingIndex, 1)
          }
        } else if (existingIndex >= 0) {
          next[existingIndex] = { column: columnKey, direction: nextDirection }
        } else {
          next.push({ column: columnKey, direction: nextDirection })
        }
        return next
      })
      schedulePersist()
    },
    [setSortConfig, schedulePersist]
  )

  const startEditCell = useCallback(
    (entry, columnKey, rowPosition = 0) => {
      if (!entry) return
      const target = createCellTarget(entry.index, rowPosition, columnKey)
      pendingFocusRef.current = target
      setSelectionState({ anchor: target, focus: target })
      setEditingCell({ rowIndex: entry.index, columnKey })
      const currentValue = entry.row?.[columnKey]
      setEditingValue(currentValue === undefined || currentValue === null ? '' : String(currentValue))
    },
    [createCellTarget]
  )

  const cancelEdit = useCallback(() => {
    setEditingCell(null)
    setEditingValue('')
  }, [])

  const confirmEdit = useCallback(() => {
    if (!editingCell) return
    updateCellValue(editingCell.rowIndex, editingCell.columnKey, editingValue)
    cancelEdit()
  }, [editingCell, editingValue, updateCellValue, cancelEdit])

  const handleExportTransformed = useCallback(() => {
    if (!transformedRows || transformedRows.length === 0) {
      return
    }
    try {
      const csv = Papa.unparse(transformedRows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'daten'
      anchor.download = `${baseName}-transformiert.csv`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export der transformierten Daten fehlgeschlagen:', error)
    }
  }, [transformedRows, fileName])

  const numericColumns = useMemo(() => columns.filter((column) => column.type === 'number'), [columns])
  const textColumns = useMemo(() => columns.filter((column) => column.type !== 'number'), [columns])

  const chartSuggestions = useMemo(() => {
    if (!columns || columns.length === 0) return []
    const suggestions = []

    if (textColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        id: 'multiValue',
        title: 'Kategorien mit mehreren Zahlen',
        description: 'Ideal für Balken- oder Liniendiagramme mit mehreren Serien.',
        chartHint: 'Balken-/Liniendiagramm',
        preview: { chartType: 'groupedBar' },
        fields: [
          {
            key: 'label',
            label: 'Beschriftungs-Spalte',
            type: 'text',
            multiple: false,
            defaultValue: textColumns[0]?.key || ''
          },
          {
            key: 'values',
            label: 'Werte-Spalten',
            type: 'number',
            multiple: true,
            defaultValues: numericColumns.slice(0, 3).map((column) => column.key)
          }
        ],
        buildMapping: (selection) => ({
          label: selection.label || '',
          valueColumns: Array.isArray(selection.values) ? selection.values : selection.values ? [selection.values] : [],
          datasetLabel: ''
        })
      })
    }

    if (textColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        id: 'singleValue',
        title: 'Kategorien mit einer Kennzahl',
        description: 'Perfekt für Kreis- oder Donutdiagramme.',
        chartHint: 'Kreis-/Donutdiagramm',
        preview: { chartType: 'donut' },
        fields: [
          {
            key: 'label',
            label: 'Beschriftungs-Spalte',
            type: 'text',
            multiple: false,
            defaultValue: textColumns[0]?.key || ''
          },
          {
            key: 'value',
            label: 'Wert-Spalte',
            type: 'number',
            multiple: false,
            defaultValue: numericColumns[0]?.key || ''
          }
        ],
        buildMapping: (selection) => ({
          label: selection.label || '',
          valueColumns: selection.value ? [selection.value] : [],
          datasetLabel: ''
        })
      })
    }

    if (textColumns.length > 1 && numericColumns.length > 0) {
      suggestions.push({
        id: 'longFormat',
        title: 'Lange Tabelle mit Datensatz-Spalte',
        description: 'Verwende eine Datensatzspalte, um Serien dynamisch zu gruppieren.',
        chartHint: 'Mehrserien-Diagramm',
        preview: { chartType: 'multiLine' },
        fields: [
          {
            key: 'label',
            label: 'Beschriftungs-Spalte',
            type: 'text',
            multiple: false,
            defaultValue: textColumns[0]?.key || ''
          },
          {
            key: 'value',
            label: 'Wert-Spalte',
            type: 'number',
            multiple: false,
            defaultValue: numericColumns[0]?.key || ''
          },
          {
            key: 'dataset',
            label: 'Datensatz-Spalte',
            type: 'text',
            multiple: false,
            defaultValue: textColumns[1]?.key || ''
          }
        ],
        buildMapping: (selection) => ({
          label: selection.label || '',
          valueColumns: selection.value ? [selection.value] : [],
          datasetLabel: selection.dataset || ''
        })
      })
    }

    const needsRadius = chartType === 'bubble' || chartType === 'matrix'

    if (isScatterBubble && numericColumns.length >= 2) {
      suggestions.push({
        id: 'scatter',
        title: needsRadius ? 'Blasen-/Matrixdaten' : 'Streudiagramm-Daten',
        description: needsRadius
          ? 'Wähle Spalten für X, Y und optional Radiuswerte.'
          : 'Wähle Spalten für X- und Y-Werte.',
        chartHint: needsRadius ? 'Bubble/Matrix' : 'Scatter',
        preview: { chartType: needsRadius ? 'bubble' : 'scatter', usesRadius: needsRadius },
        fields: [
          {
            key: 'xColumn',
            label: 'X-Spalte',
            type: 'number',
            multiple: false,
            defaultValue: numericColumns[0]?.key || ''
          },
          {
            key: 'yColumn',
            label: 'Y-Spalte',
            type: 'number',
            multiple: false,
            defaultValue: numericColumns[1]?.key || numericColumns[0]?.key || ''
          },
          ...(needsRadius
            ? [
                {
                  key: 'rColumn',
                  label: 'Radius-Spalte (optional)',
                  type: 'number',
                  multiple: false,
                  optional: true,
                  defaultValue: numericColumns[2]?.key || ''
                }
              ]
            : []),
          {
            key: 'datasetLabel',
            label: 'Datensatz-Spalte (optional)',
            type: 'text',
            multiple: false,
            optional: true,
            defaultValue: ''
          },
          {
            key: 'pointLabelColumn',
            label: 'Punkt-Label (optional)',
            type: 'any',
            multiple: false,
            optional: true,
            defaultValue: ''
          }
        ],
        buildMapping: (selection) => ({
          xColumn: selection.xColumn || '',
          yColumn: selection.yColumn || '',
          rColumn: selection.rColumn || '',
          datasetLabel: selection.datasetLabel || '',
          pointLabelColumn: selection.pointLabelColumn || '',
          valueColumns: [],
          label: ''
        })
      })
    }

    if (isCoordinate && numericColumns.length >= 2) {
      const defaultLongitude =
        numericColumns.find((col) => col.key.toLowerCase().includes('lon') || col.key.toLowerCase().includes('long'))?.key ||
        numericColumns[0]?.key || ''
      const defaultLatitude =
        numericColumns.find((col) => col.key.toLowerCase().includes('lat'))?.key || numericColumns[1]?.key || numericColumns[0]?.key || ''

      suggestions.push({
        id: 'coordinate',
        title: 'Koordinaten-Daten',
        description: 'Geeignet für Kartenvisualisierungen mit Longitude/Latitude.',
        chartHint: 'Karten-/Koordinatenvisualisierung',
        preview: { chartType: 'coordinate' },
        fields: [
          {
            key: 'longitudeColumn',
            label: 'Longitude',
            type: 'number',
            multiple: false,
            defaultValue: defaultLongitude
          },
          {
            key: 'latitudeColumn',
            label: 'Latitude',
            type: 'number',
            multiple: false,
            defaultValue: defaultLatitude
          },
          {
            key: 'datasetLabel',
            label: 'Datensatz-Spalte (optional)',
            type: 'text',
            multiple: false,
            optional: true,
            defaultValue: ''
          },
          {
            key: 'pointLabelColumn',
            label: 'Beschriftung (optional)',
            type: 'any',
            multiple: false,
            optional: true,
            defaultValue: ''
          }
        ],
        buildMapping: (selection) => ({
          longitudeColumn: selection.longitudeColumn || '',
          latitudeColumn: selection.latitudeColumn || '',
          datasetLabel: selection.datasetLabel || '',
          pointLabelColumn: selection.pointLabelColumn || ''
        })
      })
    }

    return suggestions
  }, [columns, textColumns, numericColumns, isScatterBubble, isCoordinate, chartType])

  const initialSuggestionSelections = useMemo(() => {
    const defaults = {}
    chartSuggestions.forEach((suggestion) => {
      const selection = {}
      suggestion.fields.forEach((field) => {
        if (field.multiple) {
          selection[field.key] = field.defaultValues ? [...field.defaultValues] : []
        } else {
          selection[field.key] = field.defaultValue || ''
        }
      })
      defaults[suggestion.id] = selection
    })
    return defaults
  }, [chartSuggestions])

  const [suggestionSelections, setSuggestionSelections] = useState(initialSuggestionSelections)

  useEffect(() => {
    setSuggestionSelections(initialSuggestionSelections)
  }, [initialSuggestionSelections])

  const updateSuggestionSelection = useCallback((suggestionId, fieldKey, value) => {
    setSuggestionSelections((prev) => ({
      ...prev,
      [suggestionId]: {
        ...(prev[suggestionId] || {}),
        [fieldKey]: value
      }
    }))
  }, [])

  const getFieldOptions = useCallback(
    (field) => {
      if (field.type === 'number') return numericColumns
      if (field.type === 'text') return textColumns
      return columns
    },
    [numericColumns, textColumns, columns]
  )

  const isSuggestionComplete = useCallback((suggestion, selection) => {
    return suggestion.fields.every((field) => {
      if (field.optional) return true
      const value = selection?.[field.key]
      if (field.multiple) {
        return Array.isArray(value) && value.length > 0
      }
      return Boolean(value)
    })
  }, [])

  const suggestionPreviewSource = useMemo(() => {
    if (Array.isArray(transformedPreviewEntries) && transformedPreviewEntries.length > 0) {
      return { entries: transformedPreviewEntries, source: 'transformed' }
    }
    return { entries: Array.isArray(previewEntries) ? previewEntries : [], source: 'raw' }
  }, [transformedPreviewEntries, previewEntries])

  const suggestionPreviewData = useMemo(() => {
    const result = new Map()
    if (!Array.isArray(chartSuggestions) || chartSuggestions.length === 0) {
      return result
    }

    const { entries, source } = suggestionPreviewSource
    if (!Array.isArray(entries) || entries.length === 0) {
      return result
    }

    chartSuggestions.forEach((suggestion) => {
      const selection = suggestionSelections[suggestion.id]
      if (!isSuggestionComplete(suggestion, selection)) {
        return
      }

      let preview = null

      if (suggestion.id === 'multiValue') {
        preview = buildMultiValuePreview(entries, source, selection, suggestion.chartHint)
      } else if (suggestion.id === 'singleValue') {
        preview = buildSingleValuePreview(entries, source, selection, suggestion.chartHint)
      } else if (suggestion.id === 'longFormat') {
        preview = buildLongFormatPreview(entries, source, selection, suggestion.chartHint)
      } else if (suggestion.id === 'scatter') {
        const usesRadius = suggestion.preview?.usesRadius || false
        preview = buildScatterPreview(entries, source, selection, suggestion.chartHint, usesRadius)
      } else if (suggestion.id === 'coordinate') {
        preview = buildCoordinatePreview(entries, source, selection, suggestion.chartHint)
      }

      if (preview && preview.pointMeta) {
        result.set(suggestion.id, { ...preview, source })
      }
    })

    return result
  }, [
    chartSuggestions,
    suggestionSelections,
    suggestionPreviewSource,
    isSuggestionComplete
  ])

  useEffect(() => {
    if (!chartPreviewHighlight) {
      return
    }
    const entries = chartPreviewHighlight.source === 'transformed' ? transformedPreviewEntries : previewEntries
    const exists = Array.isArray(entries) && entries.some((entry) => entry.index === chartPreviewHighlight.rowIndex)
    if (!exists) {
      setChartPreviewHighlight(null)
    }
  }, [chartPreviewHighlight, transformedPreviewEntries, previewEntries])

  useEffect(() => {
    if (!chartPreviewHighlight) {
      return
    }
    const key = `${chartPreviewHighlight.source}-${chartPreviewHighlight.rowIndex}`
    const node = rowRefs.current.get(key)
    if (node && typeof node.scrollIntoView === 'function') {
      try {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } catch (_error) {
        node.scrollIntoView()
      }
    }
  }, [chartPreviewHighlight])

  const handleSuggestionPreviewPointClick = useCallback(
    (suggestionId, preview, detail) => {
      if (!preview || !detail) {
        return
      }
      const datasetMeta = Array.isArray(preview.pointMeta)
        ? preview.pointMeta[detail.datasetIndex]
        : null
      if (!datasetMeta) {
        return
      }
      const entryMeta = datasetMeta[detail.index]
      if (!entryMeta) {
        return
      }

      setChartPreviewHighlight((previous) => {
        if (
          previous &&
          previous.source === (entryMeta.source || preview.source || 'raw') &&
          previous.rowIndex === entryMeta.rowIndex
        ) {
          return null
        }
        return {
          suggestionId,
          source: entryMeta.source || preview.source || 'raw',
          rowIndex: entryMeta.rowIndex
        }
      })
    },
    [setChartPreviewHighlight]
  )

  const handleSuggestionApply = useCallback(
    (suggestion) => {
      const selection = suggestionSelections[suggestion.id] || {}
      if (!isSuggestionComplete(suggestion, selection)) {
        return
      }
      const mappingOverride = suggestion.buildMapping(selection)
      handleApply(mappingOverride)
    },
    [suggestionSelections, isSuggestionComplete, handleApply]
  )

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      parseFile(file)
    }
  }

  const handleApply = useCallback(
    (mappingOverride = null) => {
      const result = getImportResult(mappingOverride)
      if (!result) {
        return
      }
      if (!onApplyToChart) {
        return
      }
      const importState = getImportState()
      onApplyToChart({
        ...result,
        importState: { ...importState, stateVersion: Date.now() }
      }, mappingOverride)
    },
    [getImportResult, getImportState, onApplyToChart]
  )

  const availableDatasetColumns = columns.filter(
    (column) =>
      column.key !== mapping.label &&
      !mapping.valueColumns.includes(column.key) &&
      column.type !== 'number'
  )

  const groupingColumns = useMemo(
    () => columns.filter((column) => column.type !== 'number'),
    [columns]
  )

  const activeSorts = useMemo(
    () => (Array.isArray(sortConfig) ? sortConfig : []),
    [sortConfig]
  )

  const searchColumnSummary = useMemo(() => {
    if (!searchColumns || searchColumns.length === 0) {
      return 'Alle Spalten'
    }
    if (searchColumns.length === 1) {
      return searchColumns[0]
    }
    return `${searchColumns.length} Spalten`
  }, [searchColumns])

  const transformedExtraColumns = useMemo(() => {
    const known = new Set(visibleColumns.map((column) => column.key))
    const extras = []
    transformedPreviewEntries.forEach((entry) => {
      Object.keys(entry.row || {}).forEach((key) => {
        if (!known.has(key)) {
          known.add(key)
          extras.push(key)
        }
      })
    })
    return extras
  }, [visibleColumns, transformedPreviewEntries])

  if (!isOpen) {
    return null
  }

  const filters = transformations.filters || []
  const grouping = transformations.grouping || {}
  const aggregations = transformations.aggregations || {}
  const selectedGroupingColumns = useMemo(
    () =>
      Array.isArray(grouping.columns)
        ? grouping.columns
            .filter((column) => typeof column === 'string')
            .map((column) => column.trim())
            .filter(Boolean)
        : [],
    [grouping.columns]
  )
  const availableGroupingOptions = useMemo(() => {
    const selectedSet = new Set(selectedGroupingColumns)
    return groupingColumns.filter((column) => !selectedSet.has(column.key))
  }, [groupingColumns, selectedGroupingColumns])
  const valueRules = transformations.valueRules || []

  useEffect(() => {
    if (!groupingColumnToAdd) {
      return
    }
    const stillAvailable = availableGroupingOptions.some((option) => option.key === groupingColumnToAdd)
    if (!stillAvailable) {
      setGroupingColumnToAdd('')
    }
  }, [groupingColumnToAdd, availableGroupingOptions])
  const pivotConfig = { ...DEFAULT_PIVOT_CONFIG, ...(transformations.pivot || {}) }
  const unpivotConfig = { ...DEFAULT_UNPIVOT_CONFIG, ...(transformations.unpivot || {}) }
  const pivotHasFillValue = Object.prototype.hasOwnProperty.call(transformations.pivot || {}, 'fillValue')
  const pivotFillValueInput = pivotHasFillValue
    ? String(pivotConfig.fillValue ?? '')
    : ''
  const pivotIndexColumnsSet = useMemo(
    () => new Set(Array.isArray(pivotConfig.indexColumns) ? pivotConfig.indexColumns : []),
    [pivotConfig.indexColumns]
  )
  const unpivotIdColumnsSet = useMemo(
    () => new Set(Array.isArray(unpivotConfig.idColumns) ? unpivotConfig.idColumns : []),
    [unpivotConfig.idColumns]
  )
  const unpivotValueColumnsSet = useMemo(
    () => new Set(Array.isArray(unpivotConfig.valueColumns) ? unpivotConfig.valueColumns : []),
    [unpivotConfig.valueColumns]
  )

  const handleTogglePivot = (enabled) => {
    updateTransformations((prev) => ({
      ...prev,
      pivot: {
        ...DEFAULT_PIVOT_CONFIG,
        ...(prev.pivot || {}),
        enabled
      }
    }))
  }

  const handlePivotKeyChange = (column) => {
    updateTransformations((prev) => ({
      ...prev,
      pivot: {
        ...DEFAULT_PIVOT_CONFIG,
        ...(prev.pivot || {}),
        keyColumn: column
      }
    }))
  }

  const handlePivotValueChange = (column) => {
    updateTransformations((prev) => ({
      ...prev,
      pivot: {
        ...DEFAULT_PIVOT_CONFIG,
        ...(prev.pivot || {}),
        valueColumn: column
      }
    }))
  }

  const handlePivotIndexToggle = (columnKey, checked) => {
    updateTransformations((prev) => {
      const current = Array.isArray(prev.pivot?.indexColumns) ? prev.pivot.indexColumns : []
      const nextSet = new Set(current)
      if (checked) {
        nextSet.add(columnKey)
      } else {
        nextSet.delete(columnKey)
      }
      return {
        ...prev,
        pivot: {
          ...DEFAULT_PIVOT_CONFIG,
          ...(prev.pivot || {}),
          indexColumns: [...nextSet]
        }
      }
    })
  }

  const handlePivotPrefixChange = (value) => {
    updateTransformations((prev) => ({
      ...prev,
      pivot: {
        ...DEFAULT_PIVOT_CONFIG,
        ...(prev.pivot || {}),
        prefix: value
      }
    }))
  }

  const handlePivotFillValueChange = (value) => {
    updateTransformations((prev) => {
      const base = { ...DEFAULT_PIVOT_CONFIG, ...(prev.pivot || {}) }
      if (value === '') {
        const { fillValue: _omit, ...rest } = base
        return { ...prev, pivot: rest }
      }
      return { ...prev, pivot: { ...base, fillValue: value } }
    })
  }

  const handleToggleUnpivot = (enabled) => {
    updateTransformations((prev) => ({
      ...prev,
      unpivot: {
        ...DEFAULT_UNPIVOT_CONFIG,
        ...(prev.unpivot || {}),
        enabled
      }
    }))
  }

  const handleUnpivotIdToggle = (columnKey, checked) => {
    updateTransformations((prev) => {
      const current = Array.isArray(prev.unpivot?.idColumns) ? prev.unpivot.idColumns : []
      const nextSet = new Set(current)
      if (checked) {
        nextSet.add(columnKey)
      } else {
        nextSet.delete(columnKey)
      }
      return {
        ...prev,
        unpivot: {
          ...DEFAULT_UNPIVOT_CONFIG,
          ...(prev.unpivot || {}),
          idColumns: [...nextSet]
        }
      }
    })
  }

  const handleUnpivotValueToggle = (columnKey, checked) => {
    updateTransformations((prev) => {
      const current = Array.isArray(prev.unpivot?.valueColumns) ? prev.unpivot.valueColumns : []
      const nextSet = new Set(current)
      if (checked) {
        nextSet.add(columnKey)
      } else {
        nextSet.delete(columnKey)
      }
      return {
        ...prev,
        unpivot: {
          ...DEFAULT_UNPIVOT_CONFIG,
          ...(prev.unpivot || {}),
          valueColumns: [...nextSet]
        }
      }
    })
  }

  const handleUnpivotVariableChange = (value) => {
    updateTransformations((prev) => ({
      ...prev,
      unpivot: {
        ...DEFAULT_UNPIVOT_CONFIG,
        ...(prev.unpivot || {}),
        variableColumn: value
      }
    }))
  }

  const handleUnpivotValueNameChange = (value) => {
    updateTransformations((prev) => ({
      ...prev,
      unpivot: {
        ...DEFAULT_UNPIVOT_CONFIG,
        ...(prev.unpivot || {}),
        valueColumnName: value
      }
    }))
  }

  const handleUnpivotDropEmptyToggle = (checked) => {
    updateTransformations((prev) => ({
      ...prev,
      unpivot: {
        ...DEFAULT_UNPIVOT_CONFIG,
        ...(prev.unpivot || {}),
        dropEmptyValues: checked
      }
    }))
  }

  const handleAddFilter = () => {
    const id = createUniqueId('filter')
    updateTransformations((prev) => ({
      ...prev,
      filters: [...(prev.filters || []), { id, column: '', operator: 'equalsText', value: '', enabled: true, logicOperator: 'and' }]
    }))
  }

  // Value rules handlers
  const handleAddValueRule = () => {
    const id = createUniqueId('vrule')
    updateTransformations((prev) => ({
      ...prev,
      valueRules: [
        ...(prev.valueRules || []),
        { id, column: '', when: { operator: 'containsText', value: '' }, action: { type: 'replaceText', search: '', value: '' }, enabled: true }
      ]
    }))
  }

  const handleValueRuleChange = (id, changes) => {
    updateTransformations((prev) => ({
      ...prev,
      valueRules: (prev.valueRules || []).map((r) => (r.id === id ? { ...r, ...changes } : r))
    }))
  }

  const handleRemoveValueRule = (id) => {
    updateTransformations((prev) => ({
      ...prev,
      valueRules: (prev.valueRules || []).filter((r) => r.id !== id)
    }))
  }

  const handleFilterChange = (id, changes) => {
    updateTransformations((prev) => ({
      ...prev,
      filters: (prev.filters || []).map((filter) => (filter.id === id ? { ...filter, ...changes } : filter))
    }))
  }

  const handleRemoveFilter = (id) => {
    updateTransformations((prev) => ({
      ...prev,
      filters: (prev.filters || []).filter((filter) => filter.id !== id)
    }))
  }

  const handleToggleFilter = (id, enabled) => {
    handleFilterChange(id, { enabled })
  }

  const handleToggleGrouping = (enabled) => {
    updateTransformations((prev) => {
      const existingColumns = Array.isArray(prev.grouping?.columns)
        ? prev.grouping.columns
            .filter((column) => typeof column === 'string')
            .map((column) => column.trim())
            .filter(Boolean)
        : []
      const legacyColumn = prev.grouping?.column && typeof prev.grouping.column === 'string'
        ? prev.grouping.column.trim()
        : ''
      let nextColumns = existingColumns
      if (enabled) {
        if (existingColumns.length === 0) {
          const fallback = legacyColumn || mapping.label || ''
          nextColumns = fallback ? [fallback] : []
        }
      }
      const updatedGrouping = { ...prev.grouping, enabled, columns: nextColumns }
      if (Object.prototype.hasOwnProperty.call(updatedGrouping, 'column')) {
        delete updatedGrouping.column
      }
      return {
        ...prev,
        grouping: updatedGrouping
      }
    })
  }

  const handleGroupingFallbackChange = (fallbackLabel) => {
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        fallbackLabel
      }
    }))
  }

  const handleAddGroupingColumn = (column) => {
    const normalized = typeof column === 'string' ? column.trim() : ''
    if (!normalized) {
      return
    }
    updateTransformations((prev) => {
      const existing = Array.isArray(prev.grouping?.columns)
        ? prev.grouping.columns
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        : []
      if (existing.includes(normalized)) {
        return prev
      }
      const updatedGrouping = { ...prev.grouping, columns: [...existing, normalized] }
      if (Object.prototype.hasOwnProperty.call(updatedGrouping, 'column')) {
        delete updatedGrouping.column
      }
      return {
        ...prev,
        grouping: updatedGrouping
      }
    })
  }

  const handleRemoveGroupingColumn = (index) => {
    updateTransformations((prev) => {
      const existing = Array.isArray(prev.grouping?.columns)
        ? prev.grouping.columns
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        : []
      if (index < 0 || index >= existing.length) {
        return prev
      }
      const next = existing.filter((_, idx) => idx !== index)
      const updatedGrouping = { ...prev.grouping, columns: next }
      if (Object.prototype.hasOwnProperty.call(updatedGrouping, 'column')) {
        delete updatedGrouping.column
      }
      return {
        ...prev,
        grouping: updatedGrouping
      }
    })
  }

  const handleMoveGroupingColumn = (index, direction) => {
    updateTransformations((prev) => {
      const existing = Array.isArray(prev.grouping?.columns)
        ? prev.grouping.columns
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        : []
      const targetIndex = index + direction
      if (index < 0 || index >= existing.length || targetIndex < 0 || targetIndex >= existing.length) {
        return prev
      }
      const next = [...existing]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      const isSameOrder = next.length === existing.length && next.every((value, idx) => value === existing[idx])
      if (isSameOrder) {
        return prev
      }
      const updatedGrouping = { ...prev.grouping, columns: next }
      if (Object.prototype.hasOwnProperty.call(updatedGrouping, 'column')) {
        delete updatedGrouping.column
      }
      return {
        ...prev,
        grouping: updatedGrouping
      }
    })
  }

  const handleAddGroup = () => {
    const id = createUniqueId('group')
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        customGroups: [...(prev.grouping?.customGroups || []), { id, label: '', values: [] }]
      }
    }))
  }

  const handleGroupChange = (id, changes) => {
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        customGroups: (prev.grouping?.customGroups || []).map((group) =>
          group.id === id ? { ...group, ...changes } : group
        )
      }
    }))
  }

  const handleGroupLabelChange = (id, label) => {
    handleGroupChange(id, { label })
  }

  const handleGroupValuesChange = (id, valueString) => {
    const values = valueString
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
    handleGroupChange(id, { values })
  }

  const handleRemoveGroup = (id) => {
    updateTransformations((prev) => ({
      ...prev,
      grouping: {
        ...prev.grouping,
        customGroups: (prev.grouping?.customGroups || []).filter((group) => group.id !== id)
      }
    }))
  }

  const handleAggregationDefaultChange = (operation) => {
    updateTransformations((prev) => {
      const previousDefault = prev.aggregations?.defaultOperation || 'sum'
      const updatedPerColumn = Object.fromEntries(
        Object.entries(prev.aggregations?.perColumn || {}).map(([column, value]) => [
          column,
          value === previousDefault ? operation : value
        ])
      )
      return {
        ...prev,
        aggregations: {
          ...prev.aggregations,
          defaultOperation: operation,
          perColumn: updatedPerColumn,
          // Initialisiere defaultCriteria wenn countValid gewählt wird
          defaultCriteria: operation === 'countValid' 
            ? (prev.aggregations?.defaultCriteria || { operator: 'greaterThan', value: '' })
            : prev.aggregations?.defaultCriteria
        }
      }
    })
  }

  const handleAggregationChange = (column, operation) => {
    updateTransformations((prev) => ({
      ...prev,
      aggregations: {
        ...prev.aggregations,
        perColumn: {
          ...(prev.aggregations?.perColumn || {}),
          [column]: operation
        },
        // Entferne Kriterien, wenn die Aggregation geändert wird (außer countValid bleibt)
        criteria: operation === 'countValid' 
          ? { ...(prev.aggregations?.criteria || {}), [column]: prev.aggregations?.criteria?.[column] || { operator: 'greaterThan', value: '' } }
          : Object.fromEntries(
              Object.entries(prev.aggregations?.criteria || {}).filter(([key]) => key !== column)
            )
      }
    }))
  }

  const handleCriteriaChange = (column, changes) => {
    updateTransformations((prev) => ({
      ...prev,
      aggregations: {
        ...prev.aggregations,
        criteria: {
          ...(prev.aggregations?.criteria || {}),
          [column]: {
            ...(prev.aggregations?.criteria?.[column] || { operator: 'greaterThan', value: '' }),
            ...changes
          }
        }
      }
    }))
  }

  const pivotMeta = { ...DEFAULT_PIVOT_META, ...(transformationMeta?.pivot || {}) }
  const unpivotMeta = { ...DEFAULT_UNPIVOT_META, ...(transformationMeta?.unpivot || {}) }
  const transformationMetaInfo = {
    originalCount: transformationMeta?.originalCount ?? 0,
    filteredOut: transformationMeta?.filteredOut ?? 0,
    aggregatedFrom: transformationMeta?.aggregatedFrom ?? 0,
    aggregatedTo: transformationMeta?.aggregatedTo ?? 0,
    groupingColumns: Array.isArray(transformationMeta?.groupingColumns)
      ? transformationMeta.groupingColumns.filter((column) => typeof column === 'string' && column.trim())
      : [],
    pivot: pivotMeta,
    unpivot: unpivotMeta
  }

  return (
    <>
      <CsvFindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        onConfirm={handleFindReplaceConfirm}
        searchQuery={searchQuery}
        searchMode={searchMode}
        onSearchModeChange={handleSearchModeChange}
        searchColumns={searchColumns}
        onToggleColumn={handleSearchColumnToggle}
        onResetColumns={handleSearchColumnsReset}
        availableColumns={availableColumnsForModal}
        searchConfig={activeSearchConfig}
        rawMatches={findReplaceData.raw.matches}
        transformedMatches={findReplaceData.transformed.matches}
        totalRawMatches={findReplaceData.raw.total}
        totalTransformedMatches={findReplaceData.transformed.total}
        canReplaceInTransformed={canReplaceInTransformed}
        transformedScopeDisabledReason={transformedScopeDisabledReason}
        defaultScope={findReplaceDefaultScope}
        activeMatch={activeSearchMatch}
        onPreviewMatchFocus={handleModalMatchFocus}
      />
      <div className="space-y-6">
      <div className="rounded-xl border border-gray-700 bg-dark-secondary shadow-lg">
        <div className="flex flex-col gap-2 border-b border-gray-700 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dark-textLight">CSV Viewer &amp; Editor</h2>
            <p className="text-sm text-dark-textGray">
              Lade eine Datei, inspiziere und bearbeite die Daten, wende Transformationen an und übertrage Ergebnisse flexibel in den Diagramm-Editor.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-dark-textGray">
            <div className="rounded-md border border-gray-700 px-3 py-1.5">
              {fileName ? (
                <span>
                  Datei: <span className="text-dark-textLight">{fileName}</span>
                </span>
              ) : (
                'Keine Datei geladen'
              )}
            </div>
            <div className="rounded-md border border-gray-700 px-3 py-1.5">
              {totalRows} Zeilen erkannt
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <section className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-dark-textLight mb-2">Datei auswählen</label>
              <input
                type="file"
                accept=".csv,.tsv,.txt,.xls,.xlsx,.ods"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-lg border border-gray-700 bg-dark-bg px-4 py-3 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              />
              <p className="mt-2 text-xs text-dark-textGray">
                Unterstützte Formate: CSV, TSV sowie Excel-Dateien (.xls, .xlsx, .ods)
              </p>
              {fileName && (
                <p className="mt-1 text-xs text-dark-textLight/80">
                  Ausgewählte Datei: <span className="font-medium">{fileName}</span>
                </p>
              )}
              {parseError && (
                <div className="mt-3 rounded-md border border-red-600/40 bg-red-900/30 px-3 py-2 text-xs text-red-200">
                  {parseError}
                </div>
              )}
            </div>
            {isLoading && (
              <div className="rounded-md border border-blue-500/40 bg-blue-900/20 px-3 py-2 text-xs text-blue-200">
                Datei wird verarbeitet …
              </div>
            )}
          </section>

          {totalRows > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-700 bg-dark-bg/40 p-2">
                {WORKBENCH_STEPS.map((step, index) => {
                  const isActive = activeTab === step.key
                  const isDisabled = step.key !== 'mapping' && totalRows === 0
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => setActiveTab(step.key)}
                      disabled={isDisabled}
                      className={`flex-1 min-w-[140px] rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-dark-accent1 text-white shadow-lg'
                          : 'bg-transparent text-dark-textGray hover:text-dark-textLight'
                      } ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-600 text-xs">
                        {index + 1}
                      </span>
                      {step.label}
                    </button>
                  )
                })}
              </div>

              {activeTab === 'mapping' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-dark-textLight">Spalten zuordnen</h3>
                    <p className="text-xs text-dark-textGray">
                      {isCoordinate
                        ? 'Wählen Sie aus, welche CSV-Spalten den Longitude-, Latitude-Werten und optionalen Labels entsprechen.'
                        : isScatterBubble
                        ? 'Wählen Sie aus, welche CSV-Spalten den X-, Y- und optionalen Werte (Größe, Datensatz-Label, Punkt-Label) entsprechen.'
                        : 'Wählen Sie aus, welche Spalten Beschriftungen, Werte und optionale Datensatz-Kennungen enthalten.'}
                    </p>
                  </div>

                  {isCoordinate ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                            Longitude (erforderlich)
                          </label>
                          <select
                            value={mapping.longitudeColumn || ''}
                            onChange={(event) => updateMapping({ longitudeColumn: event.target.value })}
                            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Spalte wählen …</option>
                            {columns
                              .filter((column) => column.type === 'number')
                              .map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key} (Zahl)
                                </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-dark-textGray">
                            Spalte mit den Longitude-Werten (-180° bis 180°).
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                            Latitude (erforderlich)
                          </label>
                          <select
                            value={mapping.latitudeColumn || ''}
                            onChange={(event) => updateMapping({ latitudeColumn: event.target.value })}
                            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Spalte wählen …</option>
                            {columns
                              .filter((column) => column.type === 'number')
                              .map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key} (Zahl)
                                </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-dark-textGray">
                            Spalte mit den Latitude-Werten (-90° bis 90°).
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                            Datensatz-Label (optional)
                          </label>
                          <select
                            value={mapping.datasetLabel || ''}
                            onChange={(event) => updateMapping({ datasetLabel: event.target.value })}
                            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Nicht verwenden (Alle in einem Datensatz)</option>
                            {columns
                              .filter((column) => column.type !== 'number' && column.key !== mapping.longitudeColumn && column.key !== mapping.latitudeColumn)
                              .map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key}
                                </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-dark-textGray">
                            Spalte zur Gruppierung von Punkten in verschiedene Datensätze.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                            Punkt-Label (optional)
                          </label>
                          <select
                            value={mapping.pointLabelColumn || ''}
                            onChange={(event) => updateMapping({ pointLabelColumn: event.target.value })}
                            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Keine Labels</option>
                            {columns
                              .filter((column) => column.key !== mapping.longitudeColumn && column.key !== mapping.latitudeColumn && column.key !== mapping.datasetLabel)
                              .map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key} {column.type === 'number' ? '(Zahl)' : ''}
                                </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-dark-textGray">
                            Spalte mit Beschriftungen für einzelne Punkte.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : isScatterBubble ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                            X-Werte (erforderlich)
                          </label>
                          <select
                            value={mapping.xColumn || ''}
                            onChange={(event) => updateMapping({ xColumn: event.target.value })}
                            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Spalte wählen …</option>
                            {columns
                              .filter((column) => column.type === 'number')
                              .map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key} (Zahl)
                                </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-dark-textGray">
                            Spalte mit den X-Koordinaten für die Punkte.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                            Y-Werte (erforderlich)
                          </label>
                          <select
                            value={mapping.yColumn || ''}
                            onChange={(event) => updateMapping({ yColumn: event.target.value })}
                            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Spalte wählen …</option>
                            {columns
                              .filter((column) => column.type === 'number')
                              .map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key} (Zahl)
                                </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-dark-textGray">
                            Spalte mit den Y-Koordinaten für die Punkte.
                          </p>
                        </div>
                      </div>

                      {(chartType === 'bubble' || chartType === 'matrix') && (
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                            Größe (r) - optional
                          </label>
                          <select
                            value={mapping.rColumn || ''}
                            onChange={(event) => updateMapping({ rColumn: event.target.value })}
                            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Keine (Standard: 10)</option>
                            {columns
                              .filter((column) => column.type === 'number')
                              .map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key} (Zahl)
                                </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-dark-textGray">
                            Spalte mit den Größenwerten für die Blasen. Wenn keine Spalte ausgewählt wird, wird Standard-Größe 10 verwendet.
                          </p>
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                            Datensatz-Label (optional)
                          </label>
                          <select
                            value={mapping.datasetLabel || ''}
                            onChange={(event) => updateMapping({ datasetLabel: event.target.value })}
                            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Nicht verwenden (Alle in einem Datensatz)</option>
                            {columns
                              .filter((column) => column.type !== 'number' && column.key !== mapping.xColumn && column.key !== mapping.yColumn && column.key !== mapping.rColumn)
                              .map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key}
                                </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-dark-textGray">
                            Spalte zur Gruppierung von Punkten in verschiedene Datensätze.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                            Punkt-Label (optional)
                          </label>
                          <select
                            value={mapping.pointLabelColumn || ''}
                            onChange={(event) => updateMapping({ pointLabelColumn: event.target.value })}
                            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Keine Labels</option>
                            {columns
                              .filter((column) => column.key !== mapping.xColumn && column.key !== mapping.yColumn && column.key !== mapping.rColumn && column.key !== mapping.datasetLabel)
                              .map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key} {column.type === 'number' ? '(Zahl)' : ''}
                                </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-dark-textGray">
                            Spalte mit Beschriftungen für einzelne Punkte.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                        {chartType === 'radar' ? 'Datensatz-Name (optional)' : 'Beschriftungs-Spalte'}
                      </label>
                      <select
                        value={mapping.label}
                        onChange={(event) => updateMapping({ label: event.target.value })}
                        className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                      >
                        <option value="">{chartType === 'radar' ? 'Nicht verwenden' : 'Spalte wählen …'}</option>
                        {columns.map((column) => (
                          <option key={column.key} value={column.key}>
                            {column.key} {column.type === 'number' ? '(Zahl)' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-dark-textGray">
                        {chartType === 'radar' 
                          ? 'Spalte mit dem Namen für jeden Datensatz (jede Zeile). Wenn leer, wird "Datensatz" verwendet.'
                          : 'Diese Werte werden als Kategorien bzw. X-Achsen-Beschriftungen verwendet.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                        {chartType === 'radar' ? 'Attribut-Spalten' : 'Werte-Spalten'}
                      </label>
                      {allowMultipleValueColumns ? (
                        <div className="space-y-2 rounded-lg border border-gray-700 bg-dark-bg p-3">
                          {columns.map((column) => {
                            const disabled = column.key === mapping.label
                            const checked = mapping.valueColumns.includes(column.key)
                            return (
                              <label
                                key={column.key}
                                className={`flex items-start space-x-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                                  disabled
                                    ? 'cursor-not-allowed text-dark-textGray/60'
                                    : 'cursor-pointer hover:bg-dark-secondary'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1 h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                                  checked={checked}
                                  onChange={() => toggleValueColumn(column.key)}
                                  disabled={disabled}
                                />
                                <span className="flex-1 text-dark-textLight">
                                  <span className="font-medium">{column.key}</span>{' '}
                                  <span className="text-xs text-dark-textGray">
                                    {column.type === 'number' ? 'Zahlen' : 'Text'} ·{' '}
                                    {column.filledCount - column.emptyCount} Werte
                                  </span>
                                </span>
                              </label>
                            )
                          })}
                          {mapping.valueColumns.length === 0 && (
                            <p className="text-[11px] text-red-300">Bitte wählen Sie mindestens eine Spalte aus.</p>
                          )}
                        </div>
                      ) : (
                        <select
                          value={mapping.valueColumns[0] || ''}
                          onChange={(event) =>
                            updateMapping({ valueColumns: event.target.value ? [event.target.value] : [] })
                          }
                          className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                        >
                          <option value="">Spalte wählen …</option>
                          {columns
                            .filter((column) => column.key !== mapping.label)
                            .map((column) => (
                              <option key={column.key} value={column.key}>
                                {column.key} {column.type === 'number' ? '(Zahl)' : ''}
                              </option>
                            ))}
                        </select>
                      )}
                      <p className="text-[11px] text-dark-textGray">
                        {chartType === 'radar' 
                          ? 'Wählen Sie mehrere Spalten aus, die als Attribute im Radar-Diagramm angezeigt werden sollen. Jede Spalte wird ein Attribut (Achse) im Diagramm.'
                          : 'Enthalten die numerischen Werte für das Diagramm. Ungültige Zahlen werden automatisch übersprungen.'}
                      </p>
                    </div>
                  </div>
                  )}

                  {!isScatterBubble && allowMultipleValueColumns && chartType !== 'radar' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                        Datensatz-Spalte (optional)
                      </label>
                      <select
                        value={mapping.datasetLabel}
                        onChange={(event) => updateMapping({ datasetLabel: event.target.value })}
                        className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                      >
                        <option value="">Nicht verwenden</option>
                        {availableDatasetColumns.map((column) => (
                          <option key={column.key} value={column.key}>
                            {column.key}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-dark-textGray">
                        Ermöglicht den Import mehrerer Datensätze aus einer Spalte (lange Tabellenform).
                      </p>
                    </div>
                  )}
                  {chartType === 'radar' && (
                    <div className="space-y-2 rounded-lg border border-blue-700/40 bg-blue-900/20 p-3">
                      <p className="text-xs text-blue-200">
                        <strong>Hinweis:</strong> Bei Radar-Diagrammen stellt jede Zeile einen Datensatz dar. Die ausgewählten Attribut-Spalten werden als Achsen im Radar-Diagramm angezeigt. Die Namen der Attribut-Spalten werden automatisch als Beschriftungen verwendet.
                      </p>
                    </div>
                  )}

                  {previewEntries.length > 0 ? (
                    <section className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-dark-textLight">Originaldaten Vorschau</h4>
                          <p className="text-xs text-dark-textGray">
                            {filteredRowCount} von {totalRows} Zeilen sichtbar
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-dark-textGray">
                          <label className="flex items-center gap-1">
                            <span className="hidden sm:inline">Zeilen:</span>
                            <select
                              value={String(previewLimit)}
                              onChange={(e) =>
                                setPreviewLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))
                              }
                              className="rounded-md border border-gray-700 bg-dark-bg px-1.5 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                              <option value="all">alle</option>
                            </select>
                          </label>
                          <label className="flex items-center gap-1">
                            <span>Modus:</span>
                            <select
                              value={searchMode}
                              onChange={handleSearchModeChange}
                              className="rounded-md border border-gray-700 bg-dark-bg px-1.5 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                            >
                              <option value="normal">Normal</option>
                              <option value="whole">Ganzwort</option>
                              <option value="regex">Regex</option>
                            </select>
                          </label>
                          <details className="relative">
                            <summary className="flex cursor-pointer select-none items-center gap-1 rounded-md border border-gray-700 bg-dark-bg px-2 py-1 text-dark-textLight shadow-sm outline-none transition-colors hover:border-dark-accent1 focus:outline-none">
                              <span>Spalten:</span>
                              <span className="text-dark-textGray">{searchColumnSummary}</span>
                            </summary>
                            <div className="absolute right-0 z-20 mt-1 w-60 rounded-md border border-gray-700 bg-dark-bg p-3 text-dark-textLight shadow-xl">
                              <div className="mb-2 flex items-center justify-between text-[11px] text-dark-textGray">
                                <span>Suchbereich einschränken</span>
                                <button
                                  type="button"
                                  onClick={handleSearchColumnsReset}
                                  className="rounded border border-gray-700 px-1 py-0.5 text-[10px] text-dark-textLight transition-colors hover:border-dark-accent1"
                                >
                                  Alle
                                </button>
                              </div>
                              <div className="max-h-48 overflow-y-auto pr-1">
                                {columns.length === 0 ? (
                                  <p className="text-[11px] text-dark-textGray">Keine Spalten verfügbar.</p>
                                ) : (
                                  columns.map((column) => {
                                    const isSelected = searchColumns.includes(column.key)
                                    return (
                                      <label
                                        key={column.key}
                                        className="flex items-center gap-2 py-0.5 text-xs text-dark-textLight"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(event) =>
                                            handleSearchColumnToggle(column.key, event.target.checked)
                                          }
                                          className="h-3 w-3 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                                        />
                                        <span className="truncate">{column.key}</span>
                                      </label>
                                    )
                                  })
                                )}
                              </div>
                            </div>
                          </details>
                          <div className="relative flex-1 sm:flex-initial">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={handleSearchChange}
                              placeholder="Suchen …"
                              className="w-full rounded-md border border-gray-700 bg-dark-bg py-1.5 pl-7 pr-2 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                            />
                            <span className="pointer-events-none absolute left-2 top-1.5 text-dark-textGray/80">🔍</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleSearchMatchNavigate(-1)}
                              disabled={!hasSearchMatches}
                              className={`rounded-md border px-2 py-1 transition-colors ${
                                hasSearchMatches
                                  ? 'border-gray-700 text-dark-textLight hover:border-dark-accent1 hover:text-dark-accent1'
                                  : 'cursor-not-allowed border-gray-800 text-dark-textGray'
                              }`}
                            >
                              Vorheriger
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSearchMatchNavigate(1)}
                              disabled={!hasSearchMatches}
                              className={`rounded-md border px-2 py-1 transition-colors ${
                                hasSearchMatches
                                  ? 'border-gray-700 text-dark-textLight hover:border-dark-accent1 hover:text-dark-accent1'
                                  : 'cursor-not-allowed border-gray-800 text-dark-textGray'
                              }`}
                            >
                              Nächster
                            </button>
                            <span className="ml-1 text-dark-textGray">Treffer {searchMatchSummary}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenFindReplace}
                            disabled={!canOpenFindReplace}
                            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                              canOpenFindReplace
                                ? 'border-dark-accent1/40 text-dark-accent1 hover:bg-dark-accent1/10'
                                : 'cursor-not-allowed border-gray-700 text-dark-textGray'
                            }`}
                          >
                            <span>Ersetzen…</span>
                          </button>
                        </div>
                        {(manualEditCount > 0 || canUndoManualEdit) && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-dark-textGray">
                            <span
                              className={`rounded-md border px-2 py-1 ${
                                manualEditCount > 0
                                  ? 'border-dark-accent1/40 bg-dark-accent1/10 text-dark-accent1'
                                  : 'border-gray-700 text-dark-textGray/70'
                              }`}
                            >
                              {manualEditCount} manuelle Änderung{manualEditCount === 1 ? '' : 'en'}
                            </span>
                            <button
                              type="button"
                              onClick={undoLastManualEdit}
                              disabled={!canUndoManualEdit}
                              className={`rounded-md border px-2 py-1 transition-colors ${
                                canUndoManualEdit
                                  ? 'border-dark-accent1/60 text-dark-textLight hover:border-dark-accent1 hover:text-dark-textLight'
                                  : 'cursor-not-allowed border-gray-700 text-dark-textGray'
                              }`}
                            >
                              Rückgängig
                            </button>
                          </div>
                        )}
                        {searchError && (
                          <p className="text-[11px] text-red-300">Regex-Fehler: {searchError}</p>
                        )}
                      </div>
                      {profilingColumn && (
                        <div className="mb-4 rounded-lg border border-gray-700 bg-dark-bg/40 p-3 text-[11px] text-dark-textLight">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-dark-textLight">Spaltenprofil</h4>
                            <select
                              value={profilingColumnKey || ''}
                              onChange={(event) => setProfilingColumnKey(event.target.value)}
                              className="rounded-md border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                            >
                              {columns.map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.key}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-dark-textGray">Allgemein</h5>
                              <ul className="space-y-1">
                                <li>
                                  <span className="text-dark-textGray">Typ:</span>{' '}
                                  <span className="text-dark-textLight">{profilingColumn.type === 'number' ? 'Zahl' : 'Text'}</span>
                                </li>
                                <li>
                                  <span className="text-dark-textGray">Ausgefüllt:</span>{' '}
                                  <span className="text-dark-textLight">
                                    {profilingFilledCount} / {profilingTotalCount}{' '}
                                    {profilingFilledRatio !== null && profilingTotalCount > 0 && (
                                      <span className="text-dark-textGray">
                                        ({formatStatPercentage(profilingFilledRatio)})
                                      </span>
                                    )}
                                  </span>
                                </li>
                                <li>
                                  <span className="text-dark-textGray">Zahlenwerte:</span>{' '}
                                  <span className="text-dark-textLight">
                                    {profilingColumn.numericCount ?? 0}
                                    {profilingNumericRatio !== null && profilingFilledCount > 0 && (
                                      <span className="text-dark-textGray">
                                        {' '}
                                        ({formatStatPercentage(profilingNumericRatio)})
                                      </span>
                                    )}
                                  </span>
                                </li>
                                <li>
                                  <span className="text-dark-textGray">Textwerte:</span>{' '}
                                  <span className="text-dark-textLight">
                                    {profilingColumn.textCount ?? 0}
                                    {profilingTextRatio !== null && profilingFilledCount > 0 && (
                                      <span className="text-dark-textGray">
                                        {' '}
                                        ({formatStatPercentage(profilingTextRatio)})
                                      </span>
                                    )}
                                  </span>
                                </li>
                              </ul>
                              {profilingColumn.samples?.length > 0 && (
                                <div className="mt-2">
                                  <h6 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-dark-textGray">Beispiele</h6>
                                  <div className="flex flex-wrap gap-1">
                                    {profilingColumn.samples.slice(0, 5).map((sample, index) => (
                                      <span
                                        key={`${profilingColumn.key}-sample-${index}`}
                                        className="rounded border border-gray-700/60 bg-dark-secondary/40 px-1.5 py-0.5 text-[10px] text-dark-textLight/90"
                                      >
                                        {formatSamplePreview(sample)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              {hasNumericStats && (
                                <div>
                                  <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-dark-textGray">Numerische Kennzahlen</h5>
                                  <ul className="space-y-1">
                                    <li>
                                      <span className="text-dark-textGray">Minimum:</span>{' '}
                                      <span className="text-dark-textLight">{formatStatNumber(profilingNumericStats.min)}</span>
                                    </li>
                                    <li>
                                      <span className="text-dark-textGray">Maximum:</span>{' '}
                                      <span className="text-dark-textLight">{formatStatNumber(profilingNumericStats.max)}</span>
                                    </li>
                                    <li>
                                      <span className="text-dark-textGray">Durchschnitt:</span>{' '}
                                      <span className="text-dark-textLight">{formatStatNumber(profilingNumericStats.mean)}</span>
                                    </li>
                                    <li>
                                      <span className="text-dark-textGray">Summe:</span>{' '}
                                      <span className="text-dark-textLight">{formatStatNumber(profilingNumericStats.sum)}</span>
                                    </li>
                                    <li>
                                      <span className="text-dark-textGray">Std.-Abweichung:</span>{' '}
                                      <span className="text-dark-textLight">{formatStatNumber(profilingNumericStats.stdDev)}</span>
                                    </li>
                                  </ul>
                                </div>
                              )}
                              {hasTextFrequencies && (
                                <div className={hasNumericStats ? 'mt-3' : ''}>
                                  <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-dark-textGray">Häufigste Texte</h5>
                                  <ul className="space-y-1">
                                    {profilingTextStats.topValues.map((entry) => (
                                      <li key={`${profilingColumn.key}-text-${entry.value || 'empty'}`}>
                                        <span className="text-dark-textLight">{entry.value || '∅ (leer)'}</span>{' '}
                                        <span className="text-dark-textGray">
                                          – {entry.count} ({formatStatPercentage(entry.ratio)})
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {!hasTextFrequencies && profilingColumn.textCount > 0 && (
                                <p className={`${hasNumericStats ? 'mt-3' : ''} text-dark-textGray`}>
                                  Keine dominanten Textwerte ermittelt.
                                </p>
                              )}
                              {!hasNumericStats && !hasTextFrequencies && profilingFilledCount === 0 && (
                                <p className="text-dark-textGray">Keine detaillierten Kennzahlen verfügbar.</p>
                              )}
                            </div>
                          </div>
                      {profilingColumn.warnings?.length > 0 && (
                        <div className="mt-3 rounded border border-yellow-600/40 bg-yellow-900/20 p-2 text-[11px] text-yellow-100">
                          <div className="mb-1 font-semibold uppercase tracking-wide text-yellow-200">Warnungen</div>
                          <ul className="list-disc space-y-1 pl-4">
                            {profilingColumn.warnings.map((warning, index) => (
                              <li key={`${profilingColumn.key}-warning-${index}`}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {correlationMatrix && Array.isArray(correlationMatrix.columns) && correlationMatrix.columns.length > 1 && (
                    <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3 text-[11px] text-dark-textLight">
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-dark-textLight">Korrelationsanalyse</h4>
                          <p className="text-xs text-dark-textGray">
                            Pearson-Korrelation zwischen numerischen Spalten. Bewegen Sie die Maus, um Zeilen und Spalten zu
                            markieren, oder sortieren Sie nach einer Referenzspalte.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-dark-textGray">
                          <span className="rounded border border-gray-700/60 bg-dark-secondary/40 px-2 py-1">
                            {correlationMatrix.type === 'pearson' ? 'Pearson' : correlationMatrix.type || 'Korrelation'} ·{' '}
                            {correlationDisplayColumns.length}/{correlationMatrix.totalNumericColumns || correlationMatrix.columns.length}
                          </span>
                          {correlationMatrix.sampled && (
                            <span className="rounded border border-gray-700/60 bg-dark-secondary/40 px-2 py-1">
                              Sampling: {correlationMatrix.sampleSize} / {correlationMatrix.rowCount}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-dark-textGray">
                        <details className="relative">
                          <summary className="flex cursor-pointer select-none items-center gap-2 rounded-md border border-gray-700 bg-dark-bg px-2 py-1 text-dark-textLight shadow-sm transition-colors hover:border-dark-accent1">
                            <span>Spalten</span>
                            <span className="text-dark-textGray">{correlationSelectionSummary}</span>
                          </summary>
                          <div className="absolute right-0 z-30 mt-1 w-64 rounded-md border border-gray-700 bg-dark-bg p-3 text-dark-textLight shadow-2xl">
                            <div className="mb-2 flex items-center justify-between text-[10px] text-dark-textGray">
                              <span>Spaltenauswahl</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={handleCorrelationSelectionReset}
                                  className="rounded border border-gray-700 px-1 py-0.5 text-[10px] text-dark-textLight transition-colors hover:border-dark-accent1"
                                >
                                  Alle
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCorrelationSelectionClear}
                                  className="rounded border border-gray-700 px-1 py-0.5 text-[10px] text-dark-textLight transition-colors hover:border-dark-accent1"
                                >
                                  Keine
                                </button>
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto pr-1">
                              {correlationAvailableColumns.length === 0 ? (
                                <p className="text-[10px] text-dark-textGray">Keine numerischen Spalten erkannt.</p>
                              ) : (
                                correlationAvailableColumns.map((columnKey) => {
                                  const isSelected =
                                    correlationSelectedColumns.length === 0
                                      ? true
                                      : correlationSelectedColumns.includes(columnKey)
                                  return (
                                    <label key={`correlation-column-${columnKey}`} className="flex items-center gap-2 py-0.5 text-xs text-dark-textLight">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(event) => handleCorrelationColumnToggle(columnKey, event.target.checked)}
                                        className="h-3 w-3 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                                      />
                                      <span className="truncate">{columnKey}</span>
                                    </label>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        </details>

                        <label className="flex items-center gap-2">
                          <span>Schwelle:</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={correlationThreshold}
                            onChange={(event) => handleCorrelationThresholdChange(Number(event.target.value))}
                            className="h-2 w-24 cursor-pointer appearance-none rounded-full bg-gray-700"
                          />
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={correlationThreshold.toFixed(2)}
                            onChange={handleCorrelationThresholdInput}
                            className="w-16 rounded border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          />
                        </label>

                        <label className="flex items-center gap-2">
                          <span>Sortieren:</span>
                          <select
                            value={correlationSortKey}
                            onChange={handleCorrelationSortChange}
                            className="rounded-md border border-gray-700 bg-dark-bg px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            <option value="">Keine</option>
                            {correlationDisplayColumns.map((columnKey) => (
                              <option key={`correlation-sort-${columnKey}`} value={columnKey}>
                                {columnKey}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {correlationTruncatedColumns.length > 0 && (
                        <p className="mb-2 text-[10px] text-yellow-200">
                          {correlationTruncatedColumns.length} weitere numerische Spalten wurden aus Performance-Gründen
                          ausgeblendet.
                        </p>
                      )}

                      {hasCorrelationData ? (
                        <div
                          className="overflow-x-auto"
                          onMouseLeave={() => setHoveredCorrelationCell(null)}
                        >
                          <table className="min-w-full table-fixed border-collapse text-[11px]">
                            <thead>
                              <tr>
                                <th className="sticky left-0 z-10 bg-dark-bg px-2 py-2 text-left font-semibold text-dark-textGray">
                                  Spalte
                                </th>
                                {correlationDisplayColumns.map((columnKey, columnPosition) => {
                                  const isSortColumn = correlationSortKey === columnKey
                                  const isHovered = hoveredCorrelationColumn === columnPosition
                                  return (
                                    <th
                                      key={`correlation-header-${columnKey}`}
                                      className={`px-2 py-2 text-center text-[11px] font-semibold transition-colors ${
                                        isHovered ? 'bg-dark-secondary/60 text-dark-textLight' : 'text-dark-textGray'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCorrelationSortKey((prev) => (prev === columnKey ? '' : columnKey))
                                        }
                                        onMouseEnter={() => setHoveredCorrelationCell({ row: null, column: columnPosition })}
                                        className={`flex w-full items-center justify-center gap-1 rounded px-2 py-1 transition-colors ${
                                          isSortColumn ? 'bg-dark-accent1/30 text-dark-textLight' : 'hover:bg-dark-secondary/40'
                                        }`}
                                      >
                                        <span className="truncate">{columnKey}</span>
                                        {isSortColumn && <span aria-hidden="true">⇅</span>}
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
                                  <tr key={`correlation-row-${rowKey}`} className={isHoveredRow ? 'bg-dark-secondary/30' : ''}>
                                    <th
                                      scope="row"
                                      className={`sticky left-0 z-10 bg-dark-bg px-2 py-1 text-left font-semibold transition-colors ${
                                        isHoveredRow ? 'text-dark-textLight' : 'text-dark-textGray'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCorrelationSortKey((prev) => (prev === rowKey ? '' : rowKey))
                                        }
                                        onMouseEnter={() => setHoveredCorrelationCell({ row: rowPosition, column: null })}
                                        className="flex w-full items-center justify-start gap-1 rounded px-2 py-1 text-left transition-colors hover:bg-dark-secondary/40"
                                      >
                                        <span className="truncate">{rowKey}</span>
                                        {correlationSortKey === rowKey && <span aria-hidden="true">⇅</span>}
                                      </button>
                                    </th>
                                    {correlationDisplayIndices.map((columnMatrixIndex, columnPosition) => {
                                      const value = rowValues?.[columnMatrixIndex] ?? null
                                      const count = correlationPairCounts?.[rowMatrixIndex]?.[columnMatrixIndex] ?? 0
                                      const passesThreshold = value !== null && Math.abs(value) >= correlationThreshold
                                      const displayValue = passesThreshold ? formatCorrelationValue(value) : '–'
                                      const cellColor = passesThreshold ? correlationColorForValue(value) : 'transparent'
                                      const isHoveredColumn = hoveredCorrelationColumn === columnPosition
                                      const isActiveCell =
                                        hoveredCorrelationRow === rowPosition && hoveredCorrelationColumn === columnPosition
                                      const cellClasses = `px-2 py-1 text-center transition-colors ${
                                        isHoveredColumn ? 'bg-dark-secondary/40' : ''
                                      } ${isActiveCell ? 'ring-1 ring-dark-accent1' : ''}`
                                      return (
                                        <td
                                          key={`correlation-cell-${rowKey}-${columnMatrixIndex}`}
                                          className={cellClasses}
                                          style={{ backgroundColor: cellColor }}
                                          onMouseEnter={() =>
                                            setHoveredCorrelationCell({ row: rowPosition, column: columnPosition })
                                          }
                                          title={
                                            value !== null
                                              ? `r = ${formatCorrelationValue(value)} · ${count} Werte`
                                              : 'Keine gemeinsamen Werte'
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
                      ) : (
                        <p className="text-xs text-dark-textGray">
                          Nicht genügend überlappende Werte, um eine Korrelationsmatrix anzuzeigen. Reduzieren Sie ggf. die
                          Schwelle oder wählen Sie weitere Spalten aus.
                        </p>
                      )}
                    </div>
                  )}
                  {hasSelection && (
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-dark-textGray">
                      <span className="rounded-md border border-dark-accent1/40 bg-dark-secondary/40 px-2 py-1 text-dark-textLight/80">
                        {selectedTargets.length} Zellen ausgewählt
                          </span>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={handleFillSelection}
                              className="rounded border border-gray-600 px-2 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                            >
                              Füllen …
                            </button>
                            <button
                              type="button"
                              onClick={handleClearSelection}
                              className="rounded border border-gray-600 px-2 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                            >
                              Löschen
                            </button>
                            <button
                              type="button"
                              onClick={handleIncrementSelection}
                              className="rounded border border-gray-600 px-2 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                            >
                              Inkrementieren …
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFillSeries('vertical')}
                              className="rounded border border-gray-600 px-2 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                            >
                              Serie ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFillSeries('horizontal')}
                              className="rounded border border-gray-600 px-2 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                            >
                              Serie →
                            </button>
                            <div className="flex items-center gap-1">
                              <span className="text-dark-textGray/80">Kopieren von</span>
                              <button
                                type="button"
                                onClick={() => handleCopyFromDirection('up')}
                                className="rounded border border-gray-600 px-1.5 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyFromDirection('down')}
                                className="rounded border border-gray-600 px-1.5 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyFromDirection('left')}
                                className="rounded border border-gray-600 px-1.5 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyFromDirection('right')}
                                className="rounded border border-gray-600 px-1.5 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                              >
                                →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="rounded-lg border border-gray-700 bg-dark-bg/40 p-3">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-dark-textGray">
                            <span className="font-semibold uppercase tracking-wide text-dark-textLight/80">Formel</span>
                            <span className="font-mono text-dark-textGray/80">{activeCellLabel || '–'}</span>
                            {selectionReference && (
                              <span className="rounded border border-dark-accent1/40 bg-dark-secondary/60 px-2 py-0.5 text-dark-textLight/80">
                                Bereich: {selectionReference}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={handleInsertRange}
                              disabled={!selectionReference}
                              className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                                selectionReference
                                  ? 'border-gray-600 text-dark-textLight hover:border-dark-accent1 hover:text-dark-textLight'
                                  : 'cursor-not-allowed border-gray-800 text-dark-textGray'
                              }`}
                            >
                              Bereich einfügen
                            </button>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                            <div className="relative flex-1">
                              <input
                                ref={formulaInputRef}
                                type="text"
                                value={formulaInputValue}
                                onChange={handleFormulaInputChange}
                                onFocus={handleFormulaFocus}
                                onBlur={handleFormulaBlur}
                                onKeyDown={handleFormulaKeyDown}
                                onSelect={handleFormulaSelectionChange}
                                onKeyUp={handleFormulaSelectionChange}
                                onClick={handleFormulaSelectionChange}
                                placeholder={activeCellLabel ? `Formel für ${activeCellLabel}` : 'Formel eingeben'}
                                className="flex-1 rounded-md border border-gray-700 bg-dark-secondary px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                              />
                              {suggestionsOpen && (
                                <div className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-auto rounded-md border border-gray-700 bg-dark-secondary shadow-lg">
                                  {formulaSuggestions.map((suggestion, index) => {
                                    const isActive = index === highlightedSuggestionIndex
                                    return (
                                      <button
                                        key={`formula-suggestion-${suggestion.name}`}
                                        type="button"
                                        className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-xs transition-colors ${
                                          isActive
                                            ? 'bg-dark-accent1/20 text-dark-textLight'
                                            : 'text-dark-textGray hover:bg-dark-secondary/60 hover:text-dark-textLight'
                                        }`}
                                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                                        onMouseDown={(event) => {
                                          event.preventDefault()
                                          applyFormulaSuggestion(suggestion)
                                        }}
                                      >
                                        <span className="font-semibold text-dark-textLight">{suggestion.name}</span>
                                        <span className="font-mono text-[11px] text-dark-textLight/70">{`=${suggestion.syntax}`}</span>
                                        <span className="text-[11px] text-dark-textGray/80">{suggestion.description}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                              {currentFormulaHelp && (
                                <div className="absolute left-full top-0 hidden w-64 translate-x-3 sm:block">
                                  <div className="rounded-md border border-gray-700 bg-dark-secondary/70 p-3 text-xs text-dark-textGray">
                                    <div className="font-semibold text-dark-textLight">{currentFormulaHelp.name}</div>
                                    <div className="mt-1 font-mono text-[11px] text-dark-textLight/80">{`=${currentFormulaHelp.syntax}`}</div>
                                    <p className="mt-1 text-[11px] text-dark-textGray/80">
                                      {currentFormulaHelp.description}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={applyFormulaInput}
                                disabled={!hasActiveCell}
                                className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  hasActiveCell
                                    ? 'border-dark-accent1/60 bg-dark-accent1/10 text-dark-textLight hover:bg-dark-accent1/20'
                                    : 'cursor-not-allowed border-gray-800 bg-gray-900 text-dark-textGray'
                                }`}
                              >
                                Anwenden
                              </button>
                              <button
                                type="button"
                                onClick={handleFormulaCancel}
                                className="rounded border border-gray-700 px-3 py-1.5 text-xs text-dark-textGray transition-colors hover:border-gray-500 hover:text-dark-textLight"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                          {currentFormulaHelp && (
                            <div className="mt-1 rounded-md border border-gray-700 bg-dark-secondary/70 p-3 text-xs text-dark-textGray sm:hidden">
                              <div className="font-semibold text-dark-textLight">{currentFormulaHelp.name}</div>
                              <div className="mt-1 font-mono text-[11px] text-dark-textLight/80">{`=${currentFormulaHelp.syntax}`}</div>
                              <p className="mt-1 text-[11px] text-dark-textGray/80">{currentFormulaHelp.description}</p>
                            </div>
                          )}
                          {activeFormulaError && (
                            <p className="mt-2 text-xs text-red-300">{activeFormulaError}</p>
                          )}
                        </div>
                        {hiddenColumns.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-dark-textGray">
                            <span className="font-semibold text-dark-textLight">Versteckte Spalten:</span>
                            {hiddenColumns.map((column) => (
                              <button
                                key={`show-column-${column.key}`}
                                type="button"
                                onClick={() => handleShowColumn(column.key)}
                                className="rounded border border-gray-600 px-2 py-0.5 text-dark-textLight/80 transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                              >
                                {column.key} einblenden
                              </button>
                            ))}
                          </div>
                        )}
                        {hiddenRawRowIndices.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-dark-textGray">
                            <span className="font-semibold text-dark-textLight">Versteckte Zeilen:</span>
                            {hiddenRawRowIndices.map((rowIndex) => (
                              <button
                                key={`show-row-${rowIndex}`}
                                type="button"
                                onClick={() => handleToggleRowHidden('raw', rowIndex)}
                                className="rounded border border-gray-600 px-2 py-0.5 text-dark-textLight/80 transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                              >
                                Zeile {rowIndex + 1} anzeigen
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="max-h-64 overflow-auto rounded-lg border border-gray-700">
                          <table className="min-w-full divide-y divide-gray-700 text-sm">
                            <thead className="text-xs uppercase tracking-wide text-dark-textGray">
                              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
                                <SortableContext items={visibleColumns.map((column) => column.key)} strategy={horizontalListSortingStrategy}>
                                  <tr ref={headerRef}>
                                    <th
                                      className="sticky left-0 z-50 border-r border-gray-700 bg-dark-bg/90 px-3 py-2 text-left"
                                      style={{ minWidth: `${ACTION_COLUMN_WIDTH}px`, width: `${ACTION_COLUMN_WIDTH}px`, top: 0 }}
                                    >
                                      <span className="text-[10px] uppercase tracking-wide text-dark-textGray">Zeile</span>
                                    </th>
                                    {visibleColumns.map((column) => {
                                      const sortIndex = activeSorts.findIndex((entry) => entry.column === column.key)
                                      const sortEntry = sortIndex >= 0 ? activeSorts[sortIndex] : null
                                      return (
                                        <SortableHeaderCell
                                          key={column.key}
                                          column={column}
                                          sortEntry={sortEntry}
                                          sortIndex={sortIndex}
                                          onSortToggle={handleSortToggle}
                                          onToggleVisibility={handleHideColumn}
                                          onTogglePinned={handleToggleColumnPinned}
                                          onResizeStart={handleColumnResizeStart}
                                          registerRef={registerColumnRef}
                                          isPinnedLeft={column.display?.pinned === 'left'}
                                          isPinnedRight={column.display?.pinned === 'right'}
                                          leftOffset={pinnedLeftOffsets.get(column.key)}
                                          rightOffset={pinnedRightOffsets.get(column.key)}
                                          width={getColumnWidth(column.key)}
                                        />
                                      )
                                    })}
                                  </tr>
                                </SortableContext>
                              </DndContext>
                            </thead>
                            <tbody className="divide-y divide-gray-800 bg-dark-bg/40 text-dark-textLight">
                              {previewEntries.map((entry, rowPosition) => {
                                const rowState = rowDisplayRaw[entry.index] || {}
                                const rowTop = rowState.pinned ? pinnedRawRowOffsets.get(entry.index) ?? headerHeight : undefined
                                const duplicateMeta = duplicateMetaByIndex.get(entry.index)
                                const rowHighlightClass = duplicateMeta
                                  ? duplicateMeta.isPrimary
                                    ? 'bg-emerald-900/10'
                                    : 'bg-red-900/10'
                                  : ''
                                const duplicateBadgeTitle = duplicateMeta
                                  ? `Duplikatgruppe (${duplicateMeta.keyParts
                                      .map((part, index) => `${duplicateMeta.keyColumns?.[index] ?? `Spalte ${index + 1}`}: ${part.display}`)
                                      .join(' · ')}) – ${duplicateMeta.isPrimary ? 'führende Zeile' : 'Duplikat'}`
                                  : ''
                                const isChartHighlighted =
                                  chartPreviewHighlight?.source === 'raw' && chartPreviewHighlight.rowIndex === entry.index
                                const combinedRowClass = [
                                  rowHighlightClass,
                                  isChartHighlighted ? 'ring-1 ring-dark-accent1/60 bg-dark-accent1/10' : ''
                                ]
                                  .filter(Boolean)
                                  .join(' ')
                                  .trim()
                                const rowClassName = combinedRowClass || undefined
                                return (
                                  <tr
                                    key={entry.index}
                                    ref={(node) => registerRowRef('raw', entry.index, node)}
                                    className={rowClassName}
                                  >
                                    <td
                                      className="sticky left-0 z-40 border-r border-gray-800 bg-dark-bg/90 px-2 py-2 text-[11px] text-dark-textGray"
                                      style={{
                                        minWidth: `${ACTION_COLUMN_WIDTH}px`,
                                        width: `${ACTION_COLUMN_WIDTH}px`,
                                        top: rowTop
                                      }}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                          <span className="font-mono text-[10px] text-dark-textGray/80">#{entry.index + 1}</span>
                                          {duplicateMeta && (
                                            <span
                                              className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none ${
                                                duplicateMeta.isPrimary
                                                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
                                                  : 'border-red-500/60 bg-red-500/15 text-red-200'
                                              }`}
                                              title={duplicateBadgeTitle}
                                            >
                                              {duplicateMeta.isPrimary ? 'Prim' : 'Dup'}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleRowPinned('raw', entry.index)}
                                            className={`rounded px-1 text-[10px] transition-colors ${
                                              rowState.pinned
                                                ? 'text-dark-accent1'
                                                : 'text-dark-textGray hover:text-dark-textLight'
                                            }`}
                                            title={rowState.pinned ? 'Fixierung lösen' : 'Zeile fixieren'}
                                          >
                                            📌
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleRowHidden('raw', entry.index)}
                                            className="rounded px-1 text-[10px] text-dark-textGray transition-colors hover:text-dark-textLight"
                                            title="Zeile ausblenden"
                                          >
                                            🚫
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                    {visibleColumns.map((column) => {
                                      const isEditing =
                                        editingCell?.rowIndex === entry.index && editingCell.columnKey === column.key
                                      const matches = entry.matchInfo?.[column.key]
                                      const highlightedValue = renderHighlightedValue(entry.row[column.key], matches)
                                      const hasContent = Array.isArray(highlightedValue)
                                        ? highlightedValue.length > 0
                                        : Boolean(highlightedValue)
                                      const isSelected = selectedCellSet.has(`${entry.index}::${column.key}`)
                                      const isActiveMatch =
                                        activeSearchMatch?.scope === 'raw' &&
                                        activeSearchMatch.rowIndex === entry.index &&
                                        activeSearchMatch.columnKey === column.key
                                      const isPinnedLeft = column.display?.pinned === 'left'
                                      const isPinnedRight = column.display?.pinned === 'right'
                                      const cellLeft = pinnedLeftOffsets.get(column.key)
                                      const cellRight = pinnedRightOffsets.get(column.key)
                                      const cellWidth = getColumnWidth(column.key)
                                      const cellStyle = {
                                        minWidth: `${Math.max(cellWidth, MIN_COLUMN_WIDTH)}px`,
                                        width: column.display?.width ? `${Math.max(cellWidth, MIN_COLUMN_WIDTH)}px` : undefined
                                      }
                                      if (isPinnedLeft || isPinnedRight || rowState.pinned) {
                                        cellStyle.position = 'sticky'
                                        if (isPinnedLeft) {
                                          cellStyle.left = cellLeft
                                        }
                                        if (isPinnedRight) {
                                          cellStyle.right = cellRight
                                        }
                                        if (rowState.pinned) {
                                          cellStyle.top = rowTop ?? headerHeight
                                        }
                                        cellStyle.zIndex = 20 + (isPinnedLeft || isPinnedRight ? 5 : 0) + (rowState.pinned ? 5 : 0)
                                        cellStyle.backgroundColor = 'rgba(17, 24, 39, 0.9)'
                                      }
                                      const manualEditRow = manualEditMap?.[entry.index] || null
                                      const manualEditInfo = manualEditRow ? manualEditRow[column.key] : null
                                      const manualEditOriginalDisplay = manualEditInfo
                                        ? formatCellValue(manualEditInfo.originalValue)
                                        : ''
                                      const manualEditTitle = manualEditInfo
                                        ? `Manuell geändert (ursprünglich: ${
                                            manualEditOriginalDisplay === '' ? '–' : manualEditOriginalDisplay
                                          })`
                                        : ''
                                      return (
                                        <td
                                          key={column.key}
                                          className={`px-3 py-2 text-xs text-dark-textLight/90 ${
                                            isSelected
                                              ? 'bg-dark-accent1/20 text-dark-textLight ring-1 ring-dark-accent1/40'
                                              : ''
                                          } ${
                                            isActiveMatch
                                              ? isSelected
                                                ? 'ring-2 ring-dark-accent1/80'
                                                : 'bg-dark-accent1/10 text-dark-textLight ring-2 ring-dark-accent1/60'
                                              : ''
                                          }`}
                                          style={cellStyle}
                                        >
                                          {isEditing ? (
                                            <input
                                              type={column.type === 'number' ? 'number' : 'text'}
                                              inputMode={column.type === 'number' ? 'decimal' : undefined}
                                              step={column.type === 'number' ? 'any' : undefined}
                                              value={editingValue}
                                              onChange={(event) => setEditingValue(event.target.value)}
                                              onBlur={confirmEdit}
                                              onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                  confirmEdit()
                                                } else if (event.key === 'Escape') {
                                                  cancelEdit()
                                                }
                                              }}
                                              autoFocus
                                              className="w-full rounded-md border border-dark-accent1/60 bg-dark-secondary px-2 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                            />
                                          ) : (
                                            <div className="group relative">
                                              <button
                                                type="button"
                                                data-row-index={entry.index}
                                                data-column-key={column.key}
                                                onMouseDown={(event) => handleCellMouseDown(event, entry, rowPosition, column.key)}
                                                onMouseEnter={() => handleCellMouseEnter(entry, rowPosition, column.key)}
                                                onDoubleClick={() => startEditCell(entry, column.key, rowPosition)}
                                                onKeyDown={(event) => handleCellKeyDown(event, entry, rowPosition, column.key)}
                                                className={`w-full rounded px-1 pr-6 text-left text-dark-textLight/90 transition-colors hover:text-dark-textLight ${
                                                  isSelected ? 'bg-dark-accent1/10' : ''
                                                } focus:outline-none`}
                                              >
                                                {hasContent ? (
                                                  highlightedValue
                                                ) : (
                                                  <span className="text-dark-textGray/60">–</span>
                                                )}
                                              </button>
                                              <span
                                                role="button"
                                                tabIndex={0}
                                                aria-label="Zelle bearbeiten"
                                                title="Zelle bearbeiten"
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={(event) => {
                                                  event.preventDefault()
                                                  event.stopPropagation()
                                                  startEditCell(entry, column.key, rowPosition)
                                                }}
                                                onKeyDown={(event) => {
                                                  if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault()
                                                    event.stopPropagation()
                                                    startEditCell(entry, column.key, rowPosition)
                                                  }
                                                }}
                                                className={`absolute inset-y-0 right-0 flex items-center px-1 text-[11px] transition-opacity ${
                                                  isSelected ? 'opacity-100 text-dark-textLight' : 'opacity-0 text-dark-textGray/70'
                                                } group-hover:opacity-100 group-focus-within:opacity-100`}
                                              >
                                                ✎
                                              </span>
                                              {manualEditInfo && (
                                                <span
                                                  className="pointer-events-none absolute top-0.5 right-3 text-[10px] text-dark-accent1"
                                                  title={manualEditTitle}
                                                >
                                                  ●
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <p className="text-xs text-dark-textGray">
                      Keine Daten zum Anzeigen. Laden Sie eine Datei oder passen Sie die Suchfilter an.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'duplicates' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-dark-textLight">Duplikate prüfen</h3>
                    <p className="text-xs text-dark-textGray">
                      Wählen Sie Schlüsselspalten, um doppelte Zeilen zu identifizieren und zu bereinigen.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-dark-textLight">Schlüsselspalten</h4>
                        <p className="text-[11px] text-dark-textGray">
                          Die Kombination dieser Spalten dient als eindeutiger Schlüssel für Duplikate.
                        </p>
                      </div>
                      <div className="flex gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={handleDuplicateSelectAll}
                          className="rounded-md border border-gray-700 px-2 py-1 text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1"
                          disabled={columns.length === 0}
                        >
                          Alle
                        </button>
                        <button
                          type="button"
                          onClick={handleDuplicateClear}
                          className="rounded-md border border-gray-700 px-2 py-1 text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1"
                          disabled={duplicateKeyColumns.length === 0}
                        >
                          Keine
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {columns.length === 0 ? (
                        <p className="col-span-full text-[11px] text-dark-textGray">
                          Keine Spalten verfügbar.
                        </p>
                      ) : (
                        columns.map((column) => {
                          const checked = duplicateKeyColumns.includes(column.key)
                          return (
                            <label
                              key={`duplicate-key-${column.key}`}
                              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                                checked
                                  ? 'border-dark-accent1/70 bg-dark-secondary/60 text-dark-textLight'
                                  : 'border-gray-700 bg-dark-secondary/30 text-dark-textLight hover:border-dark-accent1'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => handleDuplicateColumnToggle(column.key, event.target.checked)}
                                className="h-3.5 w-3.5 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                              />
                              <span className="truncate">{column.key}</span>
                            </label>
                          )
                        })
                      )}
                    </div>

                    <div className="rounded-md border border-gray-700/60 bg-dark-secondary/30 p-3 text-[11px] text-dark-textGray">
                      {!hasDuplicateSelection && <p>Wählen Sie mindestens eine Spalte aus, um nach Duplikaten zu suchen.</p>}
                      {hasDuplicateSelection && !hasDuplicates && (
                        <p className="text-dark-textLight/80">Für die ausgewählten Schlüssel wurden keine Duplikate gefunden.</p>
                      )}
                      {hasDuplicateSelection && hasDuplicates && (
                        <div className="space-y-1 text-dark-textLight/90">
                          <p>
                            <span className="font-semibold text-dark-textLight">{duplicateGroups.length}</span>{' '}
                            {duplicateGroups.length === 1 ? 'Gruppe' : 'Gruppen'} mit{' '}
                            <span className="font-semibold text-dark-textLight">{duplicateRowCount}</span>{' '}
                            {duplicateRowCount === 1 ? 'Zeile' : 'Zeilen'} gefunden.
                          </p>
                          <p className="text-dark-textGray">Duplikatzeilen sind im Raster markiert.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolveDuplicatesAction('keep-oldest')}
                        className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!hasDuplicates}
                      >
                        Älteste Zeile behalten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveDuplicatesAction('merge')}
                        className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!hasDuplicates}
                      >
                        Zusammenführen
                      </button>
                      {duplicateActionFeedback && (
                        <span
                          className={`text-xs ${
                            duplicateActionFeedback.type === 'success' ? 'text-emerald-300' : 'text-dark-textGray'
                          }`}
                        >
                          {duplicateActionFeedback.message}
                        </span>
                      )}
                    </div>

                    {hasDuplicates && (
                      <div className="max-h-52 overflow-y-auto rounded-md border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-700 text-[11px]">
                          <thead className="bg-dark-secondary/40 text-[10px] uppercase tracking-wide text-dark-textGray">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Schlüssel</th>
                              <th className="px-3 py-2 text-left font-semibold">Primärzeile</th>
                              <th className="px-3 py-2 text-left font-semibold">Weitere Zeilen</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800 bg-dark-bg/40 text-dark-textLight">
                            {duplicateGroups.map((group) => (
                              <tr key={`duplicate-group-${group.primaryIndex}-${group.key}`}>
                                <td className="px-3 py-2">
                                  <div className="space-y-1">
                                    {group.keyParts.map((part, index) => (
                                      <div key={`${group.key}-part-${index}`} className="flex items-center gap-2">
                                        <span className="text-dark-textGray">{group.keyColumns?.[index]}:</span>
                                        <span className="font-mono text-dark-textLight/90">{part.display}</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-3 py-2 font-mono text-dark-textGray">#{group.primaryIndex + 1}</td>
                                <td className="px-3 py-2 font-mono text-dark-textGray">
                                  {group.duplicateIndices.map((rowIndex) => `#${rowIndex + 1}`).join(', ')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'transformations' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-dark-textLight">Transformationen</h3>
                    <p className="text-xs text-dark-textGray">
                      Filtern, gruppieren und aggregieren Sie die Daten, bevor sie importiert werden.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                      <h4 className="text-sm font-semibold text-dark-textLight">Wert-Regeln (vor Filter/Gruppierung)</h4>
                      <p className="text-[11px] text-dark-textGray">Regelbasiertes Umformen. Originaldaten bleiben erhalten.</p>
                      <div className="space-y-2">
                        {valueRules.length === 0 ? (
                          <p className="text-xs text-dark-textGray">Keine Regeln hinzugefügt.</p>
                        ) : (
                          valueRules.map((rule) => (
                            <div key={rule.id} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto] items-center rounded-md border border-gray-700 bg-dark-bg/60 p-3">
                              <select value={rule.column || ''} onChange={(e) => handleValueRuleChange(rule.id, { column: e.target.value })} className="rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none">
                                <option value="">Spalte wählen…</option>
                                {columns.map((c) => (
                                  <option key={c.key} value={c.key}>{c.key}</option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <select value={rule.when?.operator || 'containsText'} onChange={(e) => handleValueRuleChange(rule.id, { when: { ...(rule.when || {}), operator: e.target.value } })} className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none">
                                  {VALUE_RULE_CONDITIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                                {['containsText','notContainsText','equalsText','matchesRegex'].includes(rule.when?.operator) && (
                                  <input type="text" value={rule.when?.value || ''} onChange={(e) => handleValueRuleChange(rule.id, { when: { ...(rule.when || {}), value: e.target.value } })} placeholder={rule.when?.operator === 'matchesRegex' ? 'Regex Muster' : 'Wert'} className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                )}
                                {rule.when?.operator === 'matchesRegex' && (
                                  <input type="text" value={rule.when?.flags || ''} onChange={(e) => handleValueRuleChange(rule.id, { when: { ...(rule.when || {}), flags: e.target.value } })} placeholder="Flags" className="w-24 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                )}
                              </div>
                              <div className="flex gap-2">
                                <select value={rule.action?.type || 'replaceText'} onChange={(e) => handleValueRuleChange(rule.id, { action: { ...(rule.action || {}), type: e.target.value } })} className="w-full rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none">
                                  {VALUE_RULE_ACTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                                {['replaceText'].includes(rule.action?.type) && (
                                  <>
                                    <input type="text" value={rule.action?.search || ''} onChange={(e) => handleValueRuleChange(rule.id, { action: { ...(rule.action || {}), search: e.target.value } })} placeholder="suche" className="w-28 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                    <input type="text" value={rule.action?.value || ''} onChange={(e) => handleValueRuleChange(rule.id, { action: { ...(rule.action || {}), value: e.target.value } })} placeholder="ersetzen durch" className="w-32 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                  </>
                                )}
                                {['regexReplace'].includes(rule.action?.type) && (
                                  <>
                                    <input type="text" value={rule.action?.pattern || ''} onChange={(e) => handleValueRuleChange(rule.id, { action: { ...(rule.action || {}), pattern: e.target.value } })} placeholder="Regex" className="w-28 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                    <input type="text" value={rule.action?.flags || ''} onChange={(e) => handleValueRuleChange(rule.id, { action: { ...(rule.action || {}), flags: e.target.value } })} placeholder="Flags" className="w-16 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                    <input type="text" value={rule.action?.value || ''} onChange={(e) => handleValueRuleChange(rule.id, { action: { ...(rule.action || {}), value: e.target.value } })} placeholder="ersetzen durch" className="w-32 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                  </>
                                )}
                                {['setText'].includes(rule.action?.type) && (
                                  <input type="text" value={rule.action?.value || ''} onChange={(e) => handleValueRuleChange(rule.id, { action: { ...(rule.action || {}), value: e.target.value } })} placeholder="Text" className="w-36 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                )}
                                {['multiply','divide'].includes(rule.action?.type) && (
                                  <input type="number" step="any" value={rule.action?.factor || ''} onChange={(e) => handleValueRuleChange(rule.id, { action: { ...(rule.action || {}), factor: e.target.value } })} placeholder="Faktor" className="w-28 rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                )}
                              </div>
                              <div className="flex justify-end">
                                <button type="button" onClick={() => handleRemoveValueRule(rule.id)} className="rounded-md border border-red-600 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40">Entfernen</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div>
                        <button type="button" onClick={handleAddValueRule} className="rounded-md border border-gray-700 px-2 py-1 text-xs text-dark-textLight hover:bg-dark-bg/60">Regel hinzufügen</button>
                      </div>
                    </div>
                    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-dark-textLight">Filter</h4>
                        <button
                          type="button"
                          onClick={handleAddFilter}
                          className="rounded-md border border-gray-600 px-3 py-1 text-xs font-medium text-dark-textLight hover:border-dark-accent1 hover:text-dark-accent1"
                        >
                          Filter hinzufügen
                        </button>
                      </div>
                      {filters.length === 0 ? (
                        <p className="text-xs text-dark-textGray">
                          Es sind keine Filter aktiv. Fügen Sie Filter hinzu, um Zeilen anhand von Bedingungen auszuschließen.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {filters.map((filter, filterIndex) => (
                            <div key={filter.id} className="space-y-2">
                              {filterIndex > 0 && (
                                <div className="flex items-center justify-center py-1">
                                  <select
                                    value={filter.logicOperator || 'and'}
                                    onChange={(event) => handleFilterChange(filter.id, { logicOperator: event.target.value })}
                                    className="rounded-md border border-gray-600 bg-dark-bg/80 px-3 py-1 text-xs font-semibold text-dark-textLight hover:border-dark-accent1 focus:border-dark-accent1 focus:outline-none"
                                  >
                                    <option value="and">UND</option>
                                    <option value="or">ODER</option>
                                  </select>
                                </div>
                              )}
                              <div className="space-y-3 rounded-md border border-gray-700 bg-dark-bg/60 p-3">
                                <div className="grid gap-3 md:grid-cols-12 items-start">
                                  <div className="flex items-center space-x-2 md:col-span-12 lg:col-span-2">
                                    <input
                                      type="checkbox"
                                      checked={filter.enabled !== false}
                                      onChange={(event) => handleToggleFilter(filter.id, event.target.checked)}
                                      className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                                    />
                                    <span className="text-xs text-dark-textLight">Aktiv</span>
                                  </div>
                                  <div className="md:col-span-6 lg:col-span-4">
                                    <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                      Spalte
                                    </label>
                                    <select
                                      value={filter.column}
                                      onChange={(event) => handleFilterChange(filter.id, { column: event.target.value })}
                                      className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                    >
                                      <option value="">Spalte wählen …</option>
                                      {columns.map((column) => (
                                        <option key={column.key} value={column.key}>
                                          {column.key}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="md:col-span-6 lg:col-span-6">
                                    <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                      Operator
                                    </label>
                                    <select
                                      value={filter.operator || 'equalsText'}
                                      onChange={(event) => handleFilterChange(filter.id, { operator: event.target.value, value: '', minValue: '', maxValue: '', flags: '' })}
                                      className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                    >
                                      {FILTER_OPERATORS.map((operator) => (
                                        <option key={operator.value} value={operator.value}>
                                          {operator.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {/* Between operator needs min/max */}
                                  {filter.operator === 'between' && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">
                                          Min-Wert
                                        </label>
                                        <input
                                          type="number"
                                          step="any"
                                          value={filter.minValue || ''}
                                          onChange={(event) => handleFilterChange(filter.id, { minValue: event.target.value })}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="Min"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">
                                          Max-Wert
                                        </label>
                                        <input
                                          type="number"
                                          step="any"
                                          value={filter.maxValue || ''}
                                          onChange={(event) => handleFilterChange(filter.id, { maxValue: event.target.value })}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="Max"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {/* DateBetween operator needs min/max dates */}
                                  {filter.operator === 'dateBetween' && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">
                                          Von (Datum)
                                        </label>
                                        <input
                                          type="text"
                                          value={filter.minValue || ''}
                                          onChange={(event) => handleFilterChange(filter.id, { minValue: event.target.value })}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="2023-12-01 oder ISO 8601"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">
                                          Bis (Datum)
                                        </label>
                                        <input
                                          type="text"
                                          value={filter.maxValue || ''}
                                          onChange={(event) => handleFilterChange(filter.id, { maxValue: event.target.value })}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="2023-12-31 oder ISO 8601"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {/* Regex operators need pattern and flags */}
                                  {['matchesRegex', 'notMatchesRegex'].includes(filter.operator) && (
                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                      <div>
                                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">
                                          Regex-Muster
                                        </label>
                                        <input
                                          type="text"
                                          value={filter.value || ''}
                                          onChange={(event) => handleFilterChange(filter.id, { value: event.target.value })}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="z. B. ^[A-Z]"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">
                                          Flags
                                        </label>
                                        <input
                                          type="text"
                                          value={filter.flags || ''}
                                          onChange={(event) => handleFilterChange(filter.id, { flags: event.target.value })}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="i, g"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {/* DateTime operators (except dateBetween) */}
                                  {filter.operator?.startsWith('date') && filter.operator !== 'dateBetween' && (
                                    <div>
                                      <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">
                                        Datum/Zeit (ISO 8601)
                                      </label>
                                      <input
                                        type="text"
                                        value={filter.value || ''}
                                        onChange={(event) => handleFilterChange(filter.id, { value: event.target.value })}
                                        className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                        placeholder="2023-12-25T10:30:00 oder 2023-12-25"
                                      />
                                    </div>
                                  )}
                                  {/* Number operators (except between) */}
                                  {!['between', 'dateBetween', 'matchesRegex', 'notMatchesRegex', 'isEmpty', 'isNotEmpty', 'isNumber', 'isText', 'isDateTime'].includes(filter.operator) && 
                                   !filter.operator?.startsWith('date') && (
                                    <div>
                                      <label className="mb-1 block text-[10px] uppercase tracking-wide text-dark-textGray">
                                        Wert
                                      </label>
                                      <input
                                        type={['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(filter.operator) ? 'number' : 'text'}
                                        step={['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(filter.operator) ? 'any' : undefined}
                                        value={filter.value || ''}
                                        onChange={(event) => handleFilterChange(filter.id, { value: event.target.value })}
                                        className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                        placeholder={['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(filter.operator) ? 'Zahl' : 'Text'}
                                      />
                                    </div>
                                  )}
                                  {/* Type checks don't need values */}
                                  {['isEmpty', 'isNotEmpty', 'isNumber', 'isText', 'isDateTime'].includes(filter.operator) && (
                                    <p className="text-[10px] text-dark-textGray italic">Kein Wert erforderlich</p>
                                  )}
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFilter(filter.id)}
                                    className="rounded-md border border-red-600 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                                  >
                                    Entfernen
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-dark-textLight">Pivot</h4>
                          <p className="text-[11px] text-dark-textGray">
                            Wandelt Werte aus einer Schlüsselspalte in dynamische Spalten um.
                          </p>
                        </div>
                        <label className="flex items-center space-x-2 text-xs text-dark-textLight">
                          <input
                            type="checkbox"
                            checked={pivotConfig.enabled}
                            onChange={(event) => handleTogglePivot(event.target.checked)}
                            className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                          />
                          <span>Aktivieren</span>
                        </label>
                      </div>
                      {!pivotConfig.enabled ? (
                        <p className="text-xs text-dark-textGray">
                          Aktivieren Sie die Pivot-Transformation, um Werte einer Spalte als neue Spalten abzubilden.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Schlüsselspalte
                              </label>
                              <select
                                value={pivotConfig.keyColumn || ''}
                                onChange={(event) => handlePivotKeyChange(event.target.value)}
                                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                              >
                                <option value="">Spalte wählen …</option>
                                {columns.map((column) => (
                                  <option key={`pivot-key-${column.key}`} value={column.key}>
                                    {column.key}
                                  </option>
                                ))}
                              </select>
                              <p className="mt-1 text-[11px] text-dark-textGray">
                                Jeder eindeutige Wert bildet eine eigene Spalte.
                              </p>
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Wertespalte
                              </label>
                              <select
                                value={pivotConfig.valueColumn || ''}
                                onChange={(event) => handlePivotValueChange(event.target.value)}
                                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                              >
                                <option value="">Spalte wählen …</option>
                                {columns.map((column) => (
                                  <option key={`pivot-value-${column.key}`} value={column.key}>
                                    {column.key}
                                  </option>
                                ))}
                              </select>
                              <p className="mt-1 text-[11px] text-dark-textGray">
                                Inhalt für die neu entstehenden Spalten.
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                                Beibehaltende Index-Spalten
                              </h5>
                              <span className="text-[11px] text-dark-textGray">optional</span>
                            </div>
                            {columns.length === 0 ? (
                              <p className="text-[11px] text-dark-textGray">Keine Spalten verfügbar.</p>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {columns.map((column) => {
                                  const checked = pivotIndexColumnsSet.has(column.key)
                                  return (
                                    <label
                                      key={`pivot-index-${column.key}`}
                                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                                        checked
                                          ? 'border-dark-accent1/70 bg-dark-secondary/60 text-dark-textLight'
                                          : 'border-gray-700 bg-dark-secondary/30 text-dark-textLight hover:border-dark-accent1'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) => handlePivotIndexToggle(column.key, event.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                                      />
                                      <span className="truncate">{column.key}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Präfix für neue Spalten
                              </label>
                              <input
                                type="text"
                                value={pivotConfig.prefix || ''}
                                onChange={(event) => handlePivotPrefixChange(event.target.value)}
                                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                placeholder="z. B. Jahr_"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Leereinträge auffüllen mit
                              </label>
                              <input
                                type="text"
                                value={pivotFillValueInput}
                                onChange={(event) => handlePivotFillValueChange(event.target.value)}
                                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                placeholder="leer lassen für null"
                              />
                              <p className="mt-1 text-[11px] text-dark-textGray">
                                Leer lassen, um fehlende Kombinationen unverändert zu lassen.
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2 rounded-md border border-gray-700 bg-dark-bg/50 p-3 text-[11px] text-dark-textGray">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                                Erzeugte Spalten
                              </span>
                              {pivotMeta.createdColumns.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {pivotMeta.createdColumns.map((column) => (
                                    <span
                                      key={`pivot-preview-${column}`}
                                      className="rounded border border-gray-600 px-2 py-0.5 text-dark-textLight/90"
                                    >
                                      {column}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-dark-textGray">Noch keine Vorschau verfügbar.</span>
                              )}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                              <div>
                                Gruppen: <span className="text-dark-textLight">{pivotMeta.groups}</span>
                              </div>
                              <div>
                                Ignorierte Schlüssel: <span className="text-dark-textLight">{pivotMeta.skippedMissingKey}</span>
                              </div>
                              <div>
                                Überschriebene Werte: <span className="text-dark-textLight">{pivotMeta.duplicateAssignments}</span>
                              </div>
                            </div>
                            {pivotMeta.skippedMissingValue > 0 && (
                              <div>
                                Übersprungene Werte: <span className="text-dark-textLight">{pivotMeta.skippedMissingValue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-dark-textLight">Unpivot (Melt)</h4>
                          <p className="text-[11px] text-dark-textGray">
                            Formt mehrere Wertespalten in Zeilenpaare um.
                          </p>
                        </div>
                        <label className="flex items-center space-x-2 text-xs text-dark-textLight">
                          <input
                            type="checkbox"
                            checked={unpivotConfig.enabled}
                            onChange={(event) => handleToggleUnpivot(event.target.checked)}
                            className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                          />
                          <span>Aktivieren</span>
                        </label>
                      </div>
                      {!unpivotConfig.enabled ? (
                        <p className="text-xs text-dark-textGray">
                          Bringt breite Tabellen in ein langes Format – ideal für Heatmaps oder Zeitreihen.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                              Beibehaltende ID-Spalten
                            </h5>
                            {columns.length === 0 ? (
                              <p className="text-[11px] text-dark-textGray">Keine Spalten verfügbar.</p>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {columns.map((column) => {
                                  const checked = unpivotIdColumnsSet.has(column.key)
                                  return (
                                    <label
                                      key={`unpivot-id-${column.key}`}
                                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                                        checked
                                          ? 'border-dark-accent1/70 bg-dark-secondary/60 text-dark-textLight'
                                          : 'border-gray-700 bg-dark-secondary/30 text-dark-textLight hover:border-dark-accent1'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) => handleUnpivotIdToggle(column.key, event.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                                      />
                                      <span className="truncate">{column.key}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                              Wertespalten zum Auflösen
                            </h5>
                            {columns.length === 0 ? (
                              <p className="text-[11px] text-dark-textGray">Keine Spalten verfügbar.</p>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {columns.map((column) => {
                                  const checked = unpivotValueColumnsSet.has(column.key)
                                  return (
                                    <label
                                      key={`unpivot-value-${column.key}`}
                                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                                        checked
                                          ? 'border-dark-accent1/70 bg-dark-secondary/60 text-dark-textLight'
                                          : 'border-gray-700 bg-dark-secondary/30 text-dark-textLight hover:border-dark-accent1'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) => handleUnpivotValueToggle(column.key, event.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                                      />
                                      <span className="truncate">{column.key}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                            {unpivotConfig.valueColumns.length === 0 && (
                              <p className="text-[11px] text-yellow-200">
                                Wählen Sie mindestens eine Wertespalte aus, um Zeilen zu erzeugen.
                              </p>
                            )}
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Name für Spaltenkennung
                              </label>
                              <input
                                type="text"
                                value={unpivotConfig.variableColumn || ''}
                                onChange={(event) => handleUnpivotVariableChange(event.target.value)}
                                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                placeholder="z. B. Kategorie"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Name für Werte
                              </label>
                              <input
                                type="text"
                                value={unpivotConfig.valueColumnName || ''}
                                onChange={(event) => handleUnpivotValueNameChange(event.target.value)}
                                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                placeholder="z. B. Messwert"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-dark-textLight">
                            <input
                              type="checkbox"
                              checked={unpivotConfig.dropEmptyValues !== false}
                              onChange={(event) => handleUnpivotDropEmptyToggle(event.target.checked)}
                              className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                            />
                            <span>Leere Werte überspringen</span>
                          </label>
                          <div className="space-y-2 rounded-md border border-gray-700 bg-dark-bg/50 p-3 text-[11px] text-dark-textGray">
                            <div className="grid gap-2 sm:grid-cols-3">
                              <div>
                                Erzeugte Zeilen: <span className="text-dark-textLight">{unpivotMeta.createdRows}</span>
                              </div>
                              <div>
                                Wertespalten: <span className="text-dark-textLight">{unpivotMeta.valueColumns.length}</span>
                              </div>
                              <div>
                                Ausgelassene Werte: <span className="text-dark-textLight">{unpivotMeta.skippedEmpty}</span>
                              </div>
                            </div>
                            {unpivotMeta.valueColumns.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {unpivotMeta.valueColumns.map((column) => (
                                  <span
                                    key={`unpivot-preview-${column}`}
                                    className="rounded border border-gray-600 px-2 py-0.5 text-dark-textLight/90"
                                  >
                                    {column}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-dark-textLight">Gruppierung</h4>
                        <label className="flex items-center space-x-2 text-xs text-dark-textLight">
                          <input
                            type="checkbox"
                            checked={grouping.enabled}
                            onChange={(event) => handleToggleGrouping(event.target.checked)}
                            className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                          />
                          <span>Aktivieren</span>
                        </label>
                      </div>
                      {!grouping.enabled ? (
                        <p className="text-xs text-dark-textGray">
                          Standardmäßig werden Zeilen nicht zusammengefasst. Aktivieren Sie die Gruppierung, um Werte zusammenzufassen
                          und Aggregationen zu verwenden.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Gruppieren nach Spalten
                              </label>
                              <div className="space-y-2">
                                {selectedGroupingColumns.length === 0 ? (
                                  <p className="text-[11px] text-dark-textGray">
                                    Keine Spalte ausgewählt. Fügen Sie mindestens eine Spalte hinzu, um Gruppen zu bilden.
                                  </p>
                                ) : (
                                  <ul className="space-y-1">
                                    {selectedGroupingColumns.map((columnKey, index) => (
                                      <li key={`${columnKey}-${index}`} className="flex items-center gap-2">
                                        <span className="flex-1 truncate rounded-md border border-gray-700 bg-dark-secondary/40 px-2 py-1.5 text-sm text-dark-textLight">
                                          {columnKey}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleMoveGroupingColumn(index, -1)}
                                            disabled={index === 0}
                                            className="rounded-md border border-gray-700 px-2 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-dark-textGray"
                                            title="Nach oben verschieben"
                                          >
                                            ↑
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleMoveGroupingColumn(index, 1)}
                                            disabled={index === selectedGroupingColumns.length - 1}
                                            className="rounded-md border border-gray-700 px-2 py-1 text-[11px] text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-dark-textGray"
                                            title="Nach unten verschieben"
                                          >
                                            ↓
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveGroupingColumn(index)}
                                            className="rounded-md border border-red-600 px-2 py-1 text-[11px] text-red-200 transition-colors hover:bg-red-900/40"
                                          >
                                            Entfernen
                                          </button>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <select
                                    value={groupingColumnToAdd}
                                    onChange={(event) => setGroupingColumnToAdd(event.target.value)}
                                    disabled={availableGroupingOptions.length === 0}
                                    className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none disabled:cursor-not-allowed disabled:text-dark-textGray"
                                  >
                                    <option value="">Spalte auswählen…</option>
                                    {availableGroupingOptions.map((column) => (
                                      <option key={column.key} value={column.key}>
                                        {column.key}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleAddGroupingColumn(groupingColumnToAdd)
                                      setGroupingColumnToAdd('')
                                    }}
                                    disabled={!groupingColumnToAdd}
                                    className="rounded-md border border-gray-700 px-2 py-1 text-xs text-dark-textLight transition-colors hover:border-dark-accent1 hover:text-dark-accent1 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-dark-textGray"
                                  >
                                    Hinzufügen
                                  </button>
                                </div>
                              </div>
                              <p className="mt-1 text-[11px] text-dark-textGray">
                                Die ausgewählten Spalten werden kombiniert (Reihenfolge zählt) und bilden den Gruppenschlüssel.
                              </p>
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                Name für sonstige Werte
                              </label>
                              <input
                                type="text"
                                value={grouping.fallbackLabel || ''}
                                onChange={(event) => handleGroupingFallbackChange(event.target.value)}
                                className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                placeholder="z. B. Sonstige"
                              />
                              <p className="mt-1 text-[11px] text-dark-textGray">
                                Wird für Werte verwendet, die keiner definierten Gruppe zugeordnet werden können.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-dark-textGray">
                                Eigene Gruppen (optional)
                              </h5>
                              <button
                                type="button"
                                onClick={handleAddGroup}
                                className="rounded-md border border-gray-600 px-2 py-1 text-xs text-dark-textLight hover:border-dark-accent1 hover:text-dark-accent1"
                              >
                                Gruppe hinzufügen
                              </button>
                            </div>
                            {(grouping.customGroups || []).length === 0 ? (
                              <p className="text-[11px] text-dark-textGray">
                                Ohne eigene Gruppen werden Werte nach ihrer exakten Ausprägung zusammengefasst.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {(grouping.customGroups || []).map((group) => (
                                  <div
                                    key={group.id}
                                    className="rounded-md border border-gray-700 bg-dark-bg/60 p-3 space-y-2"
                                  >
                                    <div className="grid gap-2 md:grid-cols-2">
                                      <div>
                                        <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                          Gruppenname
                                        </label>
                                        <input
                                          type="text"
                                          value={group.label || ''}
                                          onChange={(event) => handleGroupLabelChange(group.id, event.target.value)}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="z. B. Gruppe A"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                                          Werte (durch Komma getrennt)
                                        </label>
                                        <input
                                          type="text"
                                          value={(group.values || []).join(', ')}
                                          onChange={(event) => handleGroupValuesChange(group.id, event.target.value)}
                                          className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                          placeholder="z. B. A1, A2, A3"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveGroup(group.id)}
                                        className="rounded-md border border-red-600 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                                      >
                                        Entfernen
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                      <h4 className="text-sm font-semibold text-dark-textLight">Aggregation</h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-dark-textGray">
                            Standard-Aggregation
                          </label>
                          <select
                            value={aggregations.defaultOperation || 'sum'}
                            onChange={(event) => handleAggregationDefaultChange(event.target.value)}
                            className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                          >
                            {AGGREGATION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-[11px] text-dark-textGray">
                            Wird verwendet, wenn für eine Werte-Spalte keine eigene Auswahl getroffen wird.
                          </p>
                          {aggregations.defaultOperation === 'countValid' && (
                            <div className="mt-3 rounded-md border border-gray-700 bg-dark-bg/50 p-3 space-y-2">
                              <label className="block text-xs font-medium text-dark-textLight">
                                Standard-Kriterien für gültige Werte:
                              </label>
                              {(aggregations.defaultCriteriaList || aggregations.defaultCriteria ? (aggregations.defaultCriteriaList || [aggregations.defaultCriteria]) : [{ operator: 'greaterThan', value: '' }]).map((crit, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                  <select
                                    value={crit.operator || 'greaterThan'}
                                    onChange={(e) => updateTransformations((prev) => {
                                      const list = prev.aggregations?.defaultCriteriaList || (prev.aggregations?.defaultCriteria ? [prev.aggregations.defaultCriteria] : [])
                                      const next = [...list]
                                      next[idx] = { ...(next[idx] || {}), operator: e.target.value }
                                      return { ...prev, aggregations: { ...prev.aggregations, defaultCriteriaList: next, defaultCriteria: undefined } }
                                    })}
                                    className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                  >
                                    <option value="greaterThan">größer als</option>
                                    <option value="greaterThanOrEqual">größer oder gleich</option>
                                    <option value="lessThan">kleiner als</option>
                                    <option value="lessThanOrEqual">kleiner oder gleich</option>
                                    <option value="equals">ist gleich</option>
                                    <option value="notEquals">ist ungleich</option>
                                    <option value="between">zwischen</option>
                                    <option value="isNumber">nur Zahlen</option>
                                    <option value="isText">nur Text</option>
                                    <option value="isEmpty">ist leer</option>
                                    <option value="isNotEmpty">ist nicht leer</option>
                                    <option value="equalsText">Text ist gleich</option>
                                    <option value="notEqualsText">Text ist ungleich</option>
                                    <option value="containsText">Text enthält</option>
                                    <option value="notContainsText">Text enthält nicht</option>
                                    <option value="matchesRegex">passt auf Regex</option>
                                    <option value="notMatchesRegex">passt nicht auf Regex</option>
                                  </select>
                                  {crit.operator === 'between' ? (
                                    <>
                                      <input type="number" step="any" value={crit.minValue || ''} onChange={(e) => updateTransformations((prev) => {
                                        const list = prev.aggregations?.defaultCriteriaList || []
                                        const next = [...list]
                                        next[idx] = { ...(next[idx] || {}), minValue: e.target.value }
                                        return { ...prev, aggregations: { ...prev.aggregations, defaultCriteriaList: next } }
                                      })} placeholder="Min" className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                      <span className="text-xs text-dark-textGray text-center">und</span>
                                      <input type="number" step="any" value={crit.maxValue || ''} onChange={(e) => updateTransformations((prev) => {
                                        const list = prev.aggregations?.defaultCriteriaList || []
                                        const next = [...list]
                                        next[idx] = { ...(next[idx] || {}), maxValue: e.target.value }
                                        return { ...prev, aggregations: { ...prev.aggregations, defaultCriteriaList: next } }
                                      })} placeholder="Max" className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                    </>
                                  ) : (
                                    <input type={["equalsText","notEqualsText","containsText","notContainsText","matchesRegex","notMatchesRegex"].includes(crit.operator) ? "text" : "number"} step={["equalsText","notEqualsText","containsText","notContainsText","matchesRegex","notMatchesRegex"].includes(crit.operator) ? undefined : "any"} value={crit.value || ''} onChange={(e) => updateTransformations((prev) => {
                                      const list = prev.aggregations?.defaultCriteriaList || []
                                      const next = [...list]
                                      next[idx] = { ...(next[idx] || {}), value: e.target.value }
                                      return { ...prev, aggregations: { ...prev.aggregations, defaultCriteriaList: next } }
                                    })} placeholder={["equalsText","notEqualsText","containsText","notContainsText"].includes(crit.operator) ? 'Text' : (["matchesRegex","notMatchesRegex"].includes(crit.operator) ? 'Regex Muster' : 'Wert')} className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none col-span-2" />
                                  )}
                                  {['matchesRegex','notMatchesRegex'].includes(crit.operator) && (
                                    <input type="text" value={crit.flags || ''} onChange={(e) => updateTransformations((prev) => {
                                      const list = prev.aggregations?.defaultCriteriaList || []
                                      const next = [...list]
                                      next[idx] = { ...(next[idx] || {}), flags: e.target.value }
                                      return { ...prev, aggregations: { ...prev.aggregations, defaultCriteriaList: next } }
                                    })} placeholder="Regex Flags (z. B. i, g)" className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                  )}
                                  <button type="button" onClick={() => updateTransformations((prev) => {
                                    const list = prev.aggregations?.defaultCriteriaList || []
                                    const next = list.filter((_, i) => i !== idx)
                                    return { ...prev, aggregations: { ...prev.aggregations, defaultCriteriaList: next } }
                                  })} className="text-xs text-red-300 hover:text-red-200">Entfernen</button>
                                </div>
                              ))}
                              <button type="button" onClick={() => updateTransformations((prev) => ({
                                ...prev,
                                aggregations: { ...prev.aggregations, defaultCriteriaList: [ ...(prev.aggregations?.defaultCriteriaList || (prev.aggregations?.defaultCriteria ? [prev.aggregations.defaultCriteria] : [])), { operator: 'greaterThan', value: '' } ], defaultCriteria: undefined }
                              }))} className="mt-2 rounded-md border border-gray-700 px-2 py-1 text-xs text-dark-textLight hover:bg-dark-bg/60">Weiteres Kriterium hinzufügen</button>
                            </div>
                          )}
                        </div>
                      </div>
                      {mapping.valueColumns.length === 0 ? (
                        <p className="text-xs text-dark-textGray">
                          Bitte wählen Sie zunächst mindestens eine Werte-Spalte aus.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {mapping.valueColumns.map((column) => {
                            const currentOperation = aggregations.perColumn?.[column] || aggregations.defaultOperation || 'sum'
                            const isCountValid = currentOperation === 'countValid'
                            const criteria = aggregations.criteria?.[column] || aggregations.defaultCriteria || { operator: 'greaterThan', value: '' }
                            
                            return (
                              <div key={column} className="space-y-2">
                                <div className="grid items-center gap-2 md:grid-cols-2">
                                  <span className="text-sm text-dark-textLight">{column}</span>
                                  <select
                                    value={currentOperation}
                                    onChange={(event) => handleAggregationChange(column, event.target.value)}
                                    className="rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                  >
                                    {AGGREGATION_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {isCountValid && (
                                  <div className="ml-0 md:ml-[calc(50%+0.5rem)] rounded-md border border-gray-700 bg-dark-bg/50 p-3 space-y-2">
                                    <label className="block text-xs font-medium text-dark-textLight">
                                      Kriterien für gültige Werte:
                                    </label>
                                    {(() => {
                                      const list = Array.isArray(aggregations.criteriaList?.[column])
                                        ? aggregations.criteriaList[column]
                                        : (criteria ? [criteria] : [])
                                      return (
                                        <div className="space-y-2">
                                          {list.map((crit, idx) => (
                                            <div key={idx} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                              <select value={crit.operator || 'greaterThan'} onChange={(e) => updateTransformations((prev) => {
                                                const map = { ...(prev.aggregations?.criteriaList || {}) }
                                                const arr = Array.isArray(map[column]) ? [...map[column]] : (criteria ? [criteria] : [])
                                                arr[idx] = { ...(arr[idx] || {}), operator: e.target.value }
                                                map[column] = arr
                                                return { ...prev, aggregations: { ...prev.aggregations, criteriaList: map, criteria: { ...(prev.aggregations?.criteria || {}), [column]: undefined } } }
                                              })} className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none">
                                                <option value="greaterThan">größer als</option>
                                                <option value="greaterThanOrEqual">größer oder gleich</option>
                                                <option value="lessThan">kleiner als</option>
                                                <option value="lessThanOrEqual">kleiner oder gleich</option>
                                                <option value="equals">ist gleich</option>
                                                <option value="notEquals">ist ungleich</option>
                                                <option value="between">zwischen</option>
                                                <option value="isNumber">nur Zahlen</option>
                                                <option value="isText">nur Text</option>
                                                <option value="isEmpty">ist leer</option>
                                                <option value="isNotEmpty">ist nicht leer</option>
                                                <option value="equalsText">Text ist gleich</option>
                                                <option value="notEqualsText">Text ist ungleich</option>
                                                <option value="containsText">Text enthält</option>
                                                <option value="notContainsText">Text enthält nicht</option>
                                                <option value="matchesRegex">passt auf Regex</option>
                                                <option value="notMatchesRegex">passt nicht auf Regex</option>
                                              </select>
                                              {crit.operator === 'between' ? (
                                                <>
                                                  <input type="number" step="any" value={crit.minValue || ''} onChange={(e) => updateTransformations((prev) => {
                                                    const map = { ...(prev.aggregations?.criteriaList || {}) }
                                                    const arr = Array.isArray(map[column]) ? [...map[column]] : []
                                                    arr[idx] = { ...(arr[idx] || {}), minValue: e.target.value }
                                                    map[column] = arr
                                                    return { ...prev, aggregations: { ...prev.aggregations, criteriaList: map } }
                                                  })} placeholder="Min" className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                                  <span className="text-xs text-dark-textGray text-center">und</span>
                                                  <input type="number" step="any" value={crit.maxValue || ''} onChange={(e) => updateTransformations((prev) => {
                                                    const map = { ...(prev.aggregations?.criteriaList || {}) }
                                                    const arr = Array.isArray(map[column]) ? [...map[column]] : []
                                                    arr[idx] = { ...(arr[idx] || {}), maxValue: e.target.value }
                                                    map[column] = arr
                                                    return { ...prev, aggregations: { ...prev.aggregations, criteriaList: map } }
                                                  })} placeholder="Max" className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                                </>
                                              ) : (
                                                <input type={["equalsText","notEqualsText","containsText","notContainsText","matchesRegex","notMatchesRegex"].includes(crit.operator) ? "text" : "number"} step={["equalsText","notEqualsText","containsText","notContainsText","matchesRegex","notMatchesRegex"].includes(crit.operator) ? undefined : "any"} value={crit.value || ''} onChange={(e) => updateTransformations((prev) => {
                                                  const map = { ...(prev.aggregations?.criteriaList || {}) }
                                                  const arr = Array.isArray(map[column]) ? [...map[column]] : []
                                                  arr[idx] = { ...(arr[idx] || {}), value: e.target.value }
                                                  map[column] = arr
                                                  return { ...prev, aggregations: { ...prev.aggregations, criteriaList: map } }
                                                })} placeholder={["equalsText","notEqualsText","containsText","notContainsText"].includes(crit.operator) ? 'Text' : (["matchesRegex","notMatchesRegex"].includes(crit.operator) ? 'Regex Muster' : 'Wert')} className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none col-span-2" />
                                              )}
                                              {['matchesRegex','notMatchesRegex'].includes(crit.operator) && (
                                                <input type="text" value={crit.flags || ''} onChange={(e) => updateTransformations((prev) => {
                                                  const map = { ...(prev.aggregations?.criteriaList || {}) }
                                                  const arr = Array.isArray(map[column]) ? [...map[column]] : []
                                                  arr[idx] = { ...(arr[idx] || {}), flags: e.target.value }
                                                  map[column] = arr
                                                  return { ...prev, aggregations: { ...prev.aggregations, criteriaList: map } }
                                                })} placeholder="Regex Flags (z. B. i, g)" className="rounded-md border border-gray-700 bg-dark-secondary px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none" />
                                              )}
                                              <button type="button" onClick={() => updateTransformations((prev) => {
                                                const map = { ...(prev.aggregations?.criteriaList || {}) }
                                                const arr = Array.isArray(map[column]) ? [...map[column]] : []
                                                const next = arr.filter((_, i) => i !== idx)
                                                map[column] = next
                                                return { ...prev, aggregations: { ...prev.aggregations, criteriaList: map } }
                                              })} className="text-xs text-red-300 hover:text-red-200">Entfernen</button>
                                            </div>
                                          ))}
                                          <button type="button" onClick={() => updateTransformations((prev) => {
                                            const map = { ...(prev.aggregations?.criteriaList || {}) }
                                            const arr = Array.isArray(map[column]) ? [...map[column]] : (criteria ? [criteria] : [])
                                            arr.push({ operator: 'greaterThan', value: '' })
                                            map[column] = arr
                                            return { ...prev, aggregations: { ...prev.aggregations, criteriaList: map, criteria: { ...(prev.aggregations?.criteria || {}), [column]: undefined } } }
                                          })} className="mt-2 rounded-md border border-gray-700 px-2 py-1 text-xs text-dark-textLight hover:bg-dark-bg/60">Weiteres Kriterium hinzufügen</button>
                                        </div>
                                      )
                                    })()}
                                    <p className="text-[10px] text-dark-textGray">
                                      Es werden nur Werte gezählt, die diesen Kriterien entsprechen.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-dark-textGray">
                      <span>
                        Ausgangszeilen: <span className="text-dark-textLight">{transformationMetaInfo.originalCount}</span>
                      </span>
                      <span>
                        Entfernt durch Filter:{' '}
                        <span className="text-dark-textLight">{transformationMetaInfo.filteredOut}</span>
                      </span>
                      <span>
                        Gruppen nach Aggregation:{' '}
                        <span className="text-dark-textLight">{transformationMetaInfo.aggregatedTo}</span>
                        {transformationMetaInfo.aggregatedFrom > 0 &&
                          transformationMetaInfo.aggregatedFrom !== transformationMetaInfo.aggregatedTo && (
                            <span className="ml-1 text-dark-textGray">
                              (aus {transformationMetaInfo.aggregatedFrom})
                            </span>
                          )}
                      </span>
                    </div>
                    {transformationMetaInfo.groupingColumns.length > 0 && (
                      <div className="text-[11px] text-dark-textGray">
                        Gruppiert nach:{' '}
                        <span className="text-dark-textLight">
                          {transformationMetaInfo.groupingColumns.join(' → ')}
                        </span>
                      </div>
                    )}
                    {transformationWarnings.length > 0 && (
                      <div className="space-y-1 rounded-md border border-yellow-600/40 bg-yellow-900/30 px-3 py-2 text-xs text-yellow-100">
                        <div className="font-semibold text-yellow-200">Hinweise zur Transformation</div>
                        {transformationWarnings.map((message, index) => (
                          <div key={index}>• {message}</div>
                        ))}
                      </div>
                    )}
                    {transformedPreviewEntries.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-dark-textLight">Transformierte Daten</h4>
                            <p className="text-xs text-dark-textGray">
                              {transformedFilteredRowCount} von {transformedRowCount} Ergebnissen sichtbar
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-dark-textGray">
                            <label className="flex items-center gap-1">
                              <span className="hidden sm:inline">Zeilen:</span>
                              <select
                                value={String(previewLimit)}
                                onChange={(e) =>
                                  setPreviewLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))
                                }
                                className="rounded-md border border-gray-700 bg-dark-bg px-1.5 py-1 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                              >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value="all">alle</option>
                              </select>
                            </label>
                            <button
                              type="button"
                              onClick={handleExportTransformed}
                              className="inline-flex items-center gap-1 rounded-md border border-dark-accent1/50 px-2 py-1 text-xs text-dark-accent1 transition-colors hover:bg-dark-accent1/10"
                              title="Transformierte Daten als CSV speichern"
                            >
                              <span>CSV exportieren</span>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {hiddenTransformedRowIndices.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-dark-textGray">
                              <span className="font-semibold text-dark-textLight">Versteckte Zeilen:</span>
                              {hiddenTransformedRowIndices.map((rowIndex) => (
                                <button
                                  key={`show-transformed-row-${rowIndex}`}
                                  type="button"
                                  onClick={() => handleToggleRowHidden('transformed', rowIndex)}
                                  className="rounded border border-gray-600 px-2 py-0.5 text-dark-textLight/80 transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                                >
                                  Zeile {rowIndex + 1} anzeigen
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="max-h-64 overflow-auto rounded-lg border border-gray-700">
                            <table className="min-w-full divide-y divide-gray-700 text-sm">
                              <thead className="text-xs uppercase tracking-wide text-dark-textGray">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
                                  <SortableContext items={visibleColumns.map((column) => column.key)} strategy={horizontalListSortingStrategy}>
                                    <tr ref={transformedHeaderRef}>
                                      <th
                                        className="sticky left-0 z-50 border-r border-gray-700 bg-dark-bg/90 px-3 py-2 text-left"
                                        style={{ minWidth: `${ACTION_COLUMN_WIDTH}px`, width: `${ACTION_COLUMN_WIDTH}px`, top: 0 }}
                                      >
                                        <span className="text-[10px] uppercase tracking-wide text-dark-textGray">Zeile</span>
                                      </th>
                                      {visibleColumns.map((column) => {
                                        const sortIndex = activeSorts.findIndex((entry) => entry.column === column.key)
                                        const sortEntry = sortIndex >= 0 ? activeSorts[sortIndex] : null
                                        return (
                                          <SortableHeaderCell
                                            key={`transformed-${column.key}`}
                                            column={column}
                                            sortEntry={sortEntry}
                                            sortIndex={sortIndex}
                                            onSortToggle={handleSortToggle}
                                            onToggleVisibility={handleHideColumn}
                                            onTogglePinned={handleToggleColumnPinned}
                                            onResizeStart={handleColumnResizeStart}
                                            registerRef={registerColumnRef}
                                            isPinnedLeft={column.display?.pinned === 'left'}
                                            isPinnedRight={column.display?.pinned === 'right'}
                                            leftOffset={pinnedLeftOffsets.get(column.key)}
                                            rightOffset={pinnedRightOffsets.get(column.key)}
                                            width={getColumnWidth(column.key)}
                                          />
                                        )
                                      })}
                                      {transformedExtraColumns.map((columnKey) => {
                                        const sortIndex = activeSorts.findIndex((entry) => entry.column === columnKey)
                                        const sortEntry = sortIndex >= 0 ? activeSorts[sortIndex] : null
                                        const isSorted = Boolean(sortEntry)
                                        const sortSymbol = sortEntry ? (sortEntry.direction === 'desc' ? '▼' : '▲') : ''
                                        const width = getColumnWidth(columnKey)
                                        return (
                                          <th
                                            key={`extra-header-${columnKey}`}
                                            className="px-3 py-2 text-left"
                                            style={{ minWidth: `${Math.max(width, MIN_COLUMN_WIDTH)}px`, width: `${Math.max(width, MIN_COLUMN_WIDTH)}px` }}
                                          >
                                            <button
                                              type="button"
                                              onClick={(event) => handleSortToggle(columnKey, event)}
                                              className={`flex items-center gap-1 text-dark-textGray transition-colors hover:text-dark-textLight ${
                                                isSorted ? 'text-dark-textLight' : ''
                                              }`}
                                            >
                                              <span>{columnKey}</span>
                                              {isSorted && (
                                                <span className="flex items-center gap-1 text-[10px]">
                                                  <span>{sortSymbol}</span>
                                                  <span className="rounded bg-dark-textGray/30 px-1 text-[9px] leading-none text-dark-textLight">
                                                    {sortIndex + 1}
                                                  </span>
                                                </span>
                                              )}
                                            </button>
                                          </th>
                                        )
                                      })}
                                    </tr>
                                  </SortableContext>
                                </DndContext>
                              </thead>
                              <tbody className="divide-y divide-gray-800 bg-dark-bg/40 text-dark-textLight">
                                {transformedPreviewEntries.map((entry) => {
                                  const rowState = rowDisplayTransformed[entry.index] || {}
                                  const rowTop = rowState.pinned
                                    ? pinnedTransformedRowOffsets.get(entry.index) ?? transformedHeaderHeight
                                    : undefined
                                  const isChartHighlighted =
                                    chartPreviewHighlight?.source === 'transformed' &&
                                    chartPreviewHighlight.rowIndex === entry.index
                                  const rowClassName = isChartHighlighted
                                    ? 'ring-1 ring-dark-accent1/60 bg-dark-accent1/10'
                                    : undefined
                                  return (
                                    <tr
                                      key={entry.index}
                                      ref={(node) => registerRowRef('transformed', entry.index, node)}
                                      className={rowClassName}
                                    >
                                      <td
                                        className="sticky left-0 z-40 border-r border-gray-800 bg-dark-bg/90 px-2 py-2 text-[11px] text-dark-textGray"
                                        style={{
                                          minWidth: `${ACTION_COLUMN_WIDTH}px`,
                                          width: `${ACTION_COLUMN_WIDTH}px`,
                                          top: rowTop
                                        }}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-mono text-[10px] text-dark-textGray/80">#{entry.index + 1}</span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => handleToggleRowPinned('transformed', entry.index)}
                                              className={`rounded px-1 text-[10px] transition-colors ${
                                                rowState.pinned
                                                  ? 'text-dark-accent1'
                                                  : 'text-dark-textGray hover:text-dark-textLight'
                                              }`}
                                              title={rowState.pinned ? 'Fixierung lösen' : 'Zeile fixieren'}
                                            >
                                              📌
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleToggleRowHidden('transformed', entry.index)}
                                              className="rounded px-1 text-[10px] text-dark-textGray transition-colors hover:text-dark-textLight"
                                              title="Zeile ausblenden"
                                            >
                                              🚫
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                      {visibleColumns.map((column) => {
                                        const isPinnedLeft = column.display?.pinned === 'left'
                                        const isPinnedRight = column.display?.pinned === 'right'
                                        const cellLeft = pinnedLeftOffsets.get(column.key)
                                        const cellRight = pinnedRightOffsets.get(column.key)
                                        const cellWidth = getColumnWidth(column.key)
                                        const cellStyle = {
                                          minWidth: `${Math.max(cellWidth, MIN_COLUMN_WIDTH)}px`,
                                          width: column.display?.width ? `${Math.max(cellWidth, MIN_COLUMN_WIDTH)}px` : undefined
                                        }
                                        if (isPinnedLeft || isPinnedRight || rowState.pinned) {
                                          cellStyle.position = 'sticky'
                                          if (isPinnedLeft) {
                                            cellStyle.left = cellLeft
                                          }
                                          if (isPinnedRight) {
                                            cellStyle.right = cellRight
                                          }
                                          if (rowState.pinned) {
                                            cellStyle.top = rowTop ?? transformedHeaderHeight
                                          }
                                          cellStyle.zIndex = 20 + (isPinnedLeft || isPinnedRight ? 5 : 0) + (rowState.pinned ? 5 : 0)
                                          cellStyle.backgroundColor = 'rgba(17, 24, 39, 0.9)'
                                        }
                                        const matches = entry.matchInfo?.[column.key]
                                        const highlightedValue = renderHighlightedValue(entry.row[column.key], matches)
                                        const hasContent = Array.isArray(highlightedValue)
                                          ? highlightedValue.length > 0
                                          : Boolean(highlightedValue)
                                        const isActiveMatch =
                                          activeSearchMatch?.scope === 'transformed' &&
                                          activeSearchMatch.rowIndex === entry.index &&
                                          activeSearchMatch.columnKey === column.key
                                        return (
                                          <td
                                            key={`transformed-${column.key}`}
                                            className={`px-3 py-2 text-xs text-dark-textLight/90 ${
                                              isActiveMatch ? 'bg-dark-accent1/10 text-dark-textLight ring-2 ring-dark-accent1/60' : ''
                                            }`}
                                            style={cellStyle}
                                          >
                                            {hasContent ? highlightedValue : <span className="text-dark-textGray/60">–</span>}
                                          </td>
                                        )
                                      })}
                                      {transformedExtraColumns.map((columnKey) => {
                                        const width = getColumnWidth(columnKey)
                                        const matches = entry.matchInfo?.[columnKey]
                                        const highlightedValue = renderHighlightedValue(entry.row[columnKey], matches)
                                        const hasContent = Array.isArray(highlightedValue)
                                          ? highlightedValue.length > 0
                                          : Boolean(highlightedValue)
                                        return (
                                          <td
                                            key={`extra-${entry.index}-${columnKey}`}
                                            className="px-3 py-2 text-xs text-dark-textLight/90"
                                            style={{ minWidth: `${Math.max(width, MIN_COLUMN_WIDTH)}px`, width: `${Math.max(width, MIN_COLUMN_WIDTH)}px` }}
                                          >
                                            {hasContent ? highlightedValue : <span className="text-dark-textGray/60">–</span>}
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-dark-textGray">
                        Es stehen keine Vorschau-Daten zur Verfügung. Prüfen Sie Filter- und Gruppierungs-Einstellungen.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {chartSuggestions.length > 0 && (
                <section className="space-y-4 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-dark-textLight">Diagramm-Vorschläge</h3>
                    <p className="text-xs text-dark-textGray">
                      Wähle passende Spalten aus, um Daten direkt an den Diagramm-Editor zu übergeben. Die Originaldaten im CSV-Tab bleiben erhalten.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {chartSuggestions.map((suggestion) => {
                      const selection = suggestionSelections[suggestion.id] || {}
                      const suggestionReady = isSuggestionComplete(suggestion, selection)
                      const preview = suggestionPreviewData.get(suggestion.id)
                      const previewPointCount = preview
                        ? preview.pointMeta.reduce((total, dataset) => total + Object.keys(dataset || {}).length, 0)
                        : 0
                      return (
                        <div key={suggestion.id} className="rounded-lg border border-gray-700 bg-dark-bg/60 p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-dark-textLight">{suggestion.title}</h4>
                              <p className="text-xs text-dark-textGray">{suggestion.description}</p>
                              <p className="mt-1 text-[11px] text-dark-textGray/80">
                                Empfohlene Diagrammtypen: <span className="text-dark-textLight/90">{suggestion.chartHint}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSuggestionApply(suggestion)}
                              disabled={!suggestionReady}
                              className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                suggestionReady
                                  ? 'border-dark-accent1/50 text-dark-accent1 hover:bg-dark-accent1/10'
                                  : 'border-gray-800 text-dark-textGray cursor-not-allowed'
                              }`}
                            >
                              <span>Daten anwenden</span>
                            </button>
                          </div>
                          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                            <div className="grid gap-3 md:grid-cols-2">
                              {suggestion.fields.map((field) => {
                                const fieldOptions = getFieldOptions(field)
                                const fieldValue = selection[field.key]
                                return (
                                  <div key={field.key} className="space-y-1">
                                    <label className="block text-[11px] uppercase tracking-wide text-dark-textGray">
                                      {field.label}
                                      {field.optional && <span className="text-dark-textGray/60"> (optional)</span>}
                                    </label>
                                    {field.multiple ? (
                                      <select
                                        multiple
                                        value={Array.isArray(fieldValue) ? fieldValue : []}
                                        onChange={(event) =>
                                          updateSuggestionSelection(
                                            suggestion.id,
                                            field.key,
                                            Array.from(event.target.selectedOptions, (option) => option.value)
                                          )
                                        }
                                        className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                      >
                                        {fieldOptions.map((option) => (
                                          <option key={option.key} value={option.key}>
                                            {option.key}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <select
                                        value={fieldValue || ''}
                                        onChange={(event) => updateSuggestionSelection(suggestion.id, field.key, event.target.value)}
                                        className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-xs text-dark-textLight focus:border-dark-accent1 focus:outline-none"
                                      >
                                        <option value="">{field.optional ? 'Keine Auswahl' : 'Spalte wählen …'}</option>
                                        {fieldOptions.map((option) => (
                                          <option key={option.key} value={option.key}>
                                            {option.key}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            <div className="flex flex-col">
                              {preview ? (
                                <>
                                  <ChartPreview
                                    chartType={preview.chartType}
                                    config={preview.config}
                                    compact
                                    subtitle={suggestion.chartHint}
                                    onDataPointClick={(detail) => handleSuggestionPreviewPointClick(suggestion.id, preview, detail)}
                                  />
                                  <p className="mt-2 text-[10px] text-dark-textGray">
                                    Vorschau mit {previewPointCount} Datenpunkten (max. {SUGGESTION_PREVIEW_MAX_POINTS} berücksichtigt).
                                  </p>
                                </>
                              ) : (
                                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-700/60 bg-dark-bg/30 p-4 text-center text-[11px] text-dark-textGray">
                                  Wähle gültige Spalten, um eine Datenvorschau zu erhalten. Filter, Sortierungen und Transformationen werden berücksichtigt.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {validationErrors.length > 0 && (
                <div className="space-y-1 rounded-lg border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-100">
                  {validationErrors.map((message, index) => (
                    <div key={index} className="whitespace-pre-line">• {message}</div>
                  ))}
                </div>
              )}

              {warnings.length > 0 && (
                <div className="space-y-1 rounded-lg border border-yellow-600/40 bg-yellow-900/30 px-4 py-3 text-xs text-yellow-100">
                  <div className="font-semibold text-yellow-200">Hinweise</div>
                  {warnings.map((message, index) => (
                    <div key={index}>• {message}</div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-700 bg-dark-bg/60 px-6 py-4">
          <div className="text-xs text-dark-textGray">
            Ungültige oder leere Werte werden automatisch übersprungen. Filter, Gruppierung und Transformationen beeinflussen die Vorschau.
          </div>
          <div className="space-x-2">
            <button
              type="button"
              onClick={handleResetWorkbench}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-dark-textGray transition-colors hover:text-dark-textLight"
            >
              Arbeitsbereich leeren
            </button>
            <button
              type="button"
              onClick={() => handleApply()}
              disabled={totalRows === 0 || isLoading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                totalRows === 0 || isLoading
                  ? 'cursor-not-allowed bg-gray-700/70'
                  : 'bg-dark-accent1 hover:bg-dark-accent1/90'
              }`}
            >
              Daten an Diagramm senden
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

CsvWorkbench.propTypes = {
  onApplyToChart: PropTypes.func,
  onImportStateChange: PropTypes.func,
  onResetWorkbench: PropTypes.func,
  allowMultipleValueColumns: PropTypes.bool,
  requireDatasets: PropTypes.bool,
  initialData: PropTypes.object,
  chartType: PropTypes.string,
  isScatterBubble: PropTypes.bool,
  isCoordinate: PropTypes.bool
}

