export type PivotAggregatorType =
  | 'sum'
  | 'average'
  | 'min'
  | 'max'
  | 'count'
  | 'countRows'
  | 'countValid'
  | 'median'
  | 'stdDev'
  | 'variance'
  | 'product'
  | 'first'
  | 'last'

export interface PivotValueConfig {
  column: string
  aggregator: PivotAggregatorType
  label?: string
}

export interface PivotTableConfig {
  rowFields?: string[]
  columnFields?: string[]
  values?: PivotValueConfig[]
  scope?: 'raw' | 'transformed'
}

export interface PivotColumnMeta {
  key: string
  label: string
  parts: string[]
}

export interface PivotValueDescriptor {
  column: string
  aggregator: PivotAggregatorType
  label: string
}

export interface PivotResult {
  headers: string[]
  rows: Array<Array<string | number | null>>
  rowKeys: string[][]
  columnKeys: string[][]
  columnHeaders: PivotColumnMeta[]
  valueDescriptors: PivotValueDescriptor[]
  meta: {
    rowGroupCount: number
    columnGroupCount: number
    sourceRowCount: number
    valueCount: number
  }
  warnings: string[]
}

export interface PivotComputationOptions {
  columns?: Array<{ key: string; label?: string; displayName?: string; name?: string }>
  emptyPlaceholder?: string
}

interface AggregatorSummary {
  validCount: number
  invalidCount: number
  emptyCount: number
}

interface AggregatorFinalResult {
  value: string | number | null
  summary: AggregatorSummary
}

interface AggregatorDefinition<State> {
  requiresNumeric?: boolean
  init: () => State
  update: (state: State, rawValue: unknown) => void
  finalize: (state: State) => AggregatorFinalResult
}

const ROW_KEY_SEPARATOR = '\u241F'
const COLUMN_KEY_SEPARATOR = '\u241E'
const DEFAULT_PLACEHOLDER = '–'

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isValueEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true
  }
  if (typeof value === 'string') {
    return value.trim().length === 0
  }
  if (typeof value === 'number') {
    return Number.isNaN(value)
  }
  return false
}

const toNumeric = (value: unknown): { value: number; valid: boolean } => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { value, valid: true } : { value: Number.NaN, valid: false }
  }
  if (typeof value === 'boolean') {
    return { value: value ? 1 : 0, valid: true }
  }
  if (value instanceof Date) {
    return { value: value.getTime(), valid: true }
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return { value: Number.NaN, valid: false }
    }
    const normalized = trimmed.replace(',', '.')
    const numeric = Number(normalized)
    return Number.isFinite(numeric) ? { value: numeric, valid: true } : { value: Number.NaN, valid: false }
  }
  if (value !== null && typeof value === 'object') {
    const textual = String(value)
    const normalized = textual.trim().replace(',', '.')
    const numeric = Number(normalized)
    return Number.isFinite(numeric) ? { value: numeric, valid: true } : { value: Number.NaN, valid: false }
  }
  return { value: Number.NaN, valid: false }
}

const formatGroupValue = (value: unknown, placeholder: string): string => {
  if (value === null || value === undefined) {
    return placeholder
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length === 0 ? placeholder : trimmed
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  const textual = String(value)
  return textual.length === 0 ? placeholder : textual
}

const compareParts = (a: string[], b: string[]): number => {
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const partA = a[index] ?? ''
    const partB = b[index] ?? ''
    const comparison = partA.localeCompare(partB, undefined, { sensitivity: 'base' })
    if (comparison !== 0) {
      return comparison
    }
  }
  return 0
}

const resolveColumnTitle = (
  options: PivotComputationOptions['columns'],
  key: string
): string => {
  if (!options || !Array.isArray(options)) {
    return key
  }
  const match = options.find((column) => column && column.key === key)
  if (!match) {
    return key
  }
  return (
    (typeof match.displayName === 'string' && match.displayName) ||
    (typeof match.label === 'string' && match.label) ||
    (typeof match.name === 'string' && match.name) ||
    key
  )
}

const sanitizePlaceholder = (value: string | undefined): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  return DEFAULT_PLACEHOLDER
}

