import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// Note: Values are checked case-insensitively in toNumber(), so we only need lowercase here
const PLACEHOLDER_VALUES = new Set(['', '-', 'n/a', 'na', 'null', 'undefined', 'nan', 'unknown'])

const defaultMapping = {
  label: '',
  valueColumns: [],
  datasetLabel: '',
  xColumn: '',
  yColumn: '',
  rColumn: '',
  pointLabelColumn: '',
  longitudeColumn: '',
  latitudeColumn: ''
}

const createDefaultTransformations = () => ({
  // Value transformation rules applied before filters/grouping
  valueRules: [],
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

const defaultSortConfig = { column: '', direction: 'none' }

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
  
  // Remove all whitespace
  let normalized = text.replace(/\s+/g, '')
  
  // Handle different decimal separator formats
  // Common formats for coordinates:
  // - "13.4050" (point as decimal separator) - standard English format
  // - "13,4050" (comma as decimal separator) - European format
  // - "13 4050" (space as thousands separator) - some formats
  
  // Try parsing directly first (handles "13.4050" correctly)
  let parsed = Number(normalized)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  
  // If direct parsing failed, try replacing comma with point
  // This handles "13,4050" -> "13.4050"
  normalized = normalized.replace(',', '.')
  parsed = Number(normalized)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  
  // If that also failed, check for ambiguous cases with multiple separators
  // For coordinates, we typically only have one decimal separator
  // So if there are multiple, we'll use the last one as the decimal separator
  const originalText = text.replace(/\s+/g, '')
  const commaPos = originalText.lastIndexOf(',')
  const pointPos = originalText.lastIndexOf('.')
  
  if (commaPos > -1 && pointPos > -1) {
    // Both separators exist - use the last one as decimal separator
    if (commaPos > pointPos) {
      // Comma is last - use comma as decimal, remove points as thousands separators
      normalized = originalText.replace(/\./g, '').replace(',', '.')
    } else {
      // Point is last - use point as decimal, remove commas as thousands separators
      normalized = originalText.replace(/,/g, '')
    }
    parsed = Number(normalized)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  } else if (originalText.match(/,/g) && (originalText.match(/,/g) || []).length > 1) {
    // Multiple commas - use last comma as decimal separator
    normalized = originalText.replace(/,/g, (match, offset, str) => offset === str.lastIndexOf(',') ? '.' : '')
    parsed = Number(normalized)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  } else if (originalText.match(/\./g) && (originalText.match(/\./g) || []).length > 1) {
    // Multiple points - use last point as decimal separator
    const lastPointIndex = originalText.lastIndexOf('.')
    normalized = originalText.substring(0, lastPointIndex).replace(/\./g, '') + originalText.substring(lastPointIndex)
    parsed = Number(normalized)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  
  return null
}

// Parse datetime strings (ISO 8601 and common formats)
const toDateTime = (value) => {
  if (value === null || value === undefined) return null
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null
  }
  const text = String(value).trim()
  if (!text) return null
  const lower = text.toLowerCase()
  if (PLACEHOLDER_VALUES.has(lower)) return null
  
  // Try European format with space: DD.MM.YYYY HH:MM:SS or DD.MM.YYYY HH:MM
  // This handles formats like "07.07.2025 12:00:00" or "07.07.2025 12:00"
  // Priority: check this FIRST because it's more specific than ISO formats
  const europeanDateTimeMatch = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*$|\.\d+|Z|[+-]\d{2}:\d{2})?/)
  if (europeanDateTimeMatch) {
    const [, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr = '0'] = europeanDateTimeMatch
    const day = parseInt(dayStr, 10)
    const month = parseInt(monthStr, 10)
    const year = parseInt(yearStr, 10)
    const hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr, 10)
    const second = parseInt(secondStr, 10)
    
    // Validate date components
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 100 && year <= 9999 &&
        hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
      const parsed = new Date(dateStr)
      // Verify the parsed date matches our input (avoid month/day confusion)
      if (Number.isFinite(parsed.getTime()) && 
          parsed.getDate() === day && 
          parsed.getMonth() === month - 1 && 
          parsed.getFullYear() === year) {
        return parsed
      }
    }
  }
  
  // Try DD.MM.YYYY or DD/MM/YYYY (date only, no time)
  const europeanDateOnlyMatch = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:\s*$|(?!\s+\d))/)
  if (europeanDateOnlyMatch) {
    const [, dayStr, monthStr, yearStr] = europeanDateOnlyMatch
    const day = parseInt(dayStr, 10)
    const month = parseInt(monthStr, 10)
    const year = parseInt(yearStr, 10)
    
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 100 && year <= 9999) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`
      const parsed = new Date(dateStr)
      if (Number.isFinite(parsed.getTime()) && 
          parsed.getDate() === day && 
          parsed.getMonth() === month - 1 && 
          parsed.getFullYear() === year) {
        return parsed
      }
    }
  }
  
  // Try YYYY-MM-DD HH:MM:SS (ISO date with space instead of T)
  const isoDateWithSpaceMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:\s*([+-])(\d{2}):(\d{2})|Z)?$/)
  if (isoDateWithSpaceMatch) {
    const [, year, month, day, hour, minute, second = '00'] = isoDateWithSpaceMatch
    const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`
    const parsed = new Date(dateStr)
    if (Number.isFinite(parsed.getTime())) {
      return parsed
    }
  }
  
  // Try ISO 8601 format (e.g., 2023-12-25T10:30:00Z or 2023-12-25T10:30:00+01:00)
  const isoDateMatch = text.match(/^\d{4}-\d{2}-\d{2}(?:T|\s)/)
  if (isoDateMatch) {
    const isoDate = new Date(text.replace(/\s+/, 'T'))
    if (Number.isFinite(isoDate.getTime()) && !isNaN(isoDate.getTime())) {
      return isoDate
    }
  }
  
  // Try YYYY-MM-DD (date only)
  const isoDateOnlyMatch = text.match(/^\d{4}-\d{2}-\d{2}$/)
  if (isoDateOnlyMatch) {
    const parsed = new Date(text + 'T00:00:00')
    if (Number.isFinite(parsed.getTime())) {
      return parsed
    }
  }
  
  // Fallback: try Date.parse with any remaining format (but be careful)
  const fallbackDate = new Date(text)
  if (Number.isFinite(fallbackDate.getTime()) && !isNaN(fallbackDate.getTime())) {
    // Only accept if it's not a weird parsed value (like "1970-01-01" for invalid dates)
    const fallbackYear = fallbackDate.getFullYear()
    if (fallbackYear >= 100 && fallbackYear <= 9999) {
      // Additional check: if the original text looks like a date format we recognize, use it
      // Otherwise, be cautious and return null
      const looksLikeDate = /^\d{1,4}[./-]\d{1,2}[./-]\d{2,4}/.test(text)
      if (looksLikeDate) {
        return fallbackDate
      }
    }
  }
  
  return null
}

