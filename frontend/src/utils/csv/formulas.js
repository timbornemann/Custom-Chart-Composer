const CELL_REF_REGEX = /^([A-Za-z]+)(\d+)$/
const RANGE_REGEX = /^([A-Za-z]+\d+):([A-Za-z]+\d+)$/

const coerceNumber = (value) => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }
  const text = String(value).trim()
  if (!text) {
    return null
  }
  const withoutSpaces = text.replace(/\s+/g, '')

  let parsed = Number(withoutSpaces)
  if (Number.isFinite(parsed)) {
    return parsed
  }

  parsed = Number(withoutSpaces.replace(/,/g, '.'))
  if (Number.isFinite(parsed)) {
    return parsed
  }

  const removeRepeatedSeparators = withoutSpaces.replace(/\.(?=.*\.)/g, '').replace(/,(?=.*,)/g, '')
  parsed = Number(removeRepeatedSeparators.replace(/,/g, '.'))
  if (Number.isFinite(parsed)) {
    return parsed
  }

  const swapSeparators = withoutSpaces.replace(/\./g, '').replace(/,/g, '.')
  parsed = Number(swapSeparators)
  if (Number.isFinite(parsed)) {
    return parsed
  }

  return null
}

const splitArguments = (text) => {
  if (text === undefined || text === null) {
    return []
  }
  const trimmed = String(text)
  const args = []
  let current = ''
  let depth = 0
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index]
    if (char === '(') {
      depth += 1
      current += char
      continue
    }
    if (char === ')') {
      depth -= 1
      if (depth < 0) {
        return null
      }
      current += char
      continue
    }
    if (char === ',' && depth === 0) {
      if (current.trim() !== '') {
        args.push(current.trim())
      }
      current = ''
      continue
    }
    current += char
  }
  if (depth !== 0) {
    return null
  }
  if (current.trim() !== '') {
    args.push(current.trim())
  }
  return args
}

export const columnIndexToName = (index) => {
  if (!Number.isInteger(index) || index < 0) {
    return ''
  }
  let current = index
  let label = ''
  while (current >= 0) {
    const remainder = current % 26
    label = String.fromCharCode(65 + remainder) + label
    current = Math.floor(current / 26) - 1
  }
  return label
}

export const columnNameToIndex = (name) => {
  if (!name || typeof name !== 'string') {
    return -1
  }
  const trimmed = name.trim().toUpperCase()
  if (!trimmed || /[^A-Z]/.test(trimmed)) {
    return -1
  }
  let index = 0
  for (let position = 0; position < trimmed.length; position += 1) {
    index *= 26
    index += trimmed.charCodeAt(position) - 64
  }
  return index - 1
}

const parseCellRef = (reference, { columnCount, rowCount } = {}) => {
  if (!reference || typeof reference !== 'string') {
    return null
  }
  const match = CELL_REF_REGEX.exec(reference.trim())
  if (!match) {
    return null
  }
  const [, columnLabel, rowLabel] = match
  const columnIndex = columnNameToIndex(columnLabel)
  const rowIndex = Number.parseInt(rowLabel, 10) - 1
  if (columnIndex < 0 || rowIndex < 0) {
    return null
  }
  if (typeof columnCount === 'number' && columnIndex >= columnCount) {
    return null
  }
  if (typeof rowCount === 'number' && rowIndex >= rowCount) {
    return null
  }
  return { columnIndex, rowIndex }
}

const resolveCellByIndex = (rowIndex, columnIndex, context, visited) => {
  if (!Number.isInteger(rowIndex) || rowIndex < 0) {
    return { error: 'Ungültiger Zeilenindex' }
  }
  if (!Number.isInteger(columnIndex) || columnIndex < 0) {
    return { error: 'Ungültiger Spaltenindex' }
  }
  if (typeof context.rowCount === 'number' && rowIndex >= context.rowCount) {
    return { error: 'Zeile außerhalb des gültigen Bereichs' }
  }
  if (typeof context.columnCount === 'number' && columnIndex >= context.columnCount) {
    return { error: 'Spalte außerhalb des gültigen Bereichs' }
  }

  const key = `${columnIndex}:${rowIndex}`
  if (visited.has(key)) {
    return { error: 'Zirkuläre Referenz erkannt' }
  }

  visited.add(key)
  try {
    const formula = context.getCellFormula ? context.getCellFormula(rowIndex, columnIndex) : null
    if (formula) {
      const expression = String(formula).trim()
      const nested = expression.startsWith('=') ? expression.slice(1) : expression
      const evaluated = evaluateExpressionInternal(nested, context, visited)
      return evaluated
    }
    const value = context.getCellValue ? context.getCellValue(rowIndex, columnIndex) : null
    return { value, type: 'scalar' }
  } finally {
    visited.delete(key)
  }
}