const ensureVariance = (value: number): number => {
  if (!Number.isFinite(value)) {
    return Number.NaN
  }
  if (value < 0 && value > -1e-12) {
    return 0
  }
  return value
}

export const PIVOT_AGGREGATION_LABELS: Record<PivotAggregatorType, string> = {
  sum: 'Summe',
  average: 'Durchschnitt',
  min: 'Minimum',
  max: 'Maximum',
  count: 'Anzahl gültiger Werte',
  countRows: 'Anzahl Datenpunkte',
  countValid: 'Anzahl Werte',
  median: 'Median',
  stdDev: 'Standardabweichung',
  variance: 'Varianz',
  product: 'Produkt',
  first: 'Erster Wert',
  last: 'Letzter Wert'
}

const aggregatorDefinitions: Record<PivotAggregatorType, AggregatorDefinition<any>> = {
  sum: {
    requiresNumeric: true,
    init: () => ({ sum: 0, validCount: 0, invalidCount: 0, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      const numeric = toNumeric(rawValue)
      if (!numeric.valid) {
        state.invalidCount += 1
        return
      }
      state.sum += numeric.value
      state.validCount += 1
    },
    finalize: (state) => ({
      value: state.validCount > 0 ? state.sum : null,
      summary: {
        validCount: state.validCount,
        invalidCount: state.invalidCount,
        emptyCount: state.emptyCount
      }
    })
  },
  average: {
    requiresNumeric: true,
    init: () => ({ sum: 0, validCount: 0, invalidCount: 0, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      const numeric = toNumeric(rawValue)
      if (!numeric.valid) {
        state.invalidCount += 1
        return
      }
      state.sum += numeric.value
      state.validCount += 1
    },
    finalize: (state) => ({
      value: state.validCount > 0 ? state.sum / state.validCount : null,
      summary: {
        validCount: state.validCount,
        invalidCount: state.invalidCount,
        emptyCount: state.emptyCount
      }
    })
  },
  min: {
    requiresNumeric: true,
    init: () => ({ min: Number.POSITIVE_INFINITY, hasValue: false, invalidCount: 0, emptyCount: 0, validCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      const numeric = toNumeric(rawValue)
      if (!numeric.valid) {
        state.invalidCount += 1
        return
      }
      if (!state.hasValue || numeric.value < state.min) {
        state.min = numeric.value
      }
      state.hasValue = true
      state.validCount += 1
    },
    finalize: (state) => ({
      value: state.hasValue ? state.min : null,
      summary: {
        validCount: state.validCount,
        invalidCount: state.invalidCount,
        emptyCount: state.emptyCount
      }
    })
  },
  max: {
    requiresNumeric: true,
    init: () => ({ max: Number.NEGATIVE_INFINITY, hasValue: false, invalidCount: 0, emptyCount: 0, validCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      const numeric = toNumeric(rawValue)
      if (!numeric.valid) {
        state.invalidCount += 1
        return
      }
      if (!state.hasValue || numeric.value > state.max) {
        state.max = numeric.value
      }
      state.hasValue = true
      state.validCount += 1
    },
    finalize: (state) => ({
      value: state.hasValue ? state.max : null,
      summary: {
        validCount: state.validCount,
        invalidCount: state.invalidCount,
        emptyCount: state.emptyCount
      }
    })
  },
  count: {
    requiresNumeric: true,
    init: () => ({ count: 0, invalidCount: 0, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      const numeric = toNumeric(rawValue)
      if (!numeric.valid) {
        state.invalidCount += 1
        return
      }
      state.count += 1
    },
    finalize: (state) => ({
      value: state.count,
      summary: {
        validCount: state.count,
        invalidCount: state.invalidCount,
        emptyCount: state.emptyCount
      }
    })
  },
  countRows: {
    init: () => ({ count: 0 }),
    update: (state) => {
      state.count += 1
    },
    finalize: (state) => ({
      value: state.count,
      summary: {
        validCount: state.count,
        invalidCount: 0,
        emptyCount: 0
      }
    })
  },
  countValid: {
    init: () => ({ count: 0, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      state.count += 1
    },
    finalize: (state) => ({
      value: state.count,
      summary: {
        validCount: state.count,
        invalidCount: 0,
        emptyCount: state.emptyCount
      }
    })
  },
  median: {
    requiresNumeric: true,
    init: () => ({ values: [] as number[], invalidCount: 0, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      const numeric = toNumeric(rawValue)
      if (!numeric.valid) {
        state.invalidCount += 1
        return
      }
      state.values.push(numeric.value)
    },
    finalize: (state) => {
      if (state.values.length === 0) {
        return {
          value: null,
          summary: {
            validCount: 0,
            invalidCount: state.invalidCount,
            emptyCount: state.emptyCount
          }
        }
      }
      const sorted = [...state.values].sort((a, b) => a - b)
      const middle = Math.floor(sorted.length / 2)
      const medianValue =
        sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
      return {
        value: medianValue,
        summary: {
          validCount: sorted.length,
          invalidCount: state.invalidCount,
          emptyCount: state.emptyCount
        }
      }
    }
  },
  stdDev: {
    requiresNumeric: true,
    init: () => ({ sum: 0, sumSquares: 0, validCount: 0, invalidCount: 0, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      const numeric = toNumeric(rawValue)
      if (!numeric.valid) {
        state.invalidCount += 1
        return
      }
      state.sum += numeric.value
      state.sumSquares += numeric.value * numeric.value
      state.validCount += 1
    },
    finalize: (state) => {
      if (state.validCount <= 1) {
        return {
          value: null,
          summary: {
            validCount: state.validCount,
            invalidCount: state.invalidCount,
            emptyCount: state.emptyCount
          }
        }
      }
      const mean = state.sum / state.validCount
      const variance = ensureVariance(
        (state.sumSquares - (state.sum * state.sum) / state.validCount) /
          (state.validCount - 1)
      )
      const stdValue = Number.isNaN(variance) ? null : Math.sqrt(variance)
      return {
        value: stdValue,
        summary: {
          validCount: state.validCount,
          invalidCount: state.invalidCount,
          emptyCount: state.emptyCount
        }
      }
    }
  },
  variance: {
    requiresNumeric: true,
    init: () => ({ sum: 0, sumSquares: 0, validCount: 0, invalidCount: 0, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      const numeric = toNumeric(rawValue)
      if (!numeric.valid) {
        state.invalidCount += 1
        return
      }
      state.sum += numeric.value
      state.sumSquares += numeric.value * numeric.value
      state.validCount += 1
    },
    finalize: (state) => {
      if (state.validCount <= 1) {
        return {
          value: null,
          summary: {
            validCount: state.validCount,
            invalidCount: state.invalidCount,
            emptyCount: state.emptyCount
          }
        }
      }
      const variance = ensureVariance(
        (state.sumSquares - (state.sum * state.sum) / state.validCount) /
          (state.validCount - 1)
      )
      return {
        value: Number.isNaN(variance) ? null : variance,
        summary: {
          validCount: state.validCount,
          invalidCount: state.invalidCount,
          emptyCount: state.emptyCount
        }
      }
    }
  },
  product: {
    requiresNumeric: true,
    init: () => ({ product: 1, validCount: 0, invalidCount: 0, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      const numeric = toNumeric(rawValue)
      if (!numeric.valid) {
        state.invalidCount += 1
        return
      }
      state.product *= numeric.value
      state.validCount += 1
    },
    finalize: (state) => ({
      value: state.validCount > 0 ? state.product : null,
      summary: {
        validCount: state.validCount,
        invalidCount: state.invalidCount,
        emptyCount: state.emptyCount
      }
    })
  },
  first: {
    init: () => ({ value: null as string | number | null, hasValue: false, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      if (!state.hasValue) {
        state.value = typeof rawValue === 'number' && Number.isNaN(rawValue) ? null : (rawValue as any)
        state.hasValue = true
      }
    },
    finalize: (state) => ({
      value: state.hasValue ? state.value : null,
      summary: {
        validCount: state.hasValue ? 1 : 0,
        invalidCount: 0,
        emptyCount: state.emptyCount
      }
    })
  },
  last: {
    init: () => ({ value: null as string | number | null, hasValue: false, emptyCount: 0 }),
    update: (state, rawValue) => {
      if (isValueEmpty(rawValue)) {
        state.emptyCount += 1
        return
      }
      state.value = typeof rawValue === 'number' && Number.isNaN(rawValue) ? null : (rawValue as any)
      state.hasValue = true
    },
    finalize: (state) => ({
      value: state.hasValue ? state.value : null,
      summary: {
        validCount: state.hasValue ? 1 : 0,
        invalidCount: 0,
        emptyCount: state.emptyCount
      }
    })
  }
}

export const computePivotTable = (
  rows: Array<Record<string, unknown>> | undefined,
  config: PivotTableConfig | undefined,
  options: PivotComputationOptions = {}
): PivotResult => {
  const sourceRows = Array.isArray(rows) ? rows : []
  const placeholder = sanitizePlaceholder(options.emptyPlaceholder)

  const rowFields = Array.isArray(config?.rowFields)
    ? config!.rowFields!.filter((field) => isNonEmptyString(field))
    : []
  const columnFields = Array.isArray(config?.columnFields)
    ? config!.columnFields!.filter((field) => isNonEmptyString(field))
    : []

  const warnings: string[] = []

  const valueDescriptors: PivotValueDescriptor[] = []
  const requestedValues = Array.isArray(config?.values) ? config!.values! : []
  requestedValues.forEach((entry) => {
    const columnKey = typeof entry?.column === 'string' ? entry.column : ''
    const rawAggregator = entry?.aggregator as PivotAggregatorType | undefined
    if (!columnKey) {
      warnings.push('Pivot: Eine Kennzahl ohne Spaltenauswahl wurde ignoriert.')
      return
    }
    if (!rawAggregator || !aggregatorDefinitions[rawAggregator]) {
      warnings.push(
        `Pivot: Die Aggregation „${entry?.aggregator ?? 'unbekannt'}“ für „${columnKey}“ wird nicht unterstützt.`
      )
      return
    }
    const label = isNonEmptyString(entry?.label)
      ? entry!.label!.trim()
      : `${resolveColumnTitle(options.columns, columnKey)} (${PIVOT_AGGREGATION_LABELS[rawAggregator] || rawAggregator})`
    valueDescriptors.push({ column: columnKey, aggregator: rawAggregator, label })
  })

  if (valueDescriptors.length === 0) {
    return {
      headers: rowFields.map((field) => resolveColumnTitle(options.columns, field)),
      rows: [],
      rowKeys: [],
      columnKeys: [],
      columnHeaders: [],
      valueDescriptors: [],
      meta: {
        rowGroupCount: 0,
        columnGroupCount: 0,
        sourceRowCount: sourceRows.length,
        valueCount: 0
      },
      warnings: warnings.length > 0
        ? warnings
        : ['Pivot: Bitte konfigurieren Sie mindestens ein Werte-Feld.']
    }
  }

  if (sourceRows.length === 0) {
    warnings.push('Pivot: Für die ausgewählte Datenbasis stehen keine Zeilen zur Verfügung.')
  }

  const rowGroups = new Map<
    string,
    {
      key: string
      parts: string[]
      columns: Map<
        string,
        {
          key: string
          parts: string[]
          states: Array<any>
        }
      >
    }
  >()
  const columnGroups = new Map<string, { key: string; parts: string[] }>()

  sourceRows.forEach((row) => {
    const rowParts = rowFields.map((field) => formatGroupValue(row?.[field], placeholder))
    const rowKey = rowFields.length > 0 ? rowParts.join(ROW_KEY_SEPARATOR) : '__TOTAL__'
    if (!rowGroups.has(rowKey)) {
      rowGroups.set(rowKey, {
        key: rowKey,
        parts: rowParts,
        columns: new Map()
      })
    }
    const rowEntry = rowGroups.get(rowKey)!

    const columnParts = columnFields.map((field) => formatGroupValue(row?.[field], placeholder))
    const columnKey = columnFields.length > 0 ? columnParts.join(COLUMN_KEY_SEPARATOR) : '__TOTAL__'
    if (!columnGroups.has(columnKey)) {
      columnGroups.set(columnKey, { key: columnKey, parts: columnParts })
    }
    if (!rowEntry.columns.has(columnKey)) {
      rowEntry.columns.set(columnKey, {
        key: columnKey,
        parts: columnParts,
        states: valueDescriptors.map((descriptor) => aggregatorDefinitions[descriptor.aggregator].init())
      })
    }
    const columnEntry = rowEntry.columns.get(columnKey)!

    valueDescriptors.forEach((descriptor, index) => {
      const aggregator = aggregatorDefinitions[descriptor.aggregator]
      aggregator.update(columnEntry.states[index], row?.[descriptor.column])
    })
  })

  if (columnGroups.size === 0) {
    columnGroups.set('__TOTAL__', { key: '__TOTAL__', parts: [] })
  }
  if (rowGroups.size === 0 && sourceRows.length > 0) {
    rowGroups.set('__TOTAL__', { key: '__TOTAL__', parts: [], columns: new Map() })
  }

  const sortedRowEntries = Array.from(rowGroups.values()).sort((a, b) => compareParts(a.parts, b.parts))
  const sortedColumnEntries = Array.from(columnGroups.values()).sort((a, b) => compareParts(a.parts, b.parts))

  const rowHeaderLabels = rowFields.map((field) => resolveColumnTitle(options.columns, field))

  const columnHeaders: PivotColumnMeta[] = sortedColumnEntries.map((entry) => ({
    key: entry.key,
    parts: entry.parts,
    label: entry.parts.length > 0 ? entry.parts.join(' · ') : 'Gesamt'
  }))

  const dataHeaders = sortedColumnEntries.flatMap((columnEntry) =>
    valueDescriptors.map((descriptor) =>
      columnEntry.parts.length > 0
        ? `${columnEntry.parts.join(' · ')} · ${descriptor.label}`
        : descriptor.label
    )
  )
  const headers = [...rowHeaderLabels, ...dataHeaders]

  const globalSummaries = valueDescriptors.map(() => ({
    validCount: 0,
    invalidCount: 0,
    emptyCount: 0
  }))

  const rowsData: Array<Array<string | number | null>> = []
  const rowKeys: string[][] = []

  sortedRowEntries.forEach((rowEntry) => {
    const rowValues = [...rowEntry.parts]
    const valueCells: Array<string | number | null> = []
    sortedColumnEntries.forEach((columnEntry) => {
      const existing = rowEntry.columns.get(columnEntry.key)
      valueDescriptors.forEach((descriptor, index) => {
        const aggregator = aggregatorDefinitions[descriptor.aggregator]
        if (existing) {
          const result = aggregator.finalize(existing.states[index])
          const { value, summary } = result
          globalSummaries[index].validCount += summary.validCount
          globalSummaries[index].invalidCount += summary.invalidCount
          globalSummaries[index].emptyCount += summary.emptyCount
          valueCells.push(value)
        } else {
          const emptyState = aggregator.init()
          const result = aggregator.finalize(emptyState)
          const { value, summary } = result
          globalSummaries[index].validCount += summary.validCount
          globalSummaries[index].invalidCount += summary.invalidCount
          globalSummaries[index].emptyCount += summary.emptyCount
          valueCells.push(value)
        }
      })
    })
    rowsData.push([...rowValues, ...valueCells])
    rowKeys.push([...rowEntry.parts])
  })

  valueDescriptors.forEach((descriptor, index) => {
    const summary = globalSummaries[index]
    if (summary.invalidCount > 0) {
      warnings.push(
        `Pivot: ${descriptor.label} – ${summary.invalidCount} Wert${
          summary.invalidCount === 1 ? '' : 'e'
        } konnten nicht als Zahl interpretiert werden.`
      )
    }
    if (
      aggregatorDefinitions[descriptor.aggregator].requiresNumeric &&
      summary.validCount === 0 &&
      sourceRows.length > 0
    ) {
      warnings.push(`Pivot: Für ${descriptor.label} standen keine numerischen Werte zur Verfügung.`)
    }
  })

  return {
    headers,
    rows: rowsData,
    rowKeys,
    columnKeys: sortedColumnEntries.map((entry) => [...entry.parts]),
    columnHeaders,
    valueDescriptors,
    meta: {
      rowGroupCount: sortedRowEntries.length,
      columnGroupCount: sortedColumnEntries.length,
      sourceRowCount: sourceRows.length,
      valueCount: valueDescriptors.length
    },
    warnings
  }
}

