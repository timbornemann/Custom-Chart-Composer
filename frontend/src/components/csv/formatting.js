import { MAX_HIGHLIGHT_SEGMENTS } from './constants'

const STAT_NUMBER_FORMAT = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 3,
  minimumFractionDigits: 0
})

const STAT_PERCENT_FORMAT = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  maximumFractionDigits: 1
})

export const formatCellValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') {
    return value.trim()
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : ''
  }
  return String(value)
}

export const formatStatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '?'
  }
  return STAT_NUMBER_FORMAT.format(value)
}

export const formatStatPercentage = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '?'
  }
  return STAT_PERCENT_FORMAT.format(value)
}

export const escapeForReplacement = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const applyReplacementToText = (value, searchConfig, replacement) => {
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

export const renderHighlightedValue = (value, matches) => {
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

export const formatSamplePreview = (value) => {
  const formatted = formatCellValue(value)
  if (formatted === null || formatted === undefined) {
    return '?'
  }
  const asString = typeof formatted === 'string' ? formatted : String(formatted)
  return asString.trim() === '' ? '?' : formatted
}

export const isCellValueEmpty = (value) => {
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

export const parsePreviewNumber = (value) => {
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

export const formatPreviewLabel = (value) => {
  const formatted = formatSamplePreview(value)
  return formatted === null || formatted === undefined ? '?' : String(formatted)
}

export const formatCorrelationValue = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '?'
  }
  return value.toFixed(2)
}

