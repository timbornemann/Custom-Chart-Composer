import { useCallback, useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const PLACEHOLDER_VALUES = new Set(['', '-', 'n/a', 'na', 'null', 'undefined', 'nan'])

const defaultMapping = {
  label: '',
  valueColumns: [],
  datasetLabel: ''
}

const createDefaultTransformations = () => ({
  filters: [],
  grouping: {
    enabled: false,
    column: '',
    customGroups: [],
    fallbackLabel: 'Andere'
  },
  aggregations: {
    defaultOperation: 'sum',
    perColumn: {}
  }
})

const sanitizeKey = (key) => {
  if (key === null || key === undefined) return ''
  const trimmed = String(key).trim()
  return trimmed
}

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'number') {
    return Number.isNaN(value)
  }
  const text = String(value).trim()
  if (!text) return true
  return PLACEHOLDER_VALUES.has(text.toLowerCase())
}

const normalizeLabel = (value) => {
  if (isEmptyValue(value)) return ''
  return String(value).trim()
}

const toNumber = (value) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value
    }
    return null
  }
  const text = String(value).trim()
  if (!text) return null
  const lower = text.toLowerCase()
  if (PLACEHOLDER_VALUES.has(lower)) return null
  const normalized = text.replace(/\s+/g, '').replace(',', '.')
  const parsed = Number(normalized)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  return null
}

const analyzeColumns = (rows) => {
  const columnOrder = []
  const seen = new Set()

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((rawKey) => {
      const key = sanitizeKey(rawKey)
      if (!key || seen.has(key)) return
      seen.add(key)
      columnOrder.push(key)
    })
  })

  return columnOrder.map((key) => {
    let emptyCount = 0
    let numericCount = 0
    let textCount = 0

    rows.forEach((row) => {
      const value = row?.[key]
      if (isEmptyValue(value)) {
        emptyCount += 1
        return
      }
      const numeric = toNumber(value)
      if (numeric === null) {
        textCount += 1
      } else {
        numericCount += 1
      }
    })

    const filledCount = rows.length - emptyCount
    let type = 'string'
    if (numericCount > 0 && textCount === 0) {
      type = 'number'
    } else if (numericCount === 0) {
      type = 'string'
    } else {
      type = numericCount >= textCount ? 'number' : 'string'
    }

    return {
      key,
      type,
      emptyCount,
      filledCount,
      numericCount,
      textCount,
      samples: rows.slice(0, 5).map((row) => row?.[key])
    }
  })
}

const summarizeColumnWarnings = (columns) => {
  const warnings = []

  columns.forEach((column) => {
    if (column.filledCount === 0) {
      warnings.push(`Spalte "${column.key}" enthält keine Werte und wird ignoriert.`)
      return
    }
    if (column.numericCount > 0 && column.textCount > 0) {
      warnings.push(
        `Spalte "${column.key}" enthält ${column.textCount} Einträge, die keine gültigen Zahlen sind. Sie werden beim Import übersprungen.`
      )
    }
  })

  return warnings
}

const parseCsvFile = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          reject(new Error(results.errors[0]?.message || 'CSV-Datei konnte nicht gelesen werden.'))
          return
        }
        resolve(results.data || [])
      },
      error: (error) => {
        reject(error)
      }
    })
  })

const parseSpreadsheetFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheet = workbook.SheetNames?.[0]
  if (!firstSheet) {
    return []
  }
  const worksheet = workbook.Sheets[firstSheet]
  return XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false })
}

const cleanRows = (rows) =>
  rows
    .map((row) => row || {})
    .map((row) => {
      const normalized = {}
      Object.entries(row).forEach(([key, value]) => {
        const cleanKey = sanitizeKey(key)
        if (!cleanKey) return
        normalized[cleanKey] = value
      })
      return normalized
    })
    .filter((row) => Object.values(row).some((value) => !isEmptyValue(value)))

