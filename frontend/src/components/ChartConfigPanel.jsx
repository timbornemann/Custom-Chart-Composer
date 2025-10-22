import { useState } from 'react'
import DatasetEditor from './DatasetEditor'
import PointEditor from './PointEditor'
import SimpleDataEditor from './SimpleDataEditor'
import ColorListEditor from './ColorListEditor'
import RangeBarEditor from './RangeBarEditor'
import HeatmapEditor from './HeatmapEditor'
import { useExport } from '../hooks/useExport'

export default function ChartConfigPanel({ chartType, config, onConfigChange, chartRef, onResetData, onClearData }) {
  const [activeTab, setActiveTab] = useState('data')

  if (!chartType) {
    return (
      <div className="bg-dark-secondary rounded-2xl shadow-lg p-6">
        <p className="text-dark-textGray">Kein Diagrammtyp ausgewählt</p>
      </div>
    )
  }

  return (
    <div className="bg-dark-secondary rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-dark-textLight mb-4">Konfiguration</h2>
      
      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'data'
              ? 'text-dark-accent1 border-b-2 border-dark-accent1'
              : 'text-dark-textGray hover:text-dark-textLight'
          }`}
        >
          Daten
        </button>
        <button
          onClick={() => setActiveTab('styling')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'styling'
              ? 'text-dark-accent1 border-b-2 border-dark-accent1'
              : 'text-dark-textGray hover:text-dark-textLight'
          }`}
        >
          Styling
        </button>
        <button
          onClick={() => setActiveTab('options')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'options'
              ? 'text-dark-accent1 border-b-2 border-dark-accent1'
              : 'text-dark-textGray hover:text-dark-textLight'
          }`}
        >
          Optionen
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'export'
              ? 'text-dark-accent1 border-b-2 border-dark-accent1'
              : 'text-dark-textGray hover:text-dark-textLight'
          }`}
        >
          Export
        </button>
      </div>

      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {activeTab === 'data' && <DataTab chartType={chartType} config={config} onConfigChange={onConfigChange} onResetData={onResetData} onClearData={onClearData} />}
        {activeTab === 'styling' && <StylingTab config={config} onConfigChange={onConfigChange} />}
        {activeTab === 'options' && <OptionsTab chartType={chartType} config={config} onConfigChange={onConfigChange} />}
        {activeTab === 'export' && <ExportTab chartType={chartType} config={config} chartRef={chartRef} onConfigChange={onConfigChange} />}
      </div>
    </div>
  )
}

