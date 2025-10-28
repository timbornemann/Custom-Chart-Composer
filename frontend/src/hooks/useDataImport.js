import { useCallback, useMemo, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const PLACEHOLDER_VALUES = new Set(['', '-', 'n/a', 'na', 'null', 'undefined', 'nan'])

const defaultMapping = {
  label: '',
  valueColumns: [],
  datasetLabel: ''
}

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

export default function useDataImport({ allowMultipleValueColumns = true, requireDatasets = false } = {}) {
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [mapping, setMapping] = useState(defaultMapping)
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

  const previewRows = useMemo(() => rows.slice(0, 5), [rows])
  const totalRows = rows.length
  const warnings = useMemo(() => [...analysisWarnings, ...resultWarnings], [analysisWarnings, resultWarnings])

  const buildSimpleResult = useCallback(
    (labelKey, valueKey) => {
      const labels = []
      const values = []
      let skippedNoLabel = 0
      let skippedInvalidNumber = 0

      rows.forEach((row) => {
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
    },
    [rows]
  )

  const buildWideDatasetResult = useCallback(
    (labelKey, valueKeys) => {
      const labels = []
      const datasets = valueKeys.map((key) => ({ label: key, data: [] }))
      let skippedNoLabel = 0
      let skippedEmptyRow = 0

      rows.forEach((row) => {
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
    },
    [rows]
  )

  const buildLongDatasetResult = useCallback(
    (labelKey, valueKey, datasetLabelKey) => {
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

      rows.forEach((row) => {
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
    },
    [rows]
  )

  const getImportResult = useCallback(() => {
    if (rows.length === 0) {
      setValidationErrors(['Bitte laden Sie zuerst eine Datei hoch.'])
      return null
    }

    const { label, valueColumns, datasetLabel } = mapping
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

    if (errors.length > 0) {
      setValidationErrors(errors)
      return null
    }

    let result = null
    let warningsFromRows = []

    if (datasetLabel) {
      result = buildLongDatasetResult(label, valueColumns[0], datasetLabel)
      warningsFromRows = result.rowWarnings
      delete result.rowWarnings
      result.values = []
    } else if (requireDatasets || valueColumns.length > 1) {
      const datasetResult = buildWideDatasetResult(label, valueColumns)
      warningsFromRows = datasetResult.rowWarnings
      delete datasetResult.rowWarnings
      result = { ...datasetResult, values: [] }
    } else {
      const simpleResult = buildSimpleResult(label, valueColumns[0])
      warningsFromRows = simpleResult.rowWarnings
      delete simpleResult.rowWarnings
      result = { ...simpleResult, datasets: [] }
    }

    if (!result.labels || result.labels.length === 0) {
      setValidationErrors(['Es konnten keine gültigen Datenzeilen importiert werden. Bitte prüfen Sie die Auswahl.'])
      return null
    }

    setResultWarnings(warningsFromRows)
    return {
      labels: result.labels,
      values: result.values,
      datasets: result.datasets,
      meta: {
        valueColumns: [...valueColumns],
        datasetLabelColumn: datasetLabel || null
      }
    }
  }, [rows.length, mapping, requireDatasets, buildLongDatasetResult, buildSimpleResult, buildWideDatasetResult])

  return {
    fileName,
    columns,
    mapping,
    updateMapping,
    toggleValueColumn,
    parseFile,
    reset,
    previewRows,
    totalRows,
    isLoading,
    parseError,
    validationErrors,
    warnings,
    allowMultipleValueColumns,
    requireDatasets,
    getImportResult
  }
}