const evaluateCriteria = (value, criteria) => {
  if (!criteria) return false
  const operator = criteria.operator || 'greaterThan'

  // Type/emptiness checks
  if (operator === 'isEmpty') {
    return isEmptyValue(value)
  }
  if (operator === 'isNotEmpty') {
    return !isEmptyValue(value)
  }
  if (operator === 'isNumber') {
    return toNumber(value) !== null
  }
  if (operator === 'isText') {
    return !isEmptyValue(value) && toNumber(value) === null
  }

  // Text-based operators
  if (
    operator === 'equalsText' ||
    operator === 'notEqualsText' ||
    operator === 'containsText' ||
    operator === 'notContainsText' ||
    operator === 'matchesRegex' ||
    operator === 'notMatchesRegex'
  ) {
    const text = normalizeLabel(value)
    if (operator === 'equalsText') {
      return criteria.value ? text.toLowerCase() === String(criteria.value).trim().toLowerCase() : false
    }
    if (operator === 'notEqualsText') {
      return criteria.value ? text.toLowerCase() !== String(criteria.value).trim().toLowerCase() : false
    }
    if (operator === 'containsText') {
      return criteria.value ? text.toLowerCase().includes(String(criteria.value).trim().toLowerCase()) : false
    }
    if (operator === 'notContainsText') {
      return criteria.value ? !text.toLowerCase().includes(String(criteria.value).trim().toLowerCase()) : false
    }
    if (operator === 'matchesRegex' || operator === 'notMatchesRegex') {
      try {
        if (!criteria.value) return false
        const regex = new RegExp(String(criteria.value), String(criteria.flags || ''))
        const match = regex.test(text)
        return operator === 'matchesRegex' ? match : !match
      } catch (_e) {
        return false
      }
    }
  }

  // Numeric operators (fallback)
  const numValue = toNumber(value)
  if (numValue === null) return false

  const criteriaValue = Number.parseFloat(criteria.value)
  const minValue = Number.parseFloat(criteria.minValue)
  const maxValue = Number.parseFloat(criteria.maxValue)

  switch (operator) {
    case 'greaterThan':
      return Number.isFinite(criteriaValue) && numValue > criteriaValue
    case 'greaterThanOrEqual':
      return Number.isFinite(criteriaValue) && numValue >= criteriaValue
    case 'lessThan':
      return Number.isFinite(criteriaValue) && numValue < criteriaValue
    case 'lessThanOrEqual':
      return Number.isFinite(criteriaValue) && numValue <= criteriaValue
    case 'equals':
      return Number.isFinite(criteriaValue) && numValue === criteriaValue
    case 'notEquals':
      return Number.isFinite(criteriaValue) && numValue !== criteriaValue
    case 'between':
      return Number.isFinite(minValue) && Number.isFinite(maxValue) && numValue >= minValue && numValue <= maxValue
    default:
      return false
  }
}

const evaluateCriteriaList = (value, criteriaOrList) => {
  if (!criteriaOrList) return false
  const list = Array.isArray(criteriaOrList) ? criteriaOrList : [criteriaOrList]
  if (list.length === 0) return false
  return list.every((crit) => evaluateCriteria(value, crit))
}

const computeAggregateValue = (metrics, operation, criteria = null) => {
  if (!metrics) return null
  const op = operation || 'sum'
  
  switch (op) {
    case 'average':
      return metrics.count > 0 ? metrics.sum / metrics.count : null
    case 'min':
      return metrics.min === null ? null : metrics.min
    case 'max':
      return metrics.max === null ? null : metrics.max
    case 'count':
      return metrics.count
    case 'countRows':
      return metrics.rowCount || 0
    case 'countValid': {
      if (!criteria || (Array.isArray(criteria) && criteria.length === 0)) return metrics.count
      // Verwende allValues statt values, um auch nicht-numerische Werte zu prüfen
      const valuesToCheck = metrics.allValues || metrics.values || []
      return valuesToCheck.filter(val => evaluateCriteriaList(val, criteria)).length
    }
    case 'sum':
      return metrics.count > 0 ? metrics.sum : null
    case 'median': {
      if (!metrics.values || metrics.values.length === 0) return null
      const sorted = [...metrics.values].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid]
    }
    case 'stdDev': {
      if (!metrics.values || metrics.values.length < 2) return null
      const mean = metrics.sum / metrics.count
      const sumSquaredDiffs = metrics.values.reduce((sum, val) => {
        const diff = val - mean
        return sum + diff * diff
      }, 0)
      return Math.sqrt(sumSquaredDiffs / metrics.count)
    }
    case 'variance': {
      if (!metrics.values || metrics.values.length < 2) return null
      const mean = metrics.sum / metrics.count
      const sumSquaredDiffs = metrics.values.reduce((sum, val) => {
        const diff = val - mean
        return sum + diff * diff
      }, 0)
      return sumSquaredDiffs / metrics.count
    }
    case 'product': {
      if (!metrics.values || metrics.values.length === 0) return null
      return metrics.values.reduce((product, val) => product * val, 1)
    }
    case 'first':
      return metrics.first === null ? null : metrics.first
    case 'last':
      return metrics.last === null ? null : metrics.last
    default:
      return metrics.count > 0 ? metrics.sum : null
  }
}

