import { getGeoJsonFiles, getGeoJsonFile } from '../services/api'

// State to cache loaded files
let cachedFiles = []
let isLoading = false
let loadPromise = null

// Load GeoJSON files from API (similar to how chart types are loaded)
const loadFilesFromApi = async () => {
  if (isLoading && loadPromise) {
    return loadPromise
  }

  isLoading = true
  loadPromise = (async () => {
    try {
      const files = await getGeoJsonFiles()
      cachedFiles = files
      console.log('[GeoJSON Loader] Successfully loaded', files.length, 'GeoJSON files from API')
      return files
    } catch (error) {
      console.error('[GeoJSON Loader] Failed to load GeoJSON files from API:', error)
      cachedFiles = []
      throw error
    } finally {
      isLoading = false
      loadPromise = null
    }
  })()

  return loadPromise
}

// Initialize on module load
let initialized = false
const initialize = async () => {
  if (!initialized) {
    initialized = true
    try {
      await loadFilesFromApi()
    } catch (error) {
      // Silently fail on initialization, will retry on first access
      console.warn('[GeoJSON Loader] Initial load failed, will retry on first access')
    }
  }
}

// Auto-initialize
initialize()

// Export function to get files (always returns current cached files)
export const getGeoJsonFilesList = () => cachedFiles

// Load a GeoJSON file by filename from API
export const loadGeoJsonFile = async (filename) => {
  // Ensure files are loaded first
  if (cachedFiles.length === 0) {
    await loadFilesFromApi()
  }
  
  // Check if file exists in cache
  const file = cachedFiles.find(f => f.filename === filename)
  if (!file) {
    throw new Error(`GeoJSON file not found: ${filename}`)
  }
  
  // Load the actual data from API
  return await getGeoJsonFile(filename)
}

// Export function to refresh the file list
export const refreshGeoJsonFiles = async () => {
  return await loadFilesFromApi()
}
