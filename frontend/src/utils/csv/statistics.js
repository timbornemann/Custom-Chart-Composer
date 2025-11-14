const LANCZOS_COEFFICIENTS = [
  0.99999999999980993,
  676.5203681218851,
  -1259.1392167224028,
  771.3234287776531,
  -176.6150291621406,
  12.507343278686905,
  -0.13857109526572012,
  9.9843695780195716e-6,
  1.5056327351493116e-7
]

const SQRT_TWO = Math.sqrt(2)
const EPSILON = 1e-12
const MAX_ITERATIONS = 200
const FPMIN = 1e-30

const MIN_NUMERIC_GROUP_SIZE = 5
const MIN_PROPORTION_GROUP_SIZE = 10
const MIN_EXPECTED_COUNT = 5

const normalizeTextValue = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  const text = String(value).trim()
  return text
}

const toNumericValue = (value) => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const trimmed = String(value).trim()
  if (!trimmed) {
    return null
  }
  let normalized = trimmed.replace(/\s+/g, '')
  let parsed = Number(normalized)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  parsed = Number(normalized.replace(/,/g, '.'))
  if (Number.isFinite(parsed)) {
    return parsed
  }
  const removeRepeatedSeparators = normalized
    .replace(/\.(?=.*\.)/g, '')
    .replace(/,(?=.*,)/g, '')
  parsed = Number(removeRepeatedSeparators.replace(/,/g, '.'))
  if (Number.isFinite(parsed)) {
    return parsed
  }
  const swapSeparators = normalized.replace(/\./g, '').replace(/,/g, '.')
  parsed = Number(swapSeparators)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  return null
}

const erf = (x) => {
  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * absX)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const polynomial = (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t
  const expTerm = Math.exp(-absX * absX)
  return sign * (1 - polynomial * expTerm)
}

const normalCdf = (z) => 0.5 * (1 + erf(z / SQRT_TWO))

const logGamma = (z) => {
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z)
  }
  let x = LANCZOS_COEFFICIENTS[0]
  const adjusted = z - 1
  for (let index = 1; index < LANCZOS_COEFFICIENTS.length; index += 1) {
    x += LANCZOS_COEFFICIENTS[index] / (adjusted + index)
  }
  const t = adjusted + LANCZOS_COEFFICIENTS.length - 0.5
  return (
    0.5 * Math.log(2 * Math.PI) +
    (adjusted + 0.5) * Math.log(t) -
    t +
    Math.log(x)
  )
}

const betacf = (x, a, b) => {
  let qab = a + b
  let qap = a + 1
  let qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < FPMIN) {
    d = FPMIN
  }
  d = 1 / d
  let h = d
  for (let m = 1; m <= MAX_ITERATIONS; m += 1) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) {
      d = FPMIN
    }
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) {
      c = FPMIN
    }
    d = 1 / d
    h *= d * c

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) {
      d = FPMIN
    }
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) {
      c = FPMIN
    }
    d = 1 / d
    const delta = d * c
    h *= delta
    if (Math.abs(delta - 1) < EPSILON) {
      break
    }
  }
  return h
}

const regularizedIncompleteBeta = (x, a, b) => {
  if (x <= 0) {
    return 0
  }
  if (x >= 1) {
    return 1
  }
  const lnBeta = logGamma(a + b) - logGamma(a) - logGamma(b)
  const bt = Math.exp(a * Math.log(x) + b * Math.log(1 - x) + lnBeta)
  const useDirect = x < (a + 1) / (a + b + 2)
  if (useDirect) {
    return (bt * betacf(x, a, b)) / a
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b
}

const studentTCdf = (t, df) => {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) {
    return Number.NaN
  }
  const x = df / (df + t * t)
  const ib = regularizedIncompleteBeta(x, df / 2, 0.5)
  if (!Number.isFinite(ib)) {
    return Number.NaN
  }
  if (t >= 0) {
    return 1 - 0.5 * ib
  }
  return 0.5 * ib
}