const prepareGroupingHelpers = (grouping) => {
  const fallbackLabel = grouping?.fallbackLabel?.trim() || 'Andere'
  const rawGroups = Array.isArray(grouping?.customGroups) ? grouping.customGroups : []
  const normalizedGroups = rawGroups
    .map((group) => ({
      id: group.id,
      label: group.label?.trim() || '',
      values: Array.isArray(group.values)
        ? group.values.map((value) => normalizeLabel(value)).filter(Boolean)
        : []
    }))
    .filter((group) => group.label && group.values.length > 0)
    .map((group) => ({
      ...group,
      valueSet: new Set(group.values.map((value) => value.toLowerCase()))
    }))

  const findGroup = (value) => {
    const normalized = normalizeLabel(value)
    if (!normalized) {
      return { label: fallbackLabel, matched: false, isEmpty: true }
    }
    if (normalizedGroups.length === 0) {
      return { label: normalized, matched: true, isEmpty: false }
    }
    const lower = normalized.toLowerCase()
    for (const group of normalizedGroups) {
      if (group.valueSet.has(lower)) {
        return { label: group.label, matched: true, isEmpty: false }
      }
    }
    return { label: fallbackLabel, matched: false, isEmpty: false }
  }

  return {
    fallbackLabel,
    findGroup,
    hasCustomGroups: normalizedGroups.length > 0
  }
}