const normalizeSearchText = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.toLowerCase()
  if (typeof value === 'number') return String(value)
  if (value instanceof Date) return value.toISOString().toLowerCase()
  return String(value).toLowerCase()
}

const rowMatchesQuery = (row, query) => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true
  return Object.values(row).some((cell) => normalizeSearchText(cell).includes(normalizedQuery))
}

const getColumnType = (columns, key) => {
  const column = columns.find((col) => col.key === key)
  return column?.type || 'string'
}

const compareCellValues = (aValue, bValue, type) => {
  if (aValue === bValue) return 0
  if (aValue === undefined || aValue === null || aValue === '') return 1
  if (bValue === undefined || bValue === null || bValue === '') return -1

  if (type === 'number') {
    const aNum = toNumber(aValue)
    const bNum = toNumber(bValue)
    if (aNum === bNum) return 0
    if (aNum === null) return 1
    if (bNum === null) return -1
    return aNum - bNum
  }

  if (type === 'date' || type === 'datetime') {
    const aDate = toDateTime(aValue)
    const bDate = toDateTime(bValue)
    if (aDate === bDate) return 0
    if (aDate === null) return 1
    if (bDate === null) return -1
    return aDate.getTime() - bDate.getTime()
  }

  const aText = String(aValue).toLowerCase()
  const bText = String(bValue).toLowerCase()
  return aText.localeCompare(bText)
}

const applySearchToEntries = (entries, query) => {
  if (!query || !query.trim()) {
    return entries
  }
  return entries.filter((entry) => rowMatchesQuery(entry.row, query))
}