const regularizedGammaP = (s, x) => {
  if (!Number.isFinite(s) || !Number.isFinite(x) || s <= 0 || x < 0) {
    return Number.NaN
  }
  if (x === 0) {
    return 0
  }
  if (x < s + 1) {
    let sum = 1 / s
    let term = sum
    for (let n = 1; n <= MAX_ITERATIONS; n += 1) {
      term *= x / (s + n)
      sum += term
      if (Math.abs(term) < EPSILON * Math.abs(sum)) {
        break
      }
    }
    return sum * Math.exp(-x + s * Math.log(x) - logGamma(s))
  }
  let b = x + 1 - s
  let c = 1 / FPMIN
  let d = 1 / b
  let h = d
  for (let n = 1; n <= MAX_ITERATIONS; n += 1) {
    const an = -n * (n - s)
    b += 2
    d = an * d + b
    if (Math.abs(d) < FPMIN) {
      d = FPMIN
    }
    c = b + an / c
    if (Math.abs(c) < FPMIN) {
      c = FPMIN
    }
    d = 1 / d
    const delta = d * c
    h *= delta
    if (Math.abs(delta - 1) < EPSILON) {
      break
    }
  }
  return 1 - Math.exp(-x + s * Math.log(x) - logGamma(s)) * h
}

const chiSquareCdf = (x, k) => regularizedGammaP(k / 2, x / 2)