const aggregateRows = (rows, mapping, grouping, aggregations) => {
  const labelKey = mapping?.label
  const valueColumns = mapping?.valueColumns || []
  const datasetKey = mapping?.datasetLabel
  const groupColumn = grouping?.column || labelKey
  const helpers = prepareGroupingHelpers(grouping)
  let unmatchedCount = 0
  let emptyCount = 0

  const resolveOperation = (column) => {
    const perColumn = aggregations?.perColumn || {}
    const defaultOperation = aggregations?.defaultOperation || 'sum'
    return perColumn[column] || defaultOperation
  }

  const resolveCriteria = (column) => {
    const operation = resolveOperation(column)
    if (operation !== 'countValid') return null
    const perColumnList = aggregations?.criteriaList?.[column]
    const perColumnSingle = aggregations?.criteria?.[column]
    const defaultList = aggregations?.defaultCriteriaList
    const defaultSingle = aggregations?.defaultCriteria
    // Prefer per-column list, then single; fallback to default list or single
    const selected = perColumnList || perColumnSingle || defaultList || defaultSingle || null
    if (!selected) return null
    return Array.isArray(selected) ? selected : [selected]
  }

  if (!groupColumn) {
    return {
      rows: rows.map((row) => ({ ...row })),
      info: {
        aggregatedFrom: rows.length,
        aggregatedTo: rows.length,
        unmatchedCount,
        emptyCount
      }
    }
  }

  if (datasetKey) {
    const valueKey = valueColumns[0]
    const groups = new Map()

    rows.forEach((row) => {
      const groupInfo = helpers.findGroup(row[groupColumn])
      if (!groupInfo.matched) {
        if (groupInfo.isEmpty) {
          emptyCount += 1
        } else {
          unmatchedCount += 1
        }
      }

      const groupLabel = groupInfo.label
      const datasetValue = normalizeLabel(row[datasetKey])
      if (!groups.has(groupLabel)) {
        groups.set(groupLabel, new Map())
      }
      const datasetMap = groups.get(groupLabel)
      const datasetLabelValue = datasetValue || ''
      if (!datasetMap.has(datasetLabelValue)) {
        datasetMap.set(datasetLabelValue, {
          metrics: {
            sum: 0,
            count: 0,
            rowCount: 0,
            min: null,
            max: null,
            first: null,
            last: null,
            values: [],
            allValues: []
          }
        })
      }

      const entry = datasetMap.get(datasetLabelValue)
      // Zähle jeden Datenpunkt (auch ohne gültigen Wert)
      entry.metrics.rowCount += 1
      
      // Speichere ALLE Werte (auch nicht-numerische) für countValid
      const rawValue = row[valueKey]
      entry.metrics.allValues = entry.metrics.allValues || []
      entry.metrics.allValues.push(rawValue)
      
      const numeric = toNumber(row[valueKey])
      if (numeric !== null) {
        entry.metrics.sum += numeric
        entry.metrics.count += 1
        entry.metrics.min = entry.metrics.min === null ? numeric : Math.min(entry.metrics.min, numeric)
        entry.metrics.max = entry.metrics.max === null ? numeric : Math.max(entry.metrics.max, numeric)
        if (entry.metrics.first === null) {
          entry.metrics.first = numeric
        }
        entry.metrics.last = numeric
        entry.metrics.values.push(numeric)
      }
    })

    const aggregatedRows = []
    groups.forEach((datasetMap, groupLabel) => {
      datasetMap.forEach((entry, datasetLabelValue) => {
        const operation = resolveOperation(valueColumns[0])
        const criteria = resolveCriteria(valueColumns[0])
        const aggregatedValue = computeAggregateValue(entry.metrics, operation, criteria)
        aggregatedRows.push({
          [labelKey]: groupLabel,
          [datasetKey]: datasetLabelValue,
          [valueColumns[0]]: aggregatedValue
        })
      })
    })

    return {
      rows: aggregatedRows,
      info: {
        aggregatedFrom: rows.length,
        aggregatedTo: aggregatedRows.length,
        unmatchedCount,
        emptyCount
      }
    }
  }

  const groups = new Map()

  rows.forEach((row) => {
    const groupInfo = helpers.findGroup(row[groupColumn])
    if (!groupInfo.matched) {
      if (groupInfo.isEmpty) {
        emptyCount += 1
      } else {
        unmatchedCount += 1
      }
    }
    const groupLabel = groupInfo.label
    if (!groups.has(groupLabel)) {
      const baseRow = {
        [labelKey]: groupLabel
      }
      valueColumns.forEach((column) => {
        baseRow[column] = null
      })
      groups.set(groupLabel, {
        row: baseRow,
        metrics: {}
      })
    }
    const entry = groups.get(groupLabel)
    valueColumns.forEach((column) => {
      // Initialisiere metrics wenn noch nicht vorhanden
      if (!entry.metrics[column]) {
        entry.metrics[column] = {
          sum: 0,
          count: 0,
          rowCount: 0,
          min: null,
          max: null,
          first: null,
          last: null,
          values: [],
          allValues: []
        }
      }
      const metric = entry.metrics[column]
      // Zähle jeden Datenpunkt (auch ohne gültigen Wert)
      metric.rowCount += 1
      
      // Speichere ALLE Werte (auch nicht-numerische) für countValid
      const rawValue = row[column]
      metric.allValues.push(rawValue)
      
      const numeric = toNumber(row[column])
      if (numeric !== null) {
        metric.sum += numeric
        metric.count += 1
        metric.min = metric.min === null ? numeric : Math.min(metric.min, numeric)
        metric.max = metric.max === null ? numeric : Math.max(metric.max, numeric)
        if (metric.first === null) {
          metric.first = numeric
        }
        metric.last = numeric
        metric.values.push(numeric)
      }
    })
  })

  const aggregatedRows = []
  groups.forEach((entry) => {
    const aggregatedRow = { ...entry.row }
    valueColumns.forEach((column) => {
      const operation = resolveOperation(column)
      const criteria = resolveCriteria(column)
      aggregatedRow[column] = computeAggregateValue(entry.metrics[column], operation, criteria)
    })
    aggregatedRows.push(aggregatedRow)
  })

  return {
    rows: aggregatedRows,
    info: {
      aggregatedFrom: rows.length,
      aggregatedTo: aggregatedRows.length,
      unmatchedCount,
      emptyCount
    }
  }
}

const evaluateFilterCondition = (row, filter) => {
  if (!filter || filter.enabled === false) return true
  const { column, operator, value } = filter
  if (!column) return true
  const cellValue = row[column]
  const cellText = normalizeLabel(cellValue)
  const filterText = normalizeLabel(value)
  switch (operator) {
    case 'equals':
      return cellText.toLowerCase() === filterText.toLowerCase()
    case 'notEquals':
      return cellText.toLowerCase() !== filterText.toLowerCase()
    case 'contains':
      return filterText ? cellText.toLowerCase().includes(filterText.toLowerCase()) : true
    case 'greaterThan': {
      const numericValue = toNumber(cellValue)
      const numericFilter = toNumber(value)
      if (numericValue === null || numericFilter === null) return false
      return numericValue > numericFilter
    }
    case 'lessThan': {
      const numericValue = toNumber(cellValue)
      const numericFilter = toNumber(value)
      if (numericValue === null || numericFilter === null) return false
      return numericValue < numericFilter
    }
    default:
      return true
  }
}

