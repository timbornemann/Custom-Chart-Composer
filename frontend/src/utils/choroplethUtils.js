const DEFAULT_START_LONGITUDE = -20
const DEFAULT_START_LATITUDE = 60
const GRID_CELL_WIDTH = 12
const GRID_CELL_HEIGHT = 8

export const normalizeRegionKey = (value) => {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

export const isFeature = (candidate) => {
  if (!candidate || typeof candidate !== 'object') return false
  if (candidate.type !== 'Feature') return false
  if (!candidate.geometry || typeof candidate.geometry !== 'object') return false
  const { type, coordinates } = candidate.geometry
  if (type !== 'Polygon' && type !== 'MultiPolygon') return false
  return Array.isArray(coordinates)
}

export const extractFeaturesFromGeoJson = (input) => {
  if (!input) return []
  if (Array.isArray(input)) {
    return input.filter(isFeature)
  }
  if (typeof input !== 'object') return []
  if (input.type === 'FeatureCollection' && Array.isArray(input.features)) {
    return input.features.filter(isFeature)
  }
  if (input.type === 'Feature') {
    return isFeature(input) ? [input] : []
  }
  return []
}

export const createPlaceholderFeature = (key, label, index = 0, total = 1) => {
  const safeIndex = Number.isFinite(index) ? index : 0
  const safeTotal = Math.max(1, Number.isFinite(total) ? total : 1)
  const columns = Math.ceil(Math.sqrt(safeTotal))
  const col = safeIndex % columns
  const row = Math.floor(safeIndex / columns)

  const width = GRID_CELL_WIDTH * 0.8
  const height = GRID_CELL_HEIGHT * 0.8

  const lonStart = DEFAULT_START_LONGITUDE + col * GRID_CELL_WIDTH
  const lonEnd = lonStart + width
  const latStart = DEFAULT_START_LATITUDE - row * GRID_CELL_HEIGHT
  const latEnd = latStart - height

  return {
    type: 'Feature',
    id: key,
    properties: {
      id: key,
      name: label || key
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lonStart, latStart],
        [lonEnd, latStart],
        [lonEnd, latEnd],
        [lonStart, latEnd],
        [lonStart, latStart]
      ]]
    }
  }
}

export const sanitizeFeature = (feature, fallbackId, fallbackLabel) => {
  if (!isFeature(feature)) {
    return createPlaceholderFeature(
      normalizeRegionKey(fallbackId || feature?.id || ''),
      fallbackLabel || feature?.properties?.name || feature?.properties?.id || ''
    )
  }

  const key = normalizeRegionKey(feature.id ?? feature.properties?.id ?? fallbackId ?? fallbackLabel ?? '')
  const safeLabel = feature.properties?.name
    || feature.properties?.title
    || fallbackLabel
    || key

  const coordinates = Array.isArray(feature.geometry.coordinates)
    ? feature.geometry.coordinates
    : createPlaceholderFeature(key, safeLabel).geometry.coordinates

  return {
    type: 'Feature',
    id: key,
    properties: {
      ...(feature.properties || {}),
      id: key,
      name: safeLabel
    },
    geometry: {
      type: feature.geometry.type || 'Polygon',
      coordinates
    }
  }
}

export const areFeaturesEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false
  return a.every((feature, index) => {
    const counterpart = b[index]
    if (!counterpart) return false
    try {
      return JSON.stringify(feature) === JSON.stringify(counterpart)
    } catch (error) {
      return false
    }
  })
}

export const summarizeFeature = (feature) => {
  if (!feature || !feature.geometry) {
    return { rings: 0, points: 0 }
  }
  const coords = feature.geometry.coordinates || []
  if (!Array.isArray(coords)) {
    return { rings: 0, points: 0 }
  }
  if (feature.geometry.type === 'MultiPolygon') {
    const rings = coords.reduce((acc, polygon) => acc + (Array.isArray(polygon) ? polygon.length : 0), 0)
    const points = coords.reduce((acc, polygon) => (
      acc + (Array.isArray(polygon)
        ? polygon.reduce((innerAcc, ring) => innerAcc + (Array.isArray(ring) ? ring.length : 0), 0)
        : 0)
    ), 0)
    return { rings, points }
  }
  const rings = coords.length
  const points = coords.reduce((acc, ring) => acc + (Array.isArray(ring) ? ring.length : 0), 0)
  return { rings, points }
}

export const isLikelyColorArray = (value) => {
  if (!Array.isArray(value)) return false
  if (value.length === 0) return false
  return value.every((entry) => typeof entry === 'string' && /^#|rgb|hsl/i.test(entry))
}

export default {
  normalizeRegionKey,
  isFeature,
  extractFeaturesFromGeoJson,
  createPlaceholderFeature,
  sanitizeFeature,
  areFeaturesEqual,
  summarizeFeature,
  isLikelyColorArray
}