const clampProbability = (value) => {
  if (!Number.isFinite(value)) {
    return Number.NaN
  }
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

export const computeSegmentTest = ({
  samples,
  targetColumnKey,
  targetType,
  segmentColumnKey,
  selectedSegmentValues,
  targetCategory = '',
  segmentLabelMap = {},
  categoryLabelMap = {},
  significanceLevel = 0.05
}) => {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { ok: false, reason: 'Keine Stichprobendaten verfügbar.' }
  }
  if (!targetColumnKey || !segmentColumnKey) {
    return { ok: false, reason: 'Bitte wählen Sie eine Ziel- und Segmentspalte.' }
  }
  const normalizedTargetType = targetType === 'number' ? 'number' : 'string'
  const segmentValues = Array.isArray(selectedSegmentValues) ? selectedSegmentValues.filter((value) => value !== undefined && value !== null) : []
  if (segmentValues.length < 2) {
    return { ok: false, reason: 'Wählen Sie mindestens zwei Segmentwerte aus.' }
  }

  const normalizedTargetCategory = normalizeTextValue(targetCategory)
  const segmentSet = new Set(segmentValues)
  const groupsMap = new Map()
  const warnings = []

  samples.forEach((row) => {
    const rawSegment = row?.[segmentColumnKey]
    const segmentValue = normalizeTextValue(rawSegment)
    if (!segmentSet.has(segmentValue)) {
      return
    }
    let group = groupsMap.get(segmentValue)
    if (!group) {
      group = {
        value: segmentValue,
        label: segmentLabelMap[segmentValue] || segmentValue || '(leer)',
        sampleSize: 0,
        invalidCount: 0,
        sum: 0,
        sumSquares: 0,
        categoryCounts: new Map(),
        successes: 0
      }
      groupsMap.set(segmentValue, group)
    }

    if (normalizedTargetType === 'number') {
      const numericValue = toNumericValue(row?.[targetColumnKey])
      if (!Number.isFinite(numericValue)) {
        group.invalidCount += 1
        return
      }
      group.sampleSize += 1
      group.sum += numericValue
      group.sumSquares += numericValue * numericValue
      return
    }

    const targetValue = normalizeTextValue(row?.[targetColumnKey])
    group.sampleSize += 1
    const currentCount = group.categoryCounts.get(targetValue) || 0
    group.categoryCounts.set(targetValue, currentCount + 1)
    if (normalizedTargetCategory && targetValue === normalizedTargetCategory) {
      group.successes += 1
    }
  })

  const groups = segmentValues
    .map((value) => groupsMap.get(value))
    .filter((group) => group && group.sampleSize > 0)

  segmentValues.forEach((value) => {
    const group = groupsMap.get(value)
    if (!group || group.sampleSize === 0) {
      warnings.push(`Segment „${segmentLabelMap[value] || value || '(leer)'}“ enthält keine verwertbaren Beobachtungen für die gewählte Zielspalte.`)
    } else if (group.invalidCount > 0) {
      warnings.push(`Segment „${group.label}“: ${group.invalidCount.toLocaleString('de-DE')} Zeilen ohne nutzbaren Zielwert wurden übersprungen.`)
    }
  })

  if (groups.length < 2) {
    return {
      ok: false,
      reason: 'Für einen Vergleich werden in mindestens zwei Segmenten gültige Werte benötigt.',
      warnings: Array.from(new Set(warnings))
    }
  }

  const alphaLabel = (Number.isFinite(significanceLevel) ? significanceLevel : 0.05).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  if (normalizedTargetType === 'number') {
    if (groups.length !== 2) {
      return {
        ok: false,
        reason: 'Der Welch-t-Test unterstützt genau zwei Vergleichsgruppen. Bitte wählen Sie zwei Segmentwerte.',
        warnings: Array.from(new Set(warnings))
      }
    }

    const stats = groups.map((group) => {
      const mean = group.sum / group.sampleSize
      const variance =
        group.sampleSize > 1
          ? Math.max(0, (group.sumSquares - (group.sum * group.sum) / group.sampleSize) / (group.sampleSize - 1))
          : 0
      const stdDev = Math.sqrt(variance)
      if (group.sampleSize < MIN_NUMERIC_GROUP_SIZE) {
        warnings.push(`Segment „${group.label}“ hat nur ${group.sampleSize} gültige Werte. Die Aussagekraft des Tests ist eingeschränkt.`)
      }
      return { mean, variance, stdDev }
    })

    const [statsA, statsB] = stats
    const [groupA, groupB] = groups
    const varianceTerm = statsA.variance / groupA.sampleSize + statsB.variance / groupB.sampleSize
    if (!Number.isFinite(varianceTerm) || varianceTerm <= 0) {
      return {
        ok: false,
        reason: 'Der t-Test konnte nicht berechnet werden, da mindestens eine Gruppe keine Varianz besitzt.',
        warnings: Array.from(new Set(warnings))
      }
    }
    const tStatistic = (statsA.mean - statsB.mean) / Math.sqrt(varianceTerm)
    const numerator = varianceTerm * varianceTerm
    const denominator =
      (statsA.variance * statsA.variance) / (groupA.sampleSize * groupA.sampleSize * (groupA.sampleSize - 1)) +
      (statsB.variance * statsB.variance) / (groupB.sampleSize * groupB.sampleSize * (groupB.sampleSize - 1))
    const degreesOfFreedom = denominator > 0 ? numerator / denominator : Number.NaN
    const tail = studentTCdf(Math.abs(tStatistic), degreesOfFreedom)
    if (!Number.isFinite(tail)) {
      return {
        ok: false,
        reason: 'Die p-Wert-Berechnung für den t-Test ist fehlgeschlagen.',
        warnings: Array.from(new Set(warnings))
      }
    }
    const pValue = clampProbability(2 * (1 - tail))
    const interpretation =
      Number.isFinite(pValue) && pValue < significanceLevel
        ? `Signifikanter Unterschied (α = ${alphaLabel})`
        : `Kein signifikanter Unterschied (α = ${alphaLabel})`

    return {
      ok: true,
      testType: 'welch-t',
      testName: 'Welch t-Test',
      statisticLabel: 't',
      statistic: tStatistic,
      degreesOfFreedom,
      pValue,
      interpretation,
      effectSize: statsA.mean - statsB.mean,
      effectLabel: `${groupA.label} − ${groupB.label}`,
      groups: groups.map((group, index) => ({
        value: group.value,
        label: group.label,
        sampleSize: group.sampleSize,
        mean: stats[index].mean,
        stdDev: stats[index].stdDev
      })),
      warnings: Array.from(new Set(warnings))
    }
  }

  const categoryTotals = new Map()
  groups.forEach((group) => {
    group.categoryCounts.forEach((count, category) => {
      const current = categoryTotals.get(category) || 0
      categoryTotals.set(category, current + count)
    })
  })
  const categories = Array.from(categoryTotals.keys())
  if (categories.length < 2) {
    return {
      ok: false,
      reason: 'Für die Analyse werden mindestens zwei Zielausprägungen benötigt.',
      warnings: Array.from(new Set(warnings))
    }
  }
  categories.sort((a, b) => (categoryTotals.get(b) || 0) - (categoryTotals.get(a) || 0))

  if (normalizedTargetCategory && groups.length === 2) {
    const [groupA, groupB] = groups
    const successA = groupA.categoryCounts.get(normalizedTargetCategory) || 0
    const successB = groupB.categoryCounts.get(normalizedTargetCategory) || 0
    const proportionA = successA / groupA.sampleSize
    const proportionB = successB / groupB.sampleSize
    const pooled = (successA + successB) / (groupA.sampleSize + groupB.sampleSize)
    const variance = pooled * (1 - pooled) * (1 / groupA.sampleSize + 1 / groupB.sampleSize)

    if (!Number.isFinite(variance) || variance <= 0) {
      return {
        ok: false,
        reason: 'Der Z-Test ist nicht definiert, da keine Varianz in den Anteilen vorhanden ist.',
        warnings: Array.from(new Set(warnings))
      }
    }

    if (groupA.sampleSize < MIN_PROPORTION_GROUP_SIZE || groupB.sampleSize < MIN_PROPORTION_GROUP_SIZE) {
      warnings.push('Mindestens eine Gruppe enthält weniger als 10 Beobachtungen. Der Z-Test kann dadurch unzuverlässig sein.')
    }

    const zStatistic = (proportionA - proportionB) / Math.sqrt(variance)
    const pValue = clampProbability(2 * (1 - normalCdf(Math.abs(zStatistic))))
    const interpretation =
      Number.isFinite(pValue) && pValue < significanceLevel
        ? `Signifikanter Unterschied (α = ${alphaLabel})`
        : `Kein signifikanter Unterschied (α = ${alphaLabel})`

    const targetLabel = categoryLabelMap[normalizedTargetCategory] || normalizedTargetCategory || '(leer)'

    return {
      ok: true,
      testType: 'two-proportion-z',
      testName: 'Z-Test für zwei Anteile',
      statisticLabel: 'z',
      statistic: zStatistic,
      pValue,
      interpretation,
      targetCategory: normalizedTargetCategory,
      targetCategoryLabel: targetLabel,
      groups: [groupA, groupB].map((group, index) => ({
        value: group.value,
        label: group.label,
        sampleSize: group.sampleSize,
        successCount: index === 0 ? successA : successB,
        successRatio: index === 0 ? proportionA : proportionB
      })),
      warnings: Array.from(new Set(warnings))
    }
  }

  const table = groups.map((group) =>
    categories.map((category) => group.categoryCounts.get(category) || 0)
  )
  const rowTotals = table.map((row) => row.reduce((sum, value) => sum + value, 0))
  const colTotals = categories.map((_, columnIndex) =>
    table.reduce((sum, row) => sum + row[columnIndex], 0)
  )
  const grandTotal = rowTotals.reduce((sum, value) => sum + value, 0)
  let chiSquare = 0
  let lowExpected = false

  table.forEach((row, rowIndex) => {
    row.forEach((observed, columnIndex) => {
      const expected = (rowTotals[rowIndex] * colTotals[columnIndex]) / grandTotal
      if (expected < MIN_EXPECTED_COUNT) {
        lowExpected = true
      }
      if (expected > 0) {
        const diff = observed - expected
        chiSquare += (diff * diff) / expected
      }
    })
  })

  if (lowExpected) {
    warnings.push('Mindestens eine erwartete Häufigkeit liegt unter 5. Der Chi²-Test kann dadurch konservativ sein.')
  }

  const degreesOfFreedom = (groups.length - 1) * (categories.length - 1)
  if (degreesOfFreedom <= 0) {
    return {
      ok: false,
      reason: 'Der Chi²-Test konnte nicht berechnet werden, da die Freiheitsgrade 0 sind.',
      warnings: Array.from(new Set(warnings))
    }
  }

  const pValue = clampProbability(1 - chiSquareCdf(chiSquare, degreesOfFreedom))
  const interpretation =
    Number.isFinite(pValue) && pValue < significanceLevel
      ? `Signifikanter Unterschied (α = ${alphaLabel})`
      : `Kein signifikanter Unterschied (α = ${alphaLabel})`

  return {
    ok: true,
    testType: 'chi-square',
    testName: 'Chi²-Unabhängigkeitstest',
    statisticLabel: 'χ²',
    statistic: chiSquare,
    degreesOfFreedom,
    pValue,
    interpretation,
    categories: categories.map((category) => ({
      value: category,
      label: categoryLabelMap[category] || category || '(leer)'
    })),
    groups: groups.map((group) => ({
      value: group.value,
      label: group.label,
      sampleSize: group.sampleSize,
      topCategories: categories.map((category) => ({
        value: category,
        label: categoryLabelMap[category] || category || '(leer)',
        count: group.categoryCounts.get(category) || 0,
        ratio:
          group.sampleSize > 0
            ? (group.categoryCounts.get(category) || 0) / group.sampleSize
            : 0
      }))
    })),
    warnings: Array.from(new Set(warnings))
  }
}
