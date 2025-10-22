import { useState } from 'react'

export default function ChartConfigPanel({ chartType, config, onConfigChange }) {
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
      </div>

      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {activeTab === 'data' && <DataTab chartType={chartType} config={config} onConfigChange={onConfigChange} />}
        {activeTab === 'styling' && <StylingTab config={config} onConfigChange={onConfigChange} />}
        {activeTab === 'options' && <OptionsTab chartType={chartType} config={config} onConfigChange={onConfigChange} />}
      </div>
    </div>
  )
}

function DataTab({ config, onConfigChange, chartType }) {
  const handleArrayChange = (field, value) => {
    if (!value || value.trim() === '') {
      onConfigChange({ [field]: [] })
      return
    }
    
    const array = value.split(',').map(item => {
      const trimmed = item.trim()
      // Nur zu Zahl konvertieren wenn es wirklich eine Zahl ist
      const num = Number(trimmed)
      return (trimmed !== '' && !isNaN(num)) ? num : trimmed
    }).filter(item => item !== '') // Leere Einträge entfernen
    
    onConfigChange({ [field]: array })
  }

  const handleScatterBubbleData = (value) => {
    try {
      if (!value || value.trim() === '') {
        onConfigChange({ values: [] })
        return
      }
      
      // Parse JSON format: [{x: 10, y: 20}, {x: 15, y: 25}] oder mit r für Bubble
      const parsed = JSON.parse(value)
      onConfigChange({ values: parsed })
    } catch (e) {
      // Wenn JSON ungültig, nichts tun oder Fehler anzeigen
      console.warn('Ungültiges Format:', e)
    }
  }

  const handleDatasetChange = (value) => {
    try {
      if (!value || value.trim() === '') {
        onConfigChange({ datasets: [] })
        return
      }
      
      const parsed = JSON.parse(value)
      onConfigChange({ datasets: parsed })
    } catch (e) {
      console.warn('Ungültiges Format:', e)
    }
  }

  // Bestimme welcher Input-Typ benötigt wird
  const needsScatterBubbleInput = ['scatter', 'bubble'].includes(chartType?.id)
  const needsDatasetInput = ['stackedBar', 'multiLine', 'mixed', 'groupedBar', 'percentageBar'].includes(chartType?.id)

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

      {needsDatasetInput ? (
        <>
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-200">
                <strong>Mehrere Datensätze erforderlich.</strong> Verwenden Sie JSON-Format mit Array von Objekten.
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-textLight mb-2">
              Beschriftungen (kommagetrennt)
            </label>
            <input
              type="text"
              value={config.labels?.join(', ') || ''}
              onChange={(e) => handleArrayChange('labels', e.target.value)}
              placeholder="z.B. Januar, Februar, März"
              className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-dark-textLight">
                Datensätze (JSON-Format)
              </label>
              <button
                onClick={() => {
                  const example = chartType?.configSchema?.datasets?.default || []
                  onConfigChange({ datasets: example })
                }}
                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
              >
                Beispiel laden
              </button>
            </div>
            <textarea
              value={JSON.stringify(config.datasets || [], null, 2)}
              onChange={(e) => handleDatasetChange(e.target.value)}
              placeholder='[{"label":"Serie 1","data":[10,20,30],"backgroundColor":"#3B82F6"}]'
              rows={8}
              className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all font-mono text-sm"
            />
            <p className="text-xs text-dark-textGray mt-1">
              💡 Format: Array von Objekten mit label, data, backgroundColor
            </p>
          </div>
        </>
      ) : needsScatterBubbleInput ? (
        <>
          <div className="bg-purple-500/10 border border-purple-500/50 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-purple-200">
                <strong>Koordinaten erforderlich.</strong> {chartType?.id === 'bubble' ? 'Jeder Punkt benötigt x, y und r (Radius).' : 'Jeder Punkt benötigt x und y Koordinaten.'}
              </div>
            </div>
          </div>
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
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-dark-textLight">
                Datenpunkte (JSON-Format)
              </label>
              <button
                onClick={() => {
                  const example = chartType?.configSchema?.values?.default || []
                  onConfigChange({ values: example })
                }}
                className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-all"
              >
                Beispiel laden
              </button>
            </div>
            <textarea
              value={JSON.stringify(config.values || [], null, 2)}
              onChange={(e) => handleScatterBubbleData(e.target.value)}
              placeholder={chartType?.id === 'bubble' 
                ? '[{"x":20,"y":30,"r":15},{"x":40,"y":10,"r":10}]'
                : '[{"x":10,"y":20},{"x":15,"y":35},{"x":20,"y":30}]'}
              rows={8}
              className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all font-mono text-sm"
            />
            <p className="text-xs text-dark-textGray mt-1">
              💡 {chartType?.id === 'bubble' ? 'Format: x, y, r (Radius)' : 'Format: x, y Koordinaten'}
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-dark-textLight mb-2">
              Beschriftungen (kommagetrennt)
            </label>
            <input
              type="text"
              value={config.labels?.join(', ') || ''}
              onChange={(e) => handleArrayChange('labels', e.target.value)}
              placeholder="z.B. Januar, Februar, März"
              className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-textLight mb-2">
              Werte (kommagetrennt)
            </label>
            <input
              type="text"
              value={Array.isArray(config.values) ? config.values.join(', ') : ''}
              onChange={(e) => handleArrayChange('values', e.target.value)}
              placeholder="z.B. 10, 20, 30"
              className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
            />
            <p className="text-xs text-dark-textGray mt-1">
              💡 Nur Zahlen eingeben, mit Komma trennen
            </p>
          </div>

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

  const handleColorChange = (value) => {
    if (!value || value.trim() === '') {
      onConfigChange({ colors: [] })
      return
    }
    const colors = value.split(',').map(c => c.trim()).filter(c => c !== '')
    onConfigChange({ colors })
  }

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

      <div>
        <label className="block text-sm font-medium text-dark-textLight mb-2">
          Benutzerdefinierte Farben (kommagetrennt)
        </label>
        <input
          type="text"
          value={config.colors?.join(', ') || ''}
          onChange={(e) => handleColorChange(e.target.value)}
          placeholder="z.B. #FF0000, #00FF00, #0000FF"
          className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all font-mono text-sm"
        />
        <p className="text-xs text-dark-textGray mt-1">
          💡 Hex-Farben mit # verwenden
        </p>
      </div>

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

      <div>
        <label className="block text-sm font-medium text-dark-textLight mb-2">
          Breite (px)
        </label>
        <input
          type="number"
          value={config.width || 800}
          onChange={(e) => onConfigChange({ width: Number(e.target.value) })}
          className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-textLight mb-2">
          Höhe (px)
        </label>
        <input
          type="number"
          value={config.height || 600}
          onChange={(e) => onConfigChange({ height: Number(e.target.value) })}
          className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
        />
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
    stacked: 'Gestapelt'
  }
  return labels[key] || key
}