const applyFilters = (rows, filters) => {
  const activeFilters = (filters || []).filter((filter) => filter && filter.enabled !== false && filter.column)
  if (activeFilters.length === 0) {
    return { rows: rows.map((row) => ({ ...row })), removed: 0 }
  }
  let removed = 0
  const filteredRows = rows.filter((row) => {
    // Start with the first filter's result
    let result = evaluateFilterCondition(row, activeFilters[0])
    
    // Apply subsequent filters with their logic operators
    for (let i = 1; i < activeFilters.length; i++) {
      const filter = activeFilters[i]
      const filterResult = evaluateFilterCondition(row, filter)
      const logicOperator = filter.logicOperator || 'and'
      
      if (logicOperator === 'or') {
        result = result || filterResult
      } else {
        // 'and' is the default
        result = result && filterResult
      }
    }
    
    if (!result) {
      removed += 1
    }
    return result
  })
  return { rows: filteredRows.map((row) => ({ ...row })), removed }
}

const applyTransformations = (rows, mapping, transformations) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      rows: [],
      warnings: [],
      meta: {
        originalCount: rows.length || 0,
        filteredOut: 0,
        aggregatedFrom: 0,
        aggregatedTo: 0,
        unmatchedCount: 0,
        emptyCount: 0
      }
    }
  }

  const meta = {
    originalCount: rows.length,
    filteredOut: 0,
    aggregatedFrom: rows.length,
    aggregatedTo: rows.length,
    unmatchedCount: 0,
    emptyCount: 0
  }

  let workingRows = rows.map((row) => ({ ...row }))
  const warnings = []

  if (!transformations) {
    return { rows: workingRows, warnings, meta }
  }

  const { filters, grouping, aggregations } = transformations

  const { rows: filteredRows, removed } = applyFilters(workingRows, filters)
  workingRows = filteredRows
  meta.filteredOut = removed
  if (removed > 0) {
    warnings.push(`${removed} Zeilen wurden durch Filter ausgeschlossen.`)
  }
  if (workingRows.length === 0) {
    warnings.push('Alle Zeilen wurden durch die Filter ausgeschlossen.')
    meta.aggregatedFrom = 0
    meta.aggregatedTo = 0
    return { rows: [], warnings, meta }
  }

  if (grouping?.enabled) {
    const { rows: aggregatedRows, info } = aggregateRows(workingRows, mapping, grouping, aggregations)
    workingRows = aggregatedRows
    meta.aggregatedFrom = info.aggregatedFrom
    meta.aggregatedTo = info.aggregatedTo
    meta.unmatchedCount = info.unmatchedCount
    meta.emptyCount = info.emptyCount

    if (info.aggregatedTo < info.aggregatedFrom) {
      warnings.push(
        `Gruppierung reduziert die Daten auf ${info.aggregatedTo} Gruppen (statt ${info.aggregatedFrom} Zeilen).`
      )
    }
    if (info.unmatchedCount > 0) {
      warnings.push(
        `${info.unmatchedCount} Werte konnten keiner definierten Gruppe zugeordnet werden und wurden als „${
          grouping.fallbackLabel || 'Andere'
        }“ gespeichert.`
      )
    }
    if (info.emptyCount > 0) {
      warnings.push(
        `${info.emptyCount} Zeilen ohne Gruppenwert wurden der Gruppe „${grouping.fallbackLabel || 'Andere'}“ zugeordnet.`
      )
    }
    if (aggregatedRows.length === 0) {
      warnings.push('Es konnten keine Gruppen mit numerischen Werten berechnet werden.')
    }
  }

  return { rows: workingRows, warnings, meta }
}