const applySortToEntries = (entries, sortConfig, columns) => {
  if (!sortConfig?.column || sortConfig.direction === 'none') {
    return entries
  }
  const directionMultiplier = sortConfig.direction === 'desc' ? -1 : 1
  const type = getColumnType(columns, sortConfig.column)
  const sortable = [...entries]
  sortable.sort((a, b) => {
    const comparison = compareCellValues(a.row[sortConfig.column], b.row[sortConfig.column], type)
    return comparison * directionMultiplier
  })
  return sortable
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
  const { column, operator, value, minValue, maxValue, flags } = filter
  if (!column) return true
  const cellValue = row[column]
  const cellText = normalizeLabel(cellValue)
  const operatorValue = operator || 'equalsText'
  
  // Type/emptiness checks
  if (operatorValue === 'isEmpty') {
    return isEmptyValue(cellValue)
  }
  if (operatorValue === 'isNotEmpty') {
    return !isEmptyValue(cellValue)
  }
  if (operatorValue === 'isNumber') {
    return toNumber(cellValue) !== null
  }
  if (operatorValue === 'isText') {
    return !isEmptyValue(cellValue) && toNumber(cellValue) === null
  }
  if (operatorValue === 'isDateTime') {
    return toDateTime(cellValue) !== null
  }
  
  // Text-based operators
  if (
    operatorValue === 'equalsText' ||
    operatorValue === 'notEqualsText' ||
    operatorValue === 'containsText' ||
    operatorValue === 'notContainsText' ||
    operatorValue === 'matchesRegex' ||
    operatorValue === 'notMatchesRegex'
  ) {
    const filterText = normalizeLabel(value)
    if (operatorValue === 'equalsText') {
      return filterText ? cellText.toLowerCase() === filterText.toLowerCase() : false
    }
    if (operatorValue === 'notEqualsText') {
      return filterText ? cellText.toLowerCase() !== filterText.toLowerCase() : false
    }
    if (operatorValue === 'containsText') {
      return filterText ? cellText.toLowerCase().includes(filterText.toLowerCase()) : false
    }
    if (operatorValue === 'notContainsText') {
      return filterText ? !cellText.toLowerCase().includes(filterText.toLowerCase()) : false
    }
    if (operatorValue === 'matchesRegex' || operatorValue === 'notMatchesRegex') {
      try {
        if (!value) return false
        const regex = new RegExp(String(value), String(flags || ''))
        const match = regex.test(cellText)
        return operatorValue === 'matchesRegex' ? match : !match
      } catch (_e) {
        return false
      }
    }
  }
  
  // Numeric operators
  const numValue = toNumber(cellValue)
  const numFilter = toNumber(value)
  const numMin = toNumber(minValue)
  const numMax = toNumber(maxValue)
  
  if (
    operatorValue === 'greaterThan' ||
    operatorValue === 'greaterThanOrEqual' ||
    operatorValue === 'lessThan' ||
    operatorValue === 'lessThanOrEqual' ||
    operatorValue === 'equals' ||
    operatorValue === 'notEquals' ||
    operatorValue === 'between'
  ) {
    if (numValue === null) return false
    
    switch (operatorValue) {
      case 'greaterThan':
        return Number.isFinite(numFilter) && numValue > numFilter
      case 'greaterThanOrEqual':
        return Number.isFinite(numFilter) && numValue >= numFilter
      case 'lessThan':
        return Number.isFinite(numFilter) && numValue < numFilter
      case 'lessThanOrEqual':
        return Number.isFinite(numFilter) && numValue <= numFilter
      case 'equals':
        return Number.isFinite(numFilter) && numValue === numFilter
      case 'notEquals':
        return Number.isFinite(numFilter) && numValue !== numFilter
      case 'between':
        return Number.isFinite(numMin) && Number.isFinite(numMax) && numValue >= numMin && numValue <= numMax
      default:
        return false
    }
  }
  
  // DateTime operators
  const dateValue = toDateTime(cellValue)
  const dateFilter = toDateTime(value)
  const dateMin = toDateTime(minValue)
  const dateMax = toDateTime(maxValue)
  
  if (
    operatorValue === 'dateGreaterThan' ||
    operatorValue === 'dateGreaterThanOrEqual' ||
    operatorValue === 'dateLessThan' ||
    operatorValue === 'dateLessThanOrEqual' ||
    operatorValue === 'dateEquals' ||
    operatorValue === 'dateBetween'
  ) {
    if (dateValue === null) return false
    
    switch (operatorValue) {
      case 'dateGreaterThan':
        return dateFilter !== null && dateValue.getTime() > dateFilter.getTime()
      case 'dateGreaterThanOrEqual':
        return dateFilter !== null && dateValue.getTime() >= dateFilter.getTime()
      case 'dateLessThan':
        return dateFilter !== null && dateValue.getTime() < dateFilter.getTime()
      case 'dateLessThanOrEqual':
        return dateFilter !== null && dateValue.getTime() <= dateFilter.getTime()
      case 'dateEquals':
        return dateFilter !== null && dateValue.getTime() === dateFilter.getTime()
      case 'dateBetween':
        return dateMin !== null && dateMax !== null && dateValue.getTime() >= dateMin.getTime() && dateValue.getTime() <= dateMax.getTime()
      default:
        return false
    }
  }
  
  // Legacy support for old operators
  if (operatorValue === 'equals') {
    return cellText.toLowerCase() === normalizeLabel(value).toLowerCase()
  }
  if (operatorValue === 'notEquals') {
    return cellText.toLowerCase() !== normalizeLabel(value).toLowerCase()
  }
  if (operatorValue === 'contains') {
    const filterText = normalizeLabel(value)
    return filterText ? cellText.toLowerCase().includes(filterText.toLowerCase()) : true
  }
  if (operatorValue === 'notContains') {
    const filterText = normalizeLabel(value)
    return filterText ? !cellText.toLowerCase().includes(filterText.toLowerCase()) : true
  }
  if (operatorValue === 'greaterThan') {
    // Already handled above, but keeping for compatibility
    return Number.isFinite(numFilter) && numValue !== null && numValue > numFilter
  }
  if (operatorValue === 'lessThan') {
    // Already handled above, but keeping for compatibility
    return Number.isFinite(numFilter) && numValue !== null && numValue < numFilter
  }
  
  return true
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

// Apply rule-based value transformations on a copy of the rows
const applyValueRules = (rows, rules) => {
  const activeRules = (rules || []).filter((r) => r && r.enabled !== false && r.column)
  if (activeRules.length === 0) {
    return rows.map((row) => ({ ...row }))
  }

  const performAction = (currentValue, action) => {
    const type = action?.type || 'replaceText'
    const paramA = action?.value ?? ''
    const factor = Number.parseFloat(action?.factor)

    switch (type) {
      case 'setText':
        return String(paramA)
      case 'replaceText': {
        const search = String(action?.search ?? '')
        if (!search) return currentValue
        const src = String(currentValue ?? '')
        return src.split(search).join(String(paramA))
      }
      case 'regexReplace': {
        try {
          const pattern = String(action?.pattern ?? '')
          if (!pattern) return currentValue
          const flags = String(action?.flags || 'g')
          const re = new RegExp(pattern, flags)
          const src = String(currentValue ?? '')
          return src.replace(re, String(paramA))
        } catch (_e) {
          return currentValue
        }
      }
      case 'toNumber': {
        const n = toNumber(currentValue)
        return n
      }
      case 'multiply': {
        const n = toNumber(currentValue)
        return n === null || !Number.isFinite(factor) ? currentValue : n * factor
      }
      case 'divide': {
        const n = toNumber(currentValue)
        return n === null || !Number.isFinite(factor) ? currentValue : n / factor
      }
      case 'removeNonDigits': {
        const src = String(currentValue ?? '')
        return src.replace(/[^0-9]+/g, '')
      }
      case 'uppercase':
        return String(currentValue ?? '').toUpperCase()
      case 'lowercase':
        return String(currentValue ?? '').toLowerCase()
      case 'trim':
        return String(currentValue ?? '').trim()
      default:
        return currentValue
    }
  }

  const matchesCondition = (val, cond) => {
    if (!cond) return true
    const op = cond.operator || 'containsText'
    const text = String(val ?? '').trim()
    switch (op) {
      case 'containsText':
        return cond.value ? text.toLowerCase().includes(String(cond.value).toLowerCase()) : false
      case 'notContainsText':
        return cond.value ? !text.toLowerCase().includes(String(cond.value).toLowerCase()) : false
      case 'equalsText':
        return cond.value ? text.toLowerCase() === String(cond.value).toLowerCase() : false
      case 'isNumber':
        return toNumber(val) !== null
      case 'isEmpty':
        return isEmptyValue(val)
      case 'isNotEmpty':
        return !isEmptyValue(val)
      case 'matchesRegex':
        try {
          if (!cond.value) return false
          const re = new RegExp(String(cond.value), String(cond.flags || ''))
          return re.test(text)
        } catch (_e) {
          return false
        }
      default:
        return true
    }
  }

  return rows.map((row) => {
    const next = { ...row }
    for (const rule of activeRules) {
      const key = rule.column
      const current = next[key]
      if (matchesCondition(current, rule.when)) {
        next[key] = performAction(current, rule.action)
      }
    }
    return next
  })
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

  const { valueRules, filters, grouping, aggregations } = transformations

  // 1) Apply value rules first (original rows remain unchanged in state)
  workingRows = applyValueRules(workingRows, valueRules)

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

const buildCoordinateResult = (sourceRows, longitudeColumn, latitudeColumn, datasetLabelColumn, pointLabelColumn) => {
  const datasets = new Map()
  let skippedNoLongitude = 0
  let skippedNoLatitude = 0
  let skippedInvalidRange = 0
  const invalidLongitudeSamples = new Set()
  const invalidLatitudeSamples = new Set()
  const invalidRangeSamples = []

  sourceRows.forEach((row) => {
    const rawLongitude = row[longitudeColumn]
    const rawLatitude = row[latitudeColumn]
    const longitudeValue = toNumber(rawLongitude)
    const latitudeValue = toNumber(rawLatitude)
    const datasetLabel = datasetLabelColumn ? normalizeLabel(row[datasetLabelColumn]) : 'Standorte'
    const pointLabel = pointLabelColumn ? normalizeLabel(row[pointLabelColumn]) : null

    if (longitudeValue === null) {
      skippedNoLongitude += 1
      if (invalidLongitudeSamples.size < 3 && rawLongitude !== undefined && rawLongitude !== null) {
        const sample = String(rawLongitude).trim()
        if (sample && sample.length < 50) {
          invalidLongitudeSamples.add(sample)
        }
      }
      return
    }
    if (latitudeValue === null) {
      skippedNoLatitude += 1
      if (invalidLatitudeSamples.size < 3 && rawLatitude !== undefined && rawLatitude !== null) {
        const sample = String(rawLatitude).trim()
        if (sample && sample.length < 50) {
          invalidLatitudeSamples.add(sample)
        }
      }
      return
    }

    // Validate coordinate ranges
    const isLongitudeInvalid = longitudeValue < -180 || longitudeValue > 180
    const isLatitudeInvalid = latitudeValue < -90 || latitudeValue > 90
    if (isLongitudeInvalid || isLatitudeInvalid) {
      skippedInvalidRange += 1
      if (invalidRangeSamples.length < 3) {
        invalidRangeSamples.push(`Longitude: ${longitudeValue}°, Latitude: ${latitudeValue}°`)
      }
      return
    }

    const datasetKey = datasetLabel || 'Standorte'
    if (!datasets.has(datasetKey)) {
      datasets.set(datasetKey, {
        label: datasetKey,
        data: [],
        backgroundColor: '#3B82F6'
      })
    }

    const point = { longitude: longitudeValue, latitude: latitudeValue }
    if (pointLabel) {
      point.label = pointLabel
    }

    datasets.get(datasetKey).data.push(point)
  })

  const rowWarnings = []
  if (skippedNoLongitude > 0) {
    let msg = `${skippedNoLongitude} Zeile${skippedNoLongitude !== 1 ? 'n' : ''} ohne gültige Longitude-Werte wurden übersprungen.`
    if (invalidLongitudeSamples.size > 0) {
      msg += ` Beispielwerte: ${Array.from(invalidLongitudeSamples).slice(0, 3).map(s => `"${s}"`).join(', ')}`
    }
    rowWarnings.push(msg)
  }
  if (skippedNoLatitude > 0) {
    let msg = `${skippedNoLatitude} Zeile${skippedNoLatitude !== 1 ? 'n' : ''} ohne gültige Latitude-Werte wurden übersprungen.`
    if (invalidLatitudeSamples.size > 0) {
      msg += ` Beispielwerte: ${Array.from(invalidLatitudeSamples).slice(0, 3).map(s => `"${s}"`).join(', ')}`
    }
    rowWarnings.push(msg)
  }
  if (skippedInvalidRange > 0) {
    let msg = `${skippedInvalidRange} Zeile${skippedInvalidRange !== 1 ? 'n' : ''} mit Koordinaten außerhalb des gültigen Bereichs wurden übersprungen (Longitude: -180° bis 180°, Latitude: -90° bis 90°).`
    if (invalidRangeSamples.length > 0) {
      msg += ` Beispiele: ${invalidRangeSamples.slice(0, 3).join('; ')}`
    }
    rowWarnings.push(msg)
  }

  return { datasets: Array.from(datasets.values()), rowWarnings }
}

const buildScatterBubbleResult = (sourceRows, xColumn, yColumn, rColumn, datasetLabelColumn, pointLabelColumn, hasR = false) => {
  const datasets = new Map()
  let skippedNoX = 0
  let skippedNoY = 0
  let skippedInvalidR = 0

  sourceRows.forEach((row) => {
    const xValue = toNumber(row[xColumn])
    const yValue = toNumber(row[yColumn])
    const rValue = hasR && rColumn ? toNumber(row[rColumn]) : (hasR ? 10 : null)
    const datasetLabel = datasetLabelColumn ? normalizeLabel(row[datasetLabelColumn]) : 'Dataset 1'
    const pointLabel = pointLabelColumn ? normalizeLabel(row[pointLabelColumn]) : null

    if (xValue === null) {
      skippedNoX += 1
      return
    }
    if (yValue === null) {
      skippedNoY += 1
      return
    }
    if (hasR && rColumn && rValue === null) {
      skippedInvalidR += 1
      return
    }

    const datasetKey = datasetLabel || 'Dataset 1'
    if (!datasets.has(datasetKey)) {
      datasets.set(datasetKey, {
        label: datasetKey,
        data: [],
        backgroundColor: '#8B5CF6'
      })
    }

    const point = { x: xValue, y: yValue }
    if (hasR && rValue !== null) {
      point.r = rValue
    } else if (hasR && !rColumn) {
      // Default size for bubbles when no r column is specified
      point.r = 10
    }
    if (pointLabel) {
      point.label = pointLabel
    }

    datasets.get(datasetKey).data.push(point)
  })

  const rowWarnings = []
  if (skippedNoX > 0) {
    rowWarnings.push(`${skippedNoX} Zeilen ohne gültige X-Werte wurden übersprungen.`)
  }
  if (skippedNoY > 0) {
    rowWarnings.push(`${skippedNoY} Zeilen ohne gültige Y-Werte wurden übersprungen.`)
  }
  if (hasR && skippedInvalidR > 0) {
    rowWarnings.push(`${skippedInvalidR} Zeilen ohne gültige Größenwerte wurden übersprungen.`)
  }

  return { datasets: Array.from(datasets.values()), rowWarnings }
}

// Build result for radar charts: one dataset with multiple attributes
// Each row becomes a radar chart, with value columns as attributes (labels)
const buildRadarResult = (sourceRows, labelKey, valueKeys, datasetLabelKey = null) => {
  const datasets = []
  let skippedNoLabel = 0
  let skippedEmptyRow = 0
  let datasetCounter = 0
  
  // Labels are the attribute names (value column names)
  const labels = valueKeys.map(key => key)
  
  sourceRows.forEach((row, index) => {
    const rowLabel = labelKey ? normalizeLabel(row[labelKey]) : null
    let datasetLabel = null
    
    // Priority: datasetLabelKey > labelKey > auto-generated
    if (datasetLabelKey) {
      datasetLabel = normalizeLabel(row[datasetLabelKey])
    } else if (labelKey && rowLabel) {
      datasetLabel = rowLabel
    }
    
    // If still no label, generate one
    if (!datasetLabel) {
      datasetCounter += 1
      datasetLabel = `Datensatz ${datasetCounter}`
    }
    
    const attributeValues = valueKeys.map((key) => toNumber(row[key]))
    const hasValue = attributeValues.some((value) => value !== null)
    
    if (!hasValue) {
      skippedEmptyRow += 1
      return
    }
    
    // Only check for missing label if labelKey is required (but we don't require it for radar)
    // Skip validation for missing labelKey since it's optional
    
    // Each row becomes a dataset (radar chart line)
    datasets.push({
      label: datasetLabel,
      data: attributeValues
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

export default function useDataImport({ allowMultipleValueColumns = true, requireDatasets = false, initialData = null, chartType = null, isScatterBubble = false, isCoordinate = false } = {}) {
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [mapping, setMapping] = useState(defaultMapping)
  const [transformations, setTransformations] = useState(() => createDefaultTransformations())
  const [previewLimit, setPreviewLimit] = useState(5)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState(defaultSortConfig)
  const [isLoading, setIsLoading] = useState(false)
  const [parseError, setParseError] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const [analysisWarnings, setAnalysisWarnings] = useState([])
  const [resultWarnings, setResultWarnings] = useState([])
  const initialDataSignatureRef = useRef(null)

  // Load initial data when provided
  useEffect(() => {
    if (!initialData || !initialData.rows || !initialData.columns) {
      return
    }

    const signatureParts = [
      initialData.stateVersion || 0,
      initialData.fileName || '',
      initialData.rows?.length || 0,
      initialData.columns?.length || 0
    ]
    const signature = signatureParts.join('|')
    if (initialDataSignatureRef.current === signature) {
      return
    }
    initialDataSignatureRef.current = signature

    setFileName(initialData.fileName || '')
    setRows(initialData.rows || [])
    setColumns(initialData.columns || [])
    setMapping(initialData.mapping || defaultMapping)
    setTransformations(initialData.transformations || createDefaultTransformations())
    setPreviewLimit(initialData.previewLimit ?? 5)
    setSearchQuery(initialData.searchQuery || '')
    setSortConfig(initialData.sortConfig || defaultSortConfig)

    if (initialData.columns && initialData.columns.length > 0) {
      const analyzed = initialData.columns.map((col) => ({
        key: col.key,
        type: col.type || 'string',
        filledCount: col.filledCount || 0,
        emptyCount: col.emptyCount || 0
      }))
      setAnalysisWarnings(summarizeColumnWarnings(analyzed))
    }
  }, [initialData])

  const reset = useCallback(() => {
    setFileName('')
    setRows([])
    setColumns([])
    setMapping(defaultMapping)
    setTransformations(createDefaultTransformations())
    setPreviewLimit(5)
    setSearchQuery('')
    setSortConfig(defaultSortConfig)
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
        setPreviewLimit(5)
        setSearchQuery('')
        setSortConfig(defaultSortConfig)

        if (isCoordinate) {
          // For Coordinate, auto-detect longitude and latitude columns
          const numericColumns = analyzed.filter((col) => col.type === 'number').map((col) => col.key)
          const defaultLongitude = numericColumns.find((key) => key.toLowerCase().includes('long') || key.toLowerCase().includes('lon') || key.toLowerCase().includes('x')) || numericColumns[0] || ''
          const defaultLatitude = numericColumns.find((key) => key.toLowerCase().includes('lat') || key.toLowerCase().includes('y')) || numericColumns[1] || numericColumns[0] || ''
          
          setMapping({
            ...defaultMapping,
            longitudeColumn: defaultLongitude,
            latitudeColumn: defaultLatitude,
            datasetLabel: ''
          })
        } else if (isScatterBubble) {
          // For Scatter/Bubble/Matrix, auto-detect X and Y columns
          const numericColumns = analyzed.filter((col) => col.type === 'number').map((col) => col.key)
          const defaultX = numericColumns[0] || analyzed[0]?.key || ''
          const defaultY = numericColumns[1] || numericColumns[0] || analyzed[0]?.key || ''
          
          setMapping({
            ...defaultMapping,
            xColumn: defaultX,
            yColumn: defaultY,
            rColumn: numericColumns[2] || '',
            datasetLabel: ''
          })
        } else {
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
        }
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
    [allowMultipleValueColumns, isScatterBubble, isCoordinate]
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

  const updateCell = useCallback((rowIndex, columnKey, value) => {
    setRows((prev) => {
      if (rowIndex < 0 || rowIndex >= prev.length) {
        return prev
      }
      const next = prev.map((row, index) => (index === rowIndex ? { ...row, [columnKey]: value } : row))
      const analyzed = analyzeColumns(next)
      setColumns(analyzed)
      setAnalysisWarnings(summarizeColumnWarnings(analyzed))
      return next
    })
    setValidationErrors([])
    setResultWarnings([])
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

  const totalRows = rows.length

  const baseEntries = useMemo(() => rows.map((row, index) => ({ row, index })), [rows])
  const filteredEntries = useMemo(
    () => applySearchToEntries(baseEntries, searchQuery),
    [baseEntries, searchQuery]
  )
  const sortedEntries = useMemo(
    () => applySortToEntries(filteredEntries, sortConfig, columns),
    [filteredEntries, sortConfig, columns]
  )
  const previewEntries = useMemo(
    () => (previewLimit === 'all' ? sortedEntries : sortedEntries.slice(0, Number(previewLimit) || 5)),
    [sortedEntries, previewLimit]
  )
  const previewRows = useMemo(() => previewEntries.map((entry) => entry.row), [previewEntries])
  const filteredRowCount = filteredEntries.length
  const transformationSummary = useMemo(
    () => applyTransformations(rows, mapping, transformations),
    [rows, mapping, transformations]
  )
  const transformedRows = transformationSummary.rows
  const transformationWarnings = transformationSummary.warnings
  const transformedEntries = useMemo(
    () => transformedRows.map((row, index) => ({ row, index })),
    [transformedRows]
  )
  const filteredTransformedEntries = useMemo(
    () => applySearchToEntries(transformedEntries, searchQuery),
    [transformedEntries, searchQuery]
  )
  const sortedTransformedEntries = useMemo(
    () => applySortToEntries(filteredTransformedEntries, sortConfig, columns),
    [filteredTransformedEntries, sortConfig, columns]
  )
  const transformedPreviewEntries = useMemo(
    () =>
      previewLimit === 'all'
        ? sortedTransformedEntries
        : sortedTransformedEntries.slice(0, Number(previewLimit) || 5),
    [sortedTransformedEntries, previewLimit]
  )
  const transformedPreviewRows = useMemo(
    () => transformedPreviewEntries.map((entry) => entry.row),
    [transformedPreviewEntries]
  )
  const transformedRowCount = transformedRows.length
  const transformedFilteredRowCount = filteredTransformedEntries.length
  const warnings = useMemo(
    () => [...analysisWarnings, ...transformationWarnings, ...resultWarnings],
    [analysisWarnings, transformationWarnings, resultWarnings]
  )

  const getImportResult = useCallback((overrideMapping = null) => {
    if (rows.length === 0) {
      setValidationErrors(['Bitte laden Sie zuerst eine Datei hoch.'])
      return null
    }

    const activeMapping = overrideMapping ? { ...mapping, ...overrideMapping } : mapping
    const { label, valueColumns, datasetLabel, xColumn, yColumn, rColumn } = activeMapping
    const columnKeys = new Set(columns.map((column) => column.key))
    const errors = []

    // Coordinate validation
    if (isCoordinate) {
      const { longitudeColumn, latitudeColumn } = activeMapping
      if (!longitudeColumn) {
        errors.push('Bitte wählen Sie eine Spalte für die Longitude-Werte aus.')
      }
      if (!latitudeColumn) {
        errors.push('Bitte wählen Sie eine Spalte für die Latitude-Werte aus.')
      }
      if (longitudeColumn && !columnKeys.has(longitudeColumn)) {
        errors.push(`Die ausgewählte Longitude-Spalte "${longitudeColumn}" ist nicht mehr verfügbar.`)
      }
      if (latitudeColumn && !columnKeys.has(latitudeColumn)) {
        errors.push(`Die ausgewählte Latitude-Spalte "${latitudeColumn}" ist nicht mehr verfügbar.`)
      }
    } else if (isScatterBubble) {
      // Scatter/Bubble/Matrix validation
      if (!xColumn) {
        errors.push('Bitte wählen Sie eine Spalte für die X-Werte aus.')
      }
      if (!yColumn) {
        errors.push('Bitte wählen Sie eine Spalte für die Y-Werte aus.')
      }
      if (xColumn && !columnKeys.has(xColumn)) {
        errors.push(`Die ausgewählte X-Spalte "${xColumn}" ist nicht mehr verfügbar.`)
      }
      if (yColumn && !columnKeys.has(yColumn)) {
        errors.push(`Die ausgewählte Y-Spalte "${yColumn}" ist nicht mehr verfügbar.`)
      }
      if (rColumn && !columnKeys.has(rColumn)) {
        errors.push(`Die ausgewählte Größen-Spalte "${rColumn}" ist nicht mehr verfügbar.`)
      }
    } else {
      // For radar charts, label is optional (dataset name), but for other charts it's required
      if (chartType !== 'radar' && !label) {
        errors.push('Bitte wählen Sie eine Spalte für die Beschriftungen aus.')
      }
      if (!valueColumns || valueColumns.length === 0) {
        errors.push('Bitte wählen Sie mindestens eine Werte-Spalte aus.')
      }
      if (chartType === 'radar' && valueColumns.length < 2) {
        errors.push('Für Radar-Diagramme müssen Sie mindestens 2 Attribut-Spalten auswählen.')
      }
      if (datasetLabel && valueColumns.length > 1 && chartType !== 'radar') {
        errors.push('Bei Verwendung einer Datensatz-Spalte darf nur eine Werte-Spalte ausgewählt sein.')
      }
    }

    const activeFilters = (transformations.filters || []).filter((filter) => filter.enabled !== false)
    activeFilters.forEach((filter) => {
      if (filter.column && !columnKeys.has(filter.column)) {
        errors.push(`Filter bezieht sich auf eine nicht mehr vorhandene Spalte "${filter.column}".`)
      }
      const operator = filter.operator || 'equalsText'
      // Validate numeric operators
      if (['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(operator) && filter.value) {
        if (toNumber(filter.value) === null) {
          errors.push(`Filter für Spalte "${filter.column || '–'}" benötigt einen gültigen Zahlenwert.`)
        }
      }
      if (operator === 'between') {
        if (filter.minValue && toNumber(filter.minValue) === null) {
          errors.push(`Filter "zwischen" für Spalte "${filter.column || '–'}" benötigt einen gültigen Min-Wert.`)
        }
        if (filter.maxValue && toNumber(filter.maxValue) === null) {
          errors.push(`Filter "zwischen" für Spalte "${filter.column || '–'}" benötigt einen gültigen Max-Wert.`)
        }
      }
      // Validate DateTime operators
      if (['dateEquals', 'dateGreaterThan', 'dateGreaterThanOrEqual', 'dateLessThan', 'dateLessThanOrEqual'].includes(operator) && filter.value) {
        if (toDateTime(filter.value) === null) {
          errors.push(`Filter für Spalte "${filter.column || '–'}" benötigt ein gültiges Datum/Zeit (ISO 8601).`)
        }
      }
      if (operator === 'dateBetween') {
        if (filter.minValue && toDateTime(filter.minValue) === null) {
          errors.push(`Filter "Datum zwischen" für Spalte "${filter.column || '–'}" benötigt ein gültiges Start-Datum.`)
        }
        if (filter.maxValue && toDateTime(filter.maxValue) === null) {
          errors.push(`Filter "Datum zwischen" für Spalte "${filter.column || '–'}" benötigt ein gültiges End-Datum.`)
        }
      }
      // Validate regex operators
      if (['matchesRegex', 'notMatchesRegex'].includes(operator) && filter.value) {
        try {
          new RegExp(String(filter.value), String(filter.flags || ''))
        } catch (_e) {
          errors.push(`Filter für Spalte "${filter.column || '–'}" enthält ein ungültiges Regex-Muster.`)
        }
      }
    })

    if (transformations.grouping?.enabled) {
      // For coordinate and scatter/bubble charts, grouping doesn't require a label column
      if (!isCoordinate && !isScatterBubble) {
        if (!label) {
          errors.push('Aktivierte Gruppierung benötigt eine ausgewählte Beschriftungs-Spalte.')
        }
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

    // Coordinate charts have special mapping
    if (isCoordinate) {
      const { longitudeColumn, latitudeColumn, datasetLabel: datasetLabelCol, pointLabelColumn } = mapping
      
      if (!longitudeColumn || !latitudeColumn) {
        setValidationErrors(['Bitte wählen Sie Longitude- und Latitude-Spalten aus.'])
        return null
      }
      
      const coordinateResult = buildCoordinateResult(
        transformed,
        longitudeColumn,
        latitudeColumn,
        datasetLabelCol,
        pointLabelColumn
      )
      warningsFromRows = coordinateResult.rowWarnings
      delete coordinateResult.rowWarnings
      result = { datasets: coordinateResult.datasets, labels: [], values: [] }
      
      if (!result.datasets || result.datasets.length === 0 || result.datasets.every(ds => ds.data.length === 0)) {
        const errorParts = ['Es konnten keine gültigen Koordinaten importiert werden.']
        if (warningsFromRows.length > 0) {
          errorParts.push('', ...warningsFromRows)
        }
        errorParts.push('', 'Bitte prüfen Sie:')
        errorParts.push(`- Die ausgewählten Spalten (${longitudeColumn}, ${latitudeColumn})`)
        errorParts.push('- Ob die Werte gültige Zahlen enthalten')
        errorParts.push('- Ob die Koordinaten im gültigen Bereich liegen (Longitude: -180° bis 180°, Latitude: -90° bis 90°)')
        const errorMsg = errorParts.join('\n')
        setValidationErrors([errorMsg])
        setResultWarnings(warningsFromRows)
        return null
      }
    } else if (isScatterBubble) {
      // Scatter/Bubble/Matrix charts have special mapping
      const { xColumn, yColumn, rColumn, datasetLabel: datasetLabelCol, pointLabelColumn } = activeMapping
      const hasR = chartType === 'bubble' || chartType === 'matrix'

      if (!xColumn || !yColumn) {
        setValidationErrors(['Bitte wählen Sie X- und Y-Spalten aus.'])
        return null
      }
      
      const scatterResult = buildScatterBubbleResult(
        transformed,
        xColumn,
        yColumn,
        rColumn,
        datasetLabelCol,
        pointLabelColumn,
        hasR
      )
      warningsFromRows = scatterResult.rowWarnings
      delete scatterResult.rowWarnings
      result = { datasets: scatterResult.datasets, labels: [], values: [] }
      
      if (!result.datasets || result.datasets.length === 0 || result.datasets.every(ds => ds.data.length === 0)) {
        setValidationErrors(['Es konnten keine gültigen Datenpunkte importiert werden. Bitte prüfen Sie die Spaltenauswahl.'])
        return null
      }
    } else if (chartType === 'radar') {
      // Radar charts: one row per dataset, multiple value columns as attributes
      // Labels are the attribute names (value column names)
      // Dataset label comes from datasetLabel column if set, otherwise from label column
      const datasetLabelCol = datasetLabel || (label || null)
      const radarResult = buildRadarResult(transformed, null, valueColumns, datasetLabelCol)
      warningsFromRows = radarResult.rowWarnings
      delete radarResult.rowWarnings
      result = { ...radarResult, values: [] }
    } else if (datasetLabel) {
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

    // For coordinate and scatter/bubble charts, we check datasets instead of labels
    if (isCoordinate || isScatterBubble) {
      // Already validated above - datasets must not be empty
      if (!result.datasets || result.datasets.length === 0 || result.datasets.every(ds => ds.data.length === 0)) {
        // This should not happen as we check above, but just in case
        setValidationErrors(['Es konnten keine gültigen Koordinaten/Datenpunkte importiert werden.'])
        return null
      }
    } else if (!result.labels || result.labels.length === 0) {
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
        transformationMeta,
        mapping: activeMapping
      }
    }
  }, [rows, mapping, transformations, requireDatasets, columns])

  const getImportState = useCallback(() => {
    return {
      fileName,
      rows,
      columns,
      mapping,
      transformations,
      previewLimit,
      searchQuery,
      sortConfig
    }
  }, [fileName, rows, columns, mapping, transformations, previewLimit, searchQuery, sortConfig])

  return {
    fileName,
    columns,
    mapping,
    updateMapping,
    transformations,
    updateTransformations,
    toggleValueColumn,
    updateCell,
    parseFile,
    reset,
    previewRows,
    previewEntries,
    filteredRowCount,
    totalRows,
    transformedPreviewRows,
    transformedPreviewEntries,
    transformedRowCount,
    transformedFilteredRowCount,
    transformedRows,
    transformationWarnings,
    transformationMeta: transformationSummary.meta,
    isLoading,
    parseError,
    validationErrors,
    warnings,
    allowMultipleValueColumns,
    requireDatasets,
    previewLimit,
    setPreviewLimit,
    searchQuery,
    setSearchQuery,
    sortConfig,
    setSortConfig,
    getImportResult,
    getImportState
  }
}