function DataTab({ config, onConfigChange, chartType, onResetData, onClearData }) {
  // Bestimme welcher Input-Typ benötigt wird
  const needsScatterBubbleInput = ['scatter', 'bubble', 'matrix'].includes(chartType?.id)
  const needsRangeBarInput = chartType?.id === 'rangeBar'
  const needsHeatmapInput = chartType?.id === 'heatmap'
  const needsDatasetInput = [
    'stackedBar', 'multiLine', 'mixed', 'groupedBar', 'percentageBar',
    'segmentedBar', 'nestedDonut', 'smoothLine', 'dashedLine', 'curvedArea'
  ].includes(chartType?.id)

  const handleClearAllData = () => {
    if (window.confirm('Möchten Sie wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      onClearData()
    }
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-dark-textLight mb-2">
          Titel
        </label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onConfigChange({ title: e.target.value })}
          placeholder="Diagrammtitel (optional)"
          className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
        />
      </div>

      {needsRangeBarInput ? (
        <>
          <RangeBarEditor
            labels={config.labels || []}
            datasets={config.datasets || []}
            onLabelsChange={(labels) => onConfigChange({ labels })}
            onDatasetsChange={(datasets) => onConfigChange({ datasets })}
          />
          
          {/* Daten-Management Buttons */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={onResetData}
                className="px-3 py-1.5 text-xs font-medium text-dark-textGray hover:text-dark-textLight bg-dark-bg hover:bg-gray-800 rounded-md transition-all flex items-center space-x-1.5 border border-gray-700"
                title="Beispieldaten laden"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Beispieldaten</span>
              </button>
              <button
                onClick={handleClearAllData}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-dark-bg hover:bg-red-950 rounded-md transition-all flex items-center space-x-1.5 border border-red-900 hover:border-red-800"
                title="Alle Daten löschen"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Alle löschen</span>
              </button>
            </div>
          </div>
        </>
      ) : needsHeatmapInput ? (
        <>
          <HeatmapEditor
            datasets={config.datasets || []}
            onDatasetsChange={(datasets) => onConfigChange({ datasets })}
          />
          
          {/* Daten-Management Buttons */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={onResetData}
                className="px-3 py-1.5 text-xs font-medium text-dark-textGray hover:text-dark-textLight bg-dark-bg hover:bg-gray-800 rounded-md transition-all flex items-center space-x-1.5 border border-gray-700"
                title="Beispieldaten laden"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Beispieldaten</span>
              </button>
              <button
                onClick={handleClearAllData}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-dark-bg hover:bg-red-950 rounded-md transition-all flex items-center space-x-1.5 border border-red-900 hover:border-red-800"
                title="Alle Daten löschen"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Alle löschen</span>
              </button>
            </div>
          </div>
        </>
      ) : needsDatasetInput ? (
        <>
          <DatasetEditor
            datasets={config.datasets || []}
            labels={config.labels || []}
            onDatasetsChange={(datasets) => onConfigChange({ datasets })}
            onLabelsChange={(labels) => onConfigChange({ labels })}
          />
          
          {/* Daten-Management Buttons */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={onResetData}
                className="px-3 py-1.5 text-xs font-medium text-dark-textGray hover:text-dark-textLight bg-dark-bg hover:bg-gray-800 rounded-md transition-all flex items-center space-x-1.5 border border-gray-700"
                title="Beispieldaten laden"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Beispieldaten</span>
              </button>
              <button
                onClick={handleClearAllData}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-dark-bg hover:bg-red-950 rounded-md transition-all flex items-center space-x-1.5 border border-red-900 hover:border-red-800"
                title="Alle Daten löschen"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Alle löschen</span>
              </button>
            </div>
          </div>
        </>
      ) : needsScatterBubbleInput ? (
        <>
          <div>
            <label className="block text-sm font-medium text-dark-textLight mb-2">
              Label
            </label>
            <input
              type="text"
              value={config.labels?.[0] || ''}
              onChange={(e) => onConfigChange({ labels: [e.target.value] })}
              placeholder="z.B. Datenpunkte"
              className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
            />
          </div>
          <PointEditor
            points={config.values || []}
            onPointsChange={(values) => onConfigChange({ values })}
            isBubble={['bubble', 'matrix'].includes(chartType?.id)}
          />
          
          {/* Daten-Management Buttons */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={onResetData}
                className="px-3 py-1.5 text-xs font-medium text-dark-textGray hover:text-dark-textLight bg-dark-bg hover:bg-gray-800 rounded-md transition-all flex items-center space-x-1.5 border border-gray-700"
                title="Beispieldaten laden"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Beispieldaten</span>
              </button>
              <button
                onClick={handleClearAllData}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-dark-bg hover:bg-red-950 rounded-md transition-all flex items-center space-x-1.5 border border-red-900 hover:border-red-800"
                title="Alle Daten löschen"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Alle löschen</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <SimpleDataEditor
            labels={config.labels || []}
            values={config.values || []}
            onLabelsChange={(labels) => onConfigChange({ labels })}
            onValuesChange={(values) => onConfigChange({ values })}
          />

          <div>
            <label className="block text-sm font-medium text-dark-textLight mb-2">
              Datensatz-Label
            </label>
            <input
              type="text"
              value={config.datasetLabel || ''}
              onChange={(e) => onConfigChange({ datasetLabel: e.target.value })}
              placeholder="z.B. Verkaufszahlen"
              className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
            />
          </div>
        </>
      )}

      {/* Daten-Management Buttons */}
      <div className="pt-4 mt-4 border-t border-gray-700">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={onResetData}
            className="px-3 py-1.5 text-xs font-medium text-dark-textGray hover:text-dark-textLight bg-dark-bg hover:bg-gray-800 rounded-md transition-all flex items-center space-x-1.5 border border-gray-700"
            title="Beispieldaten laden"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Beispieldaten</span>
          </button>
          <button
            onClick={handleClearAllData}
            className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-dark-bg hover:bg-red-950 rounded-md transition-all flex items-center space-x-1.5 border border-red-900 hover:border-red-800"
            title="Alle Daten löschen"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Alle löschen</span>
          </button>
        </div>
      </div>
    </>
  )
}

function StylingTab({ config, onConfigChange }) {
  const presetColors = [
    ['#4ADE80', '#22D3EE', '#F472B6', '#FBBF24', '#A78BFA'],
    ['#EF4444', '#3B82F6', '#FBBF24', '#10B981', '#A78BFA'],
    ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'],
    ['#06B6D4', '#8B5CF6', '#F43F5E', '#FBBF24', '#10B981']
  ]

  const backgroundPresets = [
    { name: 'Dunkel', value: '#0F172A' },
    { name: 'Grau', value: '#1E293B' },
    { name: 'Schwarz', value: '#000000' },
    { name: 'Weiß', value: '#FFFFFF' },
    { name: 'Transparent', value: 'transparent' }
  ]

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-dark-textLight mb-3">
          Farbpalette
        </label>
        <div className="grid grid-cols-2 gap-3">
          {presetColors.map((colors, idx) => (
            <button
              key={idx}
              onClick={() => onConfigChange({ colors })}
              className="flex space-x-1 p-2 bg-dark-bg rounded-lg hover:bg-gray-800 transition-all"
            >
              {colors.map((color, i) => (
                <div key={i} className="w-8 h-8 rounded" style={{ backgroundColor: color }} />
              ))}
            </button>
          ))}
        </div>
      </div>

      <ColorListEditor
        colors={config.colors}
        onColorsChange={(colors) => onConfigChange({ colors })}
      />

      <div>
        <label className="block text-sm font-medium text-dark-textLight mb-3">
          Hintergrundfarbe
        </label>
        <div className="grid grid-cols-5 gap-2">
          {backgroundPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onConfigChange({ backgroundColor: preset.value })}
              className={`p-3 rounded-lg border-2 transition-all ${
                config.backgroundColor === preset.value
                  ? 'border-dark-accent1'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div 
                className="w-full h-8 rounded" 
                style={{ 
                  backgroundColor: preset.value === 'transparent' ? '#fff' : preset.value,
                  backgroundImage: preset.value === 'transparent' 
                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                    : 'none',
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 5px 5px'
                }} 
              />
              <span className="text-xs text-dark-textGray mt-1 block">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function OptionsTab({ chartType, config, onConfigChange }) {
  const handleOptionChange = (key, value) => {
    onConfigChange({
      options: {
        ...config.options,
        [key]: value
      }
    })
  }

  const schema = chartType.configSchema.options || {}

  return (
    <div className="space-y-4">
      {Object.entries(schema).map(([key, field]) => {
        if (field.type === 'boolean') {
          return (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm font-medium text-dark-textLight">
                {formatLabel(key)}
              </label>
              <button
                onClick={() => handleOptionChange(key, !config.options?.[key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.options?.[key] ? 'bg-dark-accent1' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.options?.[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )
        }

        if (field.type === 'number') {
          return (
            <div key={key}>
              <label className="block text-sm font-medium text-dark-textLight mb-2">
                {formatLabel(key)}
              </label>
              <input
                type="number"
                value={config.options?.[key] ?? field.default}
                onChange={(e) => handleOptionChange(key, Number(e.target.value))}
                className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
              />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

function ExportTab({ chartType, config, chartRef, onConfigChange }) {
  const [format, setFormat] = useState('png')
  const [transparent, setTransparent] = useState(false)
  const [exportWidth, setExportWidth] = useState(1920)
  const [exportHeight, setExportHeight] = useState(1080)
  const [importError, setImportError] = useState(null)
  const { handleExport, exporting, error } = useExport()

  const formats = [
    { value: 'png', label: 'PNG', icon: '🖼️' },
    { value: 'jpeg', label: 'JPEG', icon: '📷' },
    { value: 'svg', label: 'SVG', icon: '✨' },
    { value: 'html', label: 'HTML', icon: '🌐' }
  ]

  const onExport = () => {
    if (!chartRef || !chartRef.current) {
      // Show a more helpful error
      return
    }
    handleExport(chartType, config, format, transparent, chartRef, exportWidth, exportHeight)
  }

  const handleExportConfig = () => {
    const configData = {
      chartType: chartType.id,
      config: config,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0'
    }
    
    const dataStr = JSON.stringify(configData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chart-config-${chartType.id}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportConfig = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result)
        
        // Validate structure
        if (!importedData.config) {
          throw new Error('Ungültiges Konfigurationsformat: "config" fehlt')
        }

        // Optional: Check if chart type matches
        if (importedData.chartType && importedData.chartType !== chartType.id) {
          const confirmImport = window.confirm(
            `Diese Konfiguration wurde für "${importedData.chartType}" erstellt, aber Sie bearbeiten "${chartType.id}". Trotzdem importieren?`
          )
          if (!confirmImport) return
        }

        // Apply the imported config
        Object.keys(importedData.config).forEach(key => {
          onConfigChange({ [key]: importedData.config[key] })
        })
        
        alert('Konfiguration erfolgreich importiert!')
      } catch (err) {
        setImportError(`Fehler beim Importieren: ${err.message}`)
      }
    }
    reader.onerror = () => {
      setImportError('Fehler beim Lesen der Datei')
    }
    reader.readAsText(file)
    
    // Reset input so same file can be imported again
    event.target.value = ''
  }

  const presetResolutions = [
    { name: 'HD', width: 1280, height: 720 },
    { name: 'Full HD', width: 1920, height: 1080 },
    { name: '4K', width: 3840, height: 2160 },
    { name: 'Quadrat', width: 1080, height: 1080 }
  ]

  const isChartReady = chartRef && chartRef.current

  return (
    <div className="space-y-6">
      <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-dark-textLight mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Konfiguration als JSON
        </h3>
        
        <div className="space-y-3">
          <p className="text-sm text-dark-textGray mb-4">
            Exportieren Sie Ihre Diagramm-Konfiguration als JSON-Datei, um sie zu sichern oder mit anderen zu teilen.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportConfig}
              className="px-4 py-3 bg-dark-accent1 hover:bg-opacity-90 text-white font-medium rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>JSON exportieren</span>
            </button>
            
            <label className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>JSON importieren</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportConfig}
                className="hidden"
              />
            </label>
          </div>

          {importError && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {importError}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-dark-textLight mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Diagramm als Bild
        </h3>
      </div>

      {!isChartReady && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm">
          ℹ️ Warten Sie, bis das Diagramm vollständig geladen ist, bevor Sie exportieren.
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-dark-textLight mb-3">
          Format wählen
        </label>
        <div className="grid grid-cols-4 gap-2">
          {formats.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => setFormat(fmt.value)}
              className={`px-4 py-3 rounded-xl transition-all ${
                format === fmt.value
                  ? 'bg-gradient-to-r from-dark-accent1 to-dark-accent2 text-white shadow-lg'
                  : 'bg-dark-bg text-dark-textGray hover:bg-gray-800 hover:text-dark-textLight'
              }`}
            >
              <div className="text-2xl mb-1">{fmt.icon}</div>
              <div className="text-xs font-medium">{fmt.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-textLight mb-3">
          Export-Auflösung
        </label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {presetResolutions.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setExportWidth(preset.width)
                setExportHeight(preset.height)
              }}
              className={`px-3 py-2 rounded-lg transition-all text-xs font-medium ${
                exportWidth === preset.width && exportHeight === preset.height
                  ? 'bg-dark-accent1 text-white'
                  : 'bg-dark-bg text-dark-textGray hover:bg-gray-800 hover:text-dark-textLight'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dark-textGray mb-1 block">Breite (px)</label>
            <input
              type="number"
              value={exportWidth}
              onChange={(e) => setExportWidth(Number(e.target.value))}
              min="100"
              max="7680"
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-dark-textGray mb-1 block">Höhe (px)</label>
            <input
              type="number"
              value={exportHeight}
              onChange={(e) => setExportHeight(Number(e.target.value))}
              min="100"
              max="7680"
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {(format === 'png' || format === 'svg') && (
        <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
          <label className="text-sm font-medium text-dark-textLight">
            Transparenter Hintergrund
          </label>
          <button
            onClick={() => setTransparent(!transparent)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              transparent ? 'bg-dark-accent1' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                transparent ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={onExport}
        disabled={exporting || !chartType || !isChartReady}
        className="w-full px-6 py-4 bg-gradient-to-r from-dark-accent1 to-dark-accent2 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {exporting ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Exportiere...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Diagramm exportieren</span>
          </>
        )}
      </button>

      <div className="text-xs text-dark-textGray text-center">
        Das Diagramm wird als {format.toUpperCase()} mit {exportWidth}×{exportHeight}px exportiert
      </div>
    </div>
  )
}

function formatLabel(key) {
  const labels = {
    showLegend: 'Legende anzeigen',
    showGrid: 'Gitter anzeigen',
    showPoints: 'Punkte anzeigen',
    smooth: 'Glatte Linie',
    fill: 'Bereich füllen',
    horizontal: 'Horizontal',
    showPercentage: 'Prozente anzeigen',
    cutout: 'Donut-Größe (%)',
    stacked: 'Gestapelt',
    smoothing: 'Glättung',
    rotation: 'Rotation (Grad)',
    circumference: 'Umfang (Grad)',
    showNeedle: 'Nadel anzeigen',
    showLabels: 'Labels anzeigen',
    showValues: 'Werte anzeigen',
    showPercentages: 'Prozente anzeigen',
    showConnectors: 'Verbindungen anzeigen',
    pointSize: 'Punktgröße',
    xAxisLabel: 'X-Achsen-Label',
    yAxisLabel: 'Y-Achsen-Label'
  }
  return labels[key] || key
}

