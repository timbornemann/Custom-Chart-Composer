import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  FiPlus,
  FiTrash2,
  FiAlertCircle,
  FiMap,
  FiUpload,
  FiRefreshCw
} from 'react-icons/fi'
import { GEOJSON_FILES, loadGeoJsonFile } from '../utils/geoJsonLoader'
import {
  extractFeaturesFromGeoJson,
  createPlaceholderFeature,
  normalizeRegionKey,
  sanitizeFeature,
  summarizeFeature
} from '../utils/choroplethUtils'

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const createRegionFromFeature = (feature, fallbackIndex = 0) => {
  const key = normalizeRegionKey(feature?.id ?? feature?.properties?.id ?? feature?.properties?.name ?? `region-${fallbackIndex}`)
  const label = feature?.properties?.name || feature?.properties?.id || feature?.id || `Region ${fallbackIndex + 1}`
  return {
    id: key || `REG${fallbackIndex + 1}`,
    label,
    value: 0
  }
}

export default function ChoroplethEditor({
  regions = [],
  features = [],
  onRegionsChange,
  onFeaturesChange
}) {
  const [showHelper, setShowHelper] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [selectedGeoJson, setSelectedGeoJson] = useState('')
  const [isLoadingGeoJson, setIsLoadingGeoJson] = useState(false)

  // Debug: Log available GeoJSON files
  useMemo(() => {
    console.log('[ChoroplethEditor] Available GeoJSON files:', GEOJSON_FILES.length, GEOJSON_FILES)
  }, [])

  const normalizedFeatureIds = useMemo(
    () => features.map((feature, index) => normalizeRegionKey(feature?.id ?? feature?.properties?.id ?? `feature-${index}`)),
    [features]
  )

  const handleLoadGeoJson = async (filename) => {
    if (!filename) return
    setIsLoadingGeoJson(true)
    setUploadError(null)
    try {
      const geoJsonData = await loadGeoJsonFile(filename)
      const extracted = extractFeaturesFromGeoJson(geoJsonData)
      if (!extracted.length) {
        setUploadError('Die Datei enthält keine GeoJSON-Features.')
        setIsLoadingGeoJson(false)
        return
      }
      const sanitized = extracted.map((feature, index) => sanitizeFeature(feature, feature?.id ?? `feature-${index}`, feature?.properties?.name))
      onFeaturesChange(sanitized)
      syncRegionsWithFeatures(sanitized)
      setSelectedGeoJson(filename)
    } catch (error) {
      console.error(error)
      setUploadError(`GeoJSON konnte nicht geladen werden: ${error.message}`)
    } finally {
      setIsLoadingGeoJson(false)
    }
  }

  const featureStats = useMemo(() => {
    if (!features.length) {
      return { count: 0, points: 0 }
    }
    const summary = features.map((feature) => summarizeFeature(feature))
    const points = summary.reduce((acc, entry) => acc + (entry?.points || 0), 0)
    return { count: features.length, points }
  }, [features])

  const syncRegionsWithFeatures = (nextFeatures) => {
    if (!onRegionsChange) return
    const featureMap = new Map(
      nextFeatures.map((feature, index) => {
        const key = normalizeRegionKey(feature?.id ?? feature?.properties?.id ?? `feature-${index}`)
        const label = feature?.properties?.name || feature?.properties?.id || feature?.id || `Region ${index + 1}`
        return [key || `feature-${index}`, { key: key || `feature-${index}`, label }]
      })
    )

    const mergedRegions = Array.from(featureMap.values()).map(({ key, label }) => {
      const existing = regions.find((region) => normalizeRegionKey(region?.id ?? region?.label) === key)
      if (existing) {
        return {
          id: existing.id || key,
          label: existing.label || label,
          value: toNumber(existing.value, 0)
        }
      }
      return { id: key, label, value: 0 }
    })

    onRegionsChange(mergedRegions)
  }

  const handleAddRegion = () => {
    const nextIndex = regions.length + 1
    const id = `REG${nextIndex}`
    const label = `Region ${nextIndex}`
    onRegionsChange([
      ...regions,
      { id, label, value: 0 }
    ])
  }

  const handleRemoveRegion = (index) => {
    const updatedRegions = regions.filter((_, idx) => idx !== index)
    onRegionsChange(updatedRegions)
  }

  const handleRegionValueChange = (index, value) => {
    const updatedRegions = regions.map((region, idx) => (
      idx === index ? { ...region, value: toNumber(value, region.value) } : region
    ))
    onRegionsChange(updatedRegions)
  }

  const updateFeatureId = (oldKey, newKey, label) => {
    if (!onFeaturesChange) return
    const updatedFeatures = features.map((feature, index) => {
      const currentKey = normalizeRegionKey(feature?.id ?? feature?.properties?.id ?? `feature-${index}`)
      if (currentKey === oldKey) {
        return {
          ...feature,
          id: newKey,
          properties: {
            ...(feature.properties || {}),
            id: newKey,
            name: label ?? feature?.properties?.name
          }
        }
      }
      return feature
    })
    onFeaturesChange(updatedFeatures)
  }

  const handleRegionIdChange = (index, value) => {
    const newId = value.trim().toUpperCase()
    const previousKey = normalizeRegionKey(regions[index]?.id ?? regions[index]?.label)
    const nextRegions = regions.map((region, idx) => (
      idx === index ? { ...region, id: newId } : region
    ))
    onRegionsChange(nextRegions)
    updateFeatureId(previousKey, normalizeRegionKey(newId || previousKey), nextRegions[index]?.label)
  }

  const handleRegionLabelChange = (index, value) => {
    const nextRegions = [...regions]
    const autoId = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5)
    const previousKey = normalizeRegionKey(nextRegions[index]?.id ?? nextRegions[index]?.label)
    nextRegions[index] = {
      ...nextRegions[index],
      label: value,
      id: autoId || nextRegions[index].id
    }
    onRegionsChange(nextRegions)
    updateFeatureId(previousKey, normalizeRegionKey(nextRegions[index].id ?? previousKey), value)
  }


  const handleAddFeature = () => {
    const index = features.length
    const placeholder = createPlaceholderFeature(`REG${index + 1}`, `Region ${index + 1}`, index, Math.max(index + 1, regions.length || 1))
    const updatedFeatures = [...features, placeholder]
    onFeaturesChange(updatedFeatures)
    syncRegionsWithFeatures(updatedFeatures)
  }

  const handleRemoveFeature = (index) => {
    const updatedFeatures = features.filter((_, idx) => idx !== index)
    onFeaturesChange(updatedFeatures)
    const remainingKeys = new Set(updatedFeatures.map((feature, idx) => normalizeRegionKey(feature?.id ?? feature?.properties?.id ?? `feature-${idx}`)))
    const filteredRegions = regions.filter((region) => remainingKeys.has(normalizeRegionKey(region?.id ?? region?.label)))
    onRegionsChange(filteredRegions)
  }

  const handleFeatureIdChange = (index, value) => {
    const newId = value.trim().toUpperCase()
    const updatedFeatures = features.map((feature, idx) => (
      idx === index
        ? {
            ...feature,
            id: newId,
            properties: {
              ...(feature.properties || {}),
              id: newId,
              name: feature?.properties?.name || feature?.properties?.id || newId
            }
          }
        : feature
    ))
    onFeaturesChange(updatedFeatures)
    syncRegionsWithFeatures(updatedFeatures)
  }

  const handleFeatureNameChange = (index, value) => {
    const updatedFeatures = features.map((feature, idx) => (
      idx === index
        ? {
            ...feature,
            properties: {
              ...(feature.properties || {}),
              name: value,
              id: feature?.properties?.id || feature?.id
            }
          }
        : feature
    ))
    onFeaturesChange(updatedFeatures)
    const currentKey = normalizeRegionKey(features[index]?.id ?? features[index]?.properties?.id ?? `feature-${index}`)
    const updatedRegions = regions.map((region) => {
      const regionKey = normalizeRegionKey(region?.id ?? region?.label)
      if (regionKey === currentKey && value) {
        return { ...region, label: value }
      }
      return region
    })
    onRegionsChange(updatedRegions)
  }

  const handleImportFromFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(loadEvent.target.result)
        const extracted = extractFeaturesFromGeoJson(parsed)
        if (!extracted.length) {
          setUploadError('Die Datei enthält keine GeoJSON-Features.')
          return
        }
        const sanitized = extracted.map((feature, index) => sanitizeFeature(feature, feature?.id ?? `feature-${index}`, feature?.properties?.name))
        onFeaturesChange(sanitized)
        syncRegionsWithFeatures(sanitized)
        setUploadError(null)
      } catch (error) {
        console.error(error)
        setUploadError('GeoJSON konnte nicht gelesen werden. Bitte valide GeoJSON-Datei verwenden.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleClearFeatures = () => {
    onFeaturesChange([])
  }

  const handleResetRegions = () => {
    const derived = features.length
      ? features.map((feature, index) => createRegionFromFeature(feature, index))
      : []
    onRegionsChange(derived)
  }

  const stats = useMemo(() => {
    if (!regions.length) return null
    const numericValues = regions.map((region) => toNumber(region.value)).filter((value) => Number.isFinite(value))
    if (!numericValues.length) return null
    const min = Math.min(...numericValues)
    const max = Math.max(...numericValues)
    const avg = numericValues.reduce((acc, value) => acc + value, 0) / numericValues.length
    return {
      min,
      max,
      avg: avg.toFixed(1)
    }
  }, [regions])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-dark-textLight flex items-center gap-2">
          <FiMap size={16} />
          Choropleth Datenquellen
        </label>
        <button
          type="button"
          onClick={() => setShowHelper(!showHelper)}
          className="text-dark-accent1 hover:text-dark-accent2 text-sm flex items-center gap-1"
        >
          <FiAlertCircle size={16} />
          {showHelper ? 'Hilfe ausblenden' : 'Hilfe anzeigen'}
        </button>
      </div>

      {showHelper && (
        <div className="bg-dark-accent1/10 border border-dark-accent1/30 rounded-lg p-4 text-sm text-dark-textLight space-y-2">
          <p className="font-medium">So funktioniert die Choropleth-Karte:</p>
          <ul className="list-disc list-inside text-dark-textGray space-y-1">
            <li>Jede Region benötigt eine ID, einen Namen und einen Wert.</li>
            <li>Die IDs müssen mit den GeoJSON-Features übereinstimmen.</li>
            <li>GeoJSON-Features definieren die Umrisse der Regionen. Du kannst Vorlagen auswählen oder eigene GeoJSON-Dateien importieren.</li>
            <li>Werte steuern die Farbintensität. Höhere Werte = kräftigere Farben.</li>
          </ul>
        </div>
      )}

      <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight">GeoJSON-Daten</h3>
            <p className="text-xs text-dark-textGray">Wähle eine GeoJSON-Datei aus dem Ordner, um Features und Regionen zu laden.</p>
          </div>
          {selectedGeoJson && (
            <span className="text-xs px-3 py-1 rounded bg-dark-accent1/20 text-dark-accent1 border border-dark-accent1/40">
              Geladen: {GEOJSON_FILES.find(f => f.filename === selectedGeoJson)?.label || selectedGeoJson}
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedGeoJson}
            onChange={(e) => handleLoadGeoJson(e.target.value)}
            disabled={isLoadingGeoJson}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-700 bg-dark-bg text-dark-textLight text-sm focus:border-dark-accent1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">GeoJSON-Datei auswählen...</option>
            {GEOJSON_FILES.map((file) => (
              <option key={file.filename} value={file.filename}>
                {file.label}
              </option>
            ))}
          </select>
          {isLoadingGeoJson && (
            <span className="text-xs text-dark-textGray">Lädt...</span>
          )}
        </div>
      </div>

      <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight">GeoJSON-Features ({featureStats.count})</h3>
            <p className="text-xs text-dark-textGray">{featureStats.points} Koordinatenpunkte insgesamt</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-700 rounded text-xs text-dark-textLight cursor-pointer hover:border-dark-accent1">
              <FiUpload />
              GeoJSON importieren
              <input type="file" accept=".json,.geojson" className="hidden" onChange={handleImportFromFile} />
            </label>
            <button
              type="button"
              onClick={handleAddFeature}
              className="px-3 py-2 rounded border border-gray-700 text-xs text-dark-textLight hover:border-dark-accent1"
            >
              <FiPlus className="inline mr-1" /> Placeholder
            </button>
            <button
              type="button"
              onClick={handleClearFeatures}
              disabled={!features.length}
              className="px-3 py-2 rounded border border-red-900/60 text-xs text-red-200 hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiTrash2 className="inline mr-1" /> Alle Features löschen
            </button>
          </div>
        </div>
        {uploadError && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded px-3 py-2">{uploadError}</div>
        )}
        {features.length === 0 ? (
          <div className="text-sm text-dark-textGray bg-dark-bg rounded-lg p-4 text-center">
            Keine GeoJSON-Features vorhanden. Wähle eine Vorlage oder importiere eigene GeoJSON-Daten.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {features.map((feature, index) => {
              const key = normalizeRegionKey(feature?.id ?? feature?.properties?.id ?? `feature-${index}`)
              const summary = summarizeFeature(feature)
              return (
                <div key={index} className="grid grid-cols-12 gap-2 bg-dark-bg border border-gray-700 rounded-lg p-3">
                  <div className="col-span-3">
                    <label className="block text-[11px] text-dark-textGray mb-1">ID</label>
                    <input
                      type="text"
                      value={feature?.id || ''}
                      onChange={(event) => handleFeatureIdChange(index, event.target.value)}
                      className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-[11px] text-dark-textGray mb-1">Name</label>
                    <input
                      type="text"
                      value={feature?.properties?.name || ''}
                      onChange={(event) => handleFeatureNameChange(index, event.target.value)}
                      className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-4 flex items-end text-[11px] text-dark-textGray">
                    <div className="bg-dark-sidebar border border-gray-700 rounded px-2 py-1 w-full">
                      {summary.rings || 0} Ringe • {summary.points || 0} Punkte
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="p-2 text-dark-textGray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Feature entfernen"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  <div className="col-span-12 text-[11px] text-dark-textGray">
                    Zugeordnete Regionen-ID: <span className="text-dark-textLight font-medium">{key}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight">Regionen ({regions.length})</h3>
            <p className="text-xs text-dark-textGray">Bearbeite Werte für jede Region. IDs werden automatisch angepasst.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetRegions}
              className="px-3 py-2 text-xs rounded border border-gray-700 text-dark-textLight hover:border-dark-accent1"
            >
              <FiRefreshCw className="inline mr-1" /> Mit Features synchronisieren
            </button>
            <button
              type="button"
              onClick={handleAddRegion}
              className="px-3 py-2 text-xs rounded bg-dark-accent1 hover:bg-dark-accent2 text-white"
            >
              <FiPlus className="inline mr-1" /> Region
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 bg-dark-bg border border-gray-700 rounded-lg p-3 text-sm text-dark-textLight">
            <div>
              <span className="text-dark-textGray">Min</span>
              <div className="font-semibold">{stats.min}</div>
            </div>
            <div>
              <span className="text-dark-textGray">Max</span>
              <div className="font-semibold">{stats.max}</div>
            </div>
            <div>
              <span className="text-dark-textGray">Durchschnitt</span>
              <div className="font-semibold">{stats.avg}</div>
            </div>
          </div>
        )}

        {regions.length === 0 ? (
          <div className="text-sm text-dark-textGray bg-dark-bg rounded-lg p-4 text-center">
            Noch keine Regionen definiert. Synchronisiere mit Features oder füge manuell Regionen hinzu.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[11px] text-dark-textLight px-2 font-medium">
              <div className="col-span-2">ID</div>
              <div className="col-span-5">Label</div>
              <div className="col-span-4">Wert</div>
              <div className="col-span-1" />
            </div>
            {regions.map((region, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center bg-dark-bg border border-gray-700 rounded-lg p-3">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={region.id}
                    onChange={(event) => handleRegionIdChange(index, event.target.value)}
                    className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="text"
                    value={region.label}
                    onChange={(event) => handleRegionLabelChange(index, event.target.value)}
                    className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    value={region.value}
                    onChange={(event) => handleRegionValueChange(index, event.target.value)}
                    className="w-full px-2 py-1 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRegion(index)}
                    className="p-2 text-dark-textGray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    title="Region entfernen"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

ChoroplethEditor.propTypes = {
  regions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })),
  features: PropTypes.arrayOf(PropTypes.object),
  onRegionsChange: PropTypes.func.isRequired,
  onFeaturesChange: PropTypes.func
}

ChoroplethEditor.defaultProps = {
  features: [],
  onFeaturesChange: () => {}
}
