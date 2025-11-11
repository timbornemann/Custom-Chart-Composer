// Preload all GeoJSON files using Vite's import.meta.glob
// Use ?raw to import as text strings, then parse as JSON
// Match files directly in GeoJSONs folder (including .geojson and .geojson.geojson)
// Use multiple patterns to catch all variations
const geoJsonModules1 = import.meta.glob('./GeoJSONs/*.geojson?raw', { 
  eager: true,
  import: 'default'
})
const geoJsonModules2 = import.meta.glob('./GeoJSONs/*.geojson.geojson?raw', { 
  eager: true,
  import: 'default'
})
const geoJsonModules3 = import.meta.glob('./GeoJSONs/*.geojason.geojson?raw', { 
  eager: true,
  import: 'default'
})

// Merge all modules
const geoJsonModules = { ...geoJsonModules1, ...geoJsonModules2, ...geoJsonModules3 }

// Debug: Log what files were found
console.log('[GeoJSON Loader] Found files:', Object.keys(geoJsonModules).length)
if (Object.keys(geoJsonModules).length === 0) {
  console.warn('[GeoJSON Loader] No GeoJSON files found! Check the path and file extensions.')
}

// Extract filenames and create a list
const fileEntries = Object.entries(geoJsonModules).map(([path, rawData]) => {
  const filename = path.split('/').pop().replace('?raw', '')
  // Extract a readable label from filename
  let label = filename.replace(/\.geojson$/g, '').replace(/\.geojason$/g, '')
  // Handle special cases
  if (label === 'europe') label = 'Europa'
  else if (label === 'germany-states') label = 'Deutschland (Bundesländer)'
  else if (label === 'World') label = 'Welt'
  
  // Parse the raw string as JSON
  let data
  try {
    data = JSON.parse(rawData)
  } catch (e) {
    console.error(`[GeoJSON Loader] Failed to parse GeoJSON from ${filename}:`, e)
    return null
  }
  
  return {
    filename,
    label,
    path,
    data
  }
}).filter(Boolean) // Remove any null entries

console.log('[GeoJSON Loader] Successfully loaded', fileEntries.length, 'GeoJSON files')

// Sort by label for better UX
fileEntries.sort((a, b) => a.label.localeCompare(b.label, 'de'))

export const GEOJSON_FILES = fileEntries.map(({ filename, label }) => ({
  filename,
  label
}))

// Load a GeoJSON file by filename
export const loadGeoJsonFile = async (filename) => {
  const entry = fileEntries.find(e => e.filename === filename)
  if (entry) {
    return entry.data
  }
  throw new Error(`GeoJSON file not found: ${filename}`)
}