const buildSimpleResult = (sourceRows, labelKey, valueKey) => {
  const labels = []
  const values = []
  let skippedNoLabel = 0
  let skippedInvalidNumber = 0

  sourceRows.forEach((row) => {
    const label = normalizeLabel(row[labelKey])
    const numeric = toNumber(row[valueKey])

    if (!label) {
      skippedNoLabel += 1
      return
    }
    if (numeric === null) {
      skippedInvalidNumber += 1
      return
    }

    labels.push(label)
    values.push(numeric)
  })

  const rowWarnings = []
  if (skippedNoLabel > 0) {
    rowWarnings.push(`${skippedNoLabel} Zeilen ohne Beschriftung wurden übersprungen.`)
  }
  if (skippedInvalidNumber > 0) {
    rowWarnings.push(`${skippedInvalidNumber} Zeilen mit ungültigen Zahlen wurden ignoriert.`)
  }

  return { labels, values, rowWarnings }
}

const buildWideDatasetResult = (sourceRows, labelKey, valueKeys) => {
  const labels = []
  const datasets = valueKeys.map((key) => ({ label: key, data: [] }))
  let skippedNoLabel = 0
  let skippedEmptyRow = 0

  sourceRows.forEach((row) => {
    const label = normalizeLabel(row[labelKey])
    if (!label) {
      skippedNoLabel += 1
      return
    }

    const rowValues = valueKeys.map((key) => toNumber(row[key]))
    const hasValue = rowValues.some((value) => value !== null)
    if (!hasValue) {
      skippedEmptyRow += 1
      return
    }

    labels.push(label)
    rowValues.forEach((value, index) => {
      datasets[index].data.push(value)
    })
  })

  const rowWarnings = []
  if (skippedNoLabel > 0) {
    rowWarnings.push(`${skippedNoLabel} Zeilen ohne Beschriftung wurden übersprungen.`)
  }
  if (skippedEmptyRow > 0) {
    rowWarnings.push(`${skippedEmptyRow} Zeilen ohne numerische Werte wurden ignoriert.`)
  }

  return { labels, datasets, rowWarnings }
}

const buildLongDatasetResult = (sourceRows, labelKey, valueKey, datasetLabelKey) => {
  const labels = []
  const labelIndex = new Map()
  const datasets = new Map()
  let skippedNoLabel = 0
  let skippedNoDataset = 0
  let skippedInvalidNumber = 0

  const ensureLabelIndex = (label) => {
    if (labelIndex.has(label)) return labelIndex.get(label)
    const index = labels.length
    labels.push(label)
    labelIndex.set(label, index)
    datasets.forEach((dataset) => {
      dataset.data.push(null)
    })
    return index
  }

  sourceRows.forEach((row) => {
    const label = normalizeLabel(row[labelKey])
    const datasetKey = normalizeLabel(row[datasetLabelKey])
    const numeric = toNumber(row[valueKey])

    if (!label) {
      skippedNoLabel += 1
      return
    }
    if (!datasetKey) {
      skippedNoDataset += 1
      return
    }
    if (numeric === null) {
      skippedInvalidNumber += 1
      return
    }

    const index = ensureLabelIndex(label)
    if (!datasets.has(datasetKey)) {
      const initialData = Array(labels.length).fill(null)
      datasets.set(datasetKey, { label: datasetKey, data: initialData })
    }
    const dataset = datasets.get(datasetKey)
    dataset.data[index] = numeric
  })

  const rowWarnings = []
  if (skippedNoLabel > 0) {
    rowWarnings.push(`${skippedNoLabel} Zeilen ohne Beschriftung wurden übersprungen.`)
  }
  if (skippedNoDataset > 0) {
    rowWarnings.push(`${skippedNoDataset} Zeilen ohne Datensatz-Kennung wurden ignoriert.`)
  }
  if (skippedInvalidNumber > 0) {
    rowWarnings.push(`${skippedInvalidNumber} Zeilen mit ungültigen Zahlen wurden ignoriert.`)
  }

  const datasetList = Array.from(datasets.values()).map((dataset) => {
    if (dataset.data.length < labels.length) {
      const difference = labels.length - dataset.data.length
      dataset.data.push(...Array(difference).fill(null))
    }
    return dataset
  })

  return { labels, datasets: datasetList, rowWarnings }
}