const getRangeValues = (startRef, endRef, context, visited) => {
  const start = parseCellRef(startRef, context)
  const end = parseCellRef(endRef, context)
  if (!start || !end) {
    return { error: 'Ungültiger Bereich' }
  }
  const columnStart = Math.min(start.columnIndex, end.columnIndex)
  const columnEnd = Math.max(start.columnIndex, end.columnIndex)
  const rowStart = Math.min(start.rowIndex, end.rowIndex)
  const rowEnd = Math.max(start.rowIndex, end.rowIndex)

  const values = []
  for (let row = rowStart; row <= rowEnd; row += 1) {
    for (let column = columnStart; column <= columnEnd; column += 1) {
      const result = resolveCellByIndex(row, column, context, visited)
      if (result.error) {
        return { error: result.error }
      }
      values.push(result.value)
    }
  }
  return { values }
}

const gatherNumericValues = (args, context, visited) => {
  const numbers = []
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (!argument) {
      continue
    }
    const trimmed = argument.trim()
    if (!trimmed) {
      continue
    }
    const rangeMatch = RANGE_REGEX.exec(trimmed)
    if (rangeMatch) {
      const rangeResult = getRangeValues(rangeMatch[1], rangeMatch[2], context, visited)
      if (rangeResult.error) {
        return { error: rangeResult.error }
      }
      rangeResult.values.forEach((value) => {
        const numeric = coerceNumber(value)
        if (numeric !== null) {
          numbers.push(numeric)
        }
      })
      continue
    }
    const evaluated = evaluateExpressionInternal(trimmed, context, visited)
    if (evaluated.error) {
      return { error: evaluated.error }
    }
    if (evaluated.type === 'range') {
      evaluated.value.forEach((value) => {
        const numeric = coerceNumber(value)
        if (numeric !== null) {
          numbers.push(numeric)
        }
      })
    } else {
      const numeric = coerceNumber(evaluated.value)
      if (numeric !== null) {
        numbers.push(numeric)
      }
    }
  }
  return { values: numbers }
}

const FORMULA_DEFINITIONS = [
  {
    name: 'SUM',
    description: 'Addiert alle numerischen Werte in den angegebenen Argumenten.',
    syntax: 'SUM(A1:A10, B2)',
    evaluate: (args, context, visited) => {
      const result = gatherNumericValues(args, context, visited)
      if (result.error) return result
      const total = result.values.reduce((sum, value) => sum + value, 0)
      return { value: total, type: 'scalar' }
    }
  },
  {
    name: 'AVERAGE',
    description: 'Berechnet den Mittelwert der numerischen Werte der Argumente.',
    syntax: 'AVERAGE(A1:A10)',
    evaluate: (args, context, visited) => {
      const result = gatherNumericValues(args, context, visited)
      if (result.error) return result
      if (result.values.length === 0) {
        return { value: null, type: 'scalar' }
      }
      const total = result.values.reduce((sum, value) => sum + value, 0)
      return { value: total / result.values.length, type: 'scalar' }
    }
  },
  {
    name: 'MIN',
    description: 'Gibt den kleinsten numerischen Wert in den Argumenten zurück.',
    syntax: 'MIN(A1, B1:B5)',
    evaluate: (args, context, visited) => {
      const result = gatherNumericValues(args, context, visited)
      if (result.error) return result
      if (result.values.length === 0) {
        return { value: null, type: 'scalar' }
      }
      return { value: Math.min(...result.values), type: 'scalar' }
    }
  },
  {
    name: 'MAX',
    description: 'Gibt den größten numerischen Wert in den Argumenten zurück.',
    syntax: 'MAX(A1:A10)',
    evaluate: (args, context, visited) => {
      const result = gatherNumericValues(args, context, visited)
      if (result.error) return result
      if (result.values.length === 0) {
        return { value: null, type: 'scalar' }
      }
      return { value: Math.max(...result.values), type: 'scalar' }
    }
  },
  {
    name: 'COUNT',
    description: 'Zählt die numerischen Werte in den angegebenen Argumenten.',
    syntax: 'COUNT(A1:A10)',
    evaluate: (args, context, visited) => {
      const result = gatherNumericValues(args, context, visited)
      if (result.error) return result
      return { value: result.values.length, type: 'scalar' }
    }
  }
]