export default function useDataImport({ allowMultipleValueColumns = true, requireDatasets = false } = {}) {
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [mapping, setMapping] = useState(defaultMapping)
  const [transformations, setTransformations] = useState(() => createDefaultTransformations())
  const [isLoading, setIsLoading] = useState(false)
  const [parseError, setParseError] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const [analysisWarnings, setAnalysisWarnings] = useState([])
  const [resultWarnings, setResultWarnings] = useState([])

  const reset = useCallback(() => {
    setFileName('')
    setRows([])
    setColumns([])
    setMapping(defaultMapping)
    setTransformations(createDefaultTransformations())
    setIsLoading(false)
    setParseError('')
    setValidationErrors([])
    setAnalysisWarnings([])
    setResultWarnings([])
  }, [])

  const parseFile = useCallback(
    async (file) => {
      if (!file) {
        return
      }

      setIsLoading(true)
      setParseError('')
      setValidationErrors([])
      setResultWarnings([])

      try {
        const extension = file.name.split('.').pop()?.toLowerCase()
        let parsedRows = []

        if (['xls', 'xlsx', 'ods'].includes(extension)) {
          parsedRows = await parseSpreadsheetFile(file)
        } else {
          parsedRows = await parseCsvFile(file)
        }

        const cleaned = cleanRows(parsedRows)
        setRows(cleaned)
        const analyzed = analyzeColumns(cleaned)
        setColumns(analyzed)
        setFileName(file.name)
        setAnalysisWarnings(summarizeColumnWarnings(analyzed))
        setTransformations(createDefaultTransformations())

        const defaultLabel = analyzed.find((col) => col.type === 'string')?.key || analyzed[0]?.key || ''
        const numericColumns = analyzed.filter((col) => col.type === 'number').map((col) => col.key)
        const fallbackColumns = analyzed.filter((col) => col.key !== defaultLabel).map((col) => col.key)

        let defaultValues = numericColumns.length > 0 ? numericColumns : fallbackColumns
        if (!allowMultipleValueColumns) {
          defaultValues = defaultValues.slice(0, 1)
        }

        setMapping({
          label: defaultLabel,
          valueColumns: defaultValues,
          datasetLabel: ''
        })
      } catch (error) {
        console.error('Fehler beim Lesen der Datei:', error)
        setRows([])
        setColumns([])
        setMapping(defaultMapping)
        setTransformations(createDefaultTransformations())
        setAnalysisWarnings([])
        setParseError('Die Datei konnte nicht gelesen werden. Bitte prüfen Sie das Format.')
      } finally {
        setIsLoading(false)
      }
    },
    [allowMultipleValueColumns]
  )

  const updateMapping = useCallback((next) => {
    setMapping((prev) => ({ ...prev, ...next }))
    setValidationErrors([])
  }, [])

  const updateTransformations = useCallback((updater) => {
    setTransformations((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      return next
    })
    setValidationErrors([])
    setResultWarnings([])
  }, [])

  const toggleValueColumn = useCallback((columnKey) => {
    setMapping((prev) => {
      const exists = prev.valueColumns.includes(columnKey)
      const nextColumns = exists
        ? prev.valueColumns.filter((entry) => entry !== columnKey)
        : [...prev.valueColumns, columnKey]
      return { ...prev, valueColumns: nextColumns }
    })
    setValidationErrors([])
  }, [])

  useEffect(() => {
    setTransformations((prev) => {
      const nextPerColumn = {}
      let changed = false
      mapping.valueColumns.forEach((column) => {
        const current = prev.aggregations.perColumn[column]
        const nextValue = current || prev.aggregations.defaultOperation || 'sum'
        nextPerColumn[column] = nextValue
        if (current !== nextValue) {
          changed = true
        }
      })
      Object.keys(prev.aggregations.perColumn).forEach((column) => {
        if (!mapping.valueColumns.includes(column)) {
          changed = true
        }
      })

      const nextGroupingColumn = prev.grouping.enabled ? mapping.label || '' : prev.grouping.column
      const groupingChanged = prev.grouping.enabled && prev.grouping.column !== nextGroupingColumn

      if (!changed && !groupingChanged) {
        return prev
      }

      return {
        ...prev,
        grouping: groupingChanged ? { ...prev.grouping, column: nextGroupingColumn } : prev.grouping,
        aggregations: changed
          ? {
              ...prev.aggregations,
              perColumn: nextPerColumn
            }
          : prev.aggregations
      }
    })
  }, [mapping.label, mapping.valueColumns])

  const previewRows = useMemo(() => rows.slice(0, 5), [rows])
  const totalRows = rows.length
  const transformationSummary = useMemo(
    () => applyTransformations(rows, mapping, transformations),
    [rows, mapping, transformations]
  )
  const transformedRows = transformationSummary.rows
  const transformationWarnings = transformationSummary.warnings
  const transformedPreviewRows = useMemo(() => transformedRows.slice(0, 5), [transformedRows])
  const transformedRowCount = transformedRows.length
  const warnings = useMemo(
    () => [...analysisWarnings, ...transformationWarnings, ...resultWarnings],
    [analysisWarnings, transformationWarnings, resultWarnings]
  )

  const getImportResult = useCallback(() => {
    if (rows.length === 0) {
      setValidationErrors(['Bitte laden Sie zuerst eine Datei hoch.'])
      return null
    }

    const { label, valueColumns, datasetLabel } = mapping
    const columnKeys = new Set(columns.map((column) => column.key))
    const errors = []

    if (!label) {
      errors.push('Bitte wählen Sie eine Spalte für die Beschriftungen aus.')
    }
    if (!valueColumns || valueColumns.length === 0) {
      errors.push('Bitte wählen Sie mindestens eine Werte-Spalte aus.')
    }
    if (datasetLabel && valueColumns.length > 1) {
      errors.push('Bei Verwendung einer Datensatz-Spalte darf nur eine Werte-Spalte ausgewählt sein.')
    }

    const activeFilters = (transformations.filters || []).filter((filter) => filter.enabled !== false)
    activeFilters.forEach((filter) => {
      if (filter.column && !columnKeys.has(filter.column)) {
        errors.push(`Filter bezieht sich auf eine nicht mehr vorhandene Spalte "${filter.column}".`)
      }
      if (['greaterThan', 'lessThan'].includes(filter.operator) && toNumber(filter.value) === null) {
        errors.push(`Filter für Spalte "${filter.column || '–'}" benötigt einen gültigen Zahlenwert.`)
      }
    })

    if (transformations.grouping?.enabled) {
      if (!label) {
        errors.push('Aktivierte Gruppierung benötigt eine ausgewählte Beschriftungs-Spalte.')
      }
      if (transformations.grouping.column && !columnKeys.has(transformations.grouping.column)) {
        errors.push('Die ausgewählte Gruppierungs-Spalte ist nicht mehr verfügbar.')
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      return null
    }

    const { rows: transformed, warnings: transformationPreview, meta: transformationMeta } = applyTransformations(
      rows,
      mapping,
      transformations
    )

    if (!transformed || transformed.length === 0) {
      setValidationErrors(['Es konnten nach Anwendung der Transformationen keine Datenzeilen importiert werden.'])
      setResultWarnings(transformationPreview)
      return null
    }

    let result = null
    let warningsFromRows = []

    if (datasetLabel) {
      result = buildLongDatasetResult(transformed, label, valueColumns[0], datasetLabel)
      warningsFromRows = result.rowWarnings
      delete result.rowWarnings
      result.values = []
    } else if (requireDatasets || valueColumns.length > 1) {
      const datasetResult = buildWideDatasetResult(transformed, label, valueColumns)
      warningsFromRows = datasetResult.rowWarnings
      delete datasetResult.rowWarnings
      result = { ...datasetResult, values: [] }
    } else {
      const simpleResult = buildSimpleResult(transformed, label, valueColumns[0])
      warningsFromRows = simpleResult.rowWarnings
      delete simpleResult.rowWarnings
      result = { ...simpleResult, datasets: [] }
    }

    if (!result.labels || result.labels.length === 0) {
      setValidationErrors(['Es konnten keine gültigen Datenzeilen importiert werden. Bitte prüfen Sie die Auswahl.'])
      return null
    }

    const combinedWarnings = [...transformationPreview, ...warningsFromRows]
    setResultWarnings(combinedWarnings)
    return {
      labels: result.labels,
      values: result.values,
      datasets: result.datasets,
      meta: {
        valueColumns: [...valueColumns],
        datasetLabelColumn: datasetLabel || null,
        transformations,
        transformationMeta
      }
    }
  }, [rows, mapping, transformations, requireDatasets, columns])

  return {
    fileName,
    columns,
    mapping,
    updateMapping,
    transformations,
    updateTransformations,
    toggleValueColumn,
    parseFile,
    reset,
    previewRows,
    totalRows,
    transformedPreviewRows,
    transformedRowCount,
    transformationWarnings,
    transformationMeta: transformationSummary.meta,
    isLoading,
    parseError,
    validationErrors,
    warnings,
    allowMultipleValueColumns,
    requireDatasets,
    getImportResult
  }
}