const FORMULA_REGISTRY = FORMULA_DEFINITIONS.reduce((registry, definition) => {
  registry[definition.name.toUpperCase()] = definition
  return registry
}, {})

export const AVAILABLE_FORMULAS = FORMULA_DEFINITIONS.map(({ evaluate, ...metadata }) => metadata)

const evaluateFunction = (name, args, context, visited) => {
  const upper = name.toUpperCase()
  const definition = FORMULA_REGISTRY[upper]
  if (!definition) {
    return { error: `Unbekannte Funktion „${name}“` }
  }
  return definition.evaluate(args, context, visited)
}

function evaluateExpressionInternal(expression, context, visited) {
  const trimmed = expression.trim()
  if (!trimmed) {
    return { value: '', type: 'scalar' }
  }

  const rangeMatch = RANGE_REGEX.exec(trimmed)
  if (rangeMatch) {
    const rangeResult = getRangeValues(rangeMatch[1], rangeMatch[2], context, visited)
    if (rangeResult.error) {
      return { error: rangeResult.error }
    }
    return { value: rangeResult.values, type: 'range' }
  }

  const cellMatch = CELL_REF_REGEX.exec(trimmed)
  if (cellMatch) {
    const ref = parseCellRef(trimmed, context)
    if (!ref) {
      return { error: `Ungültiger Zellbezug „${trimmed}“` }
    }
    return resolveCellByIndex(ref.rowIndex, ref.columnIndex, context, visited)
  }

  const functionMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\((.*)\)$/s)
  if (functionMatch) {
    const name = functionMatch[1]
    const argumentText = functionMatch[2]
    const args = splitArguments(argumentText)
    if (args === null) {
      return { error: 'Ungültige Argumentliste' }
    }
    return evaluateFunction(name, args, context, visited)
  }

  const quoted = trimmed.match(/^"(.*)"$/s)
  if (quoted) {
    return { value: quoted[1], type: 'scalar' }
  }

  const numeric = coerceNumber(trimmed)
  if (numeric !== null) {
    return { value: numeric, type: 'scalar' }
  }

  return { error: `Ausdruck „${trimmed}“ konnte nicht ausgewertet werden` }
}

export const evaluateFormulaExpression = (formula, context = {}) => {
  if (formula === null || formula === undefined) {
    return { value: '' }
  }
  const text = String(formula).trim()
  if (!text.startsWith('=')) {
    return { value: text }
  }
  const expression = text.slice(1)
  const visited = new Set()
  const result = evaluateExpressionInternal(expression, context, visited)
  if (result.error) {
    return { error: result.error }
  }
  if (result.type === 'range') {
    return { error: 'Ein Bereich kann nicht als einzelner Zellwert dargestellt werden.' }
  }
  return { value: result.value }
}

export const formatCellReference = (columnIndex, rowIndex) => {
  const column = columnIndexToName(columnIndex)
  if (!column || !Number.isInteger(rowIndex) || rowIndex < 0) {
    return ''
  }
  return `${column}${rowIndex + 1}`
}

export const formatRangeReference = (startColumnIndex, startRowIndex, endColumnIndex, endRowIndex) => {
  const start = formatCellReference(startColumnIndex, startRowIndex)
  const end = formatCellReference(endColumnIndex, endRowIndex)
  if (!start || !end) {
    return ''
  }
  return start === end ? start : `${start}:${end}`
}

export const parseCellReference = (reference, limits) => parseCellRef(reference, limits)
