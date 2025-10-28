import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import DatasetEditor from './DatasetEditor'
import PointEditor from './PointEditor'
import SimpleDataEditor from './SimpleDataEditor'
import ColorListEditor from './ColorListEditor'
import RangeBarEditor from './RangeBarEditor'
import HeatmapEditor from './HeatmapEditor'
import CalendarHeatmapEditor from './CalendarHeatmapEditor'
import BubbleDatasetEditor from './BubbleDatasetEditor'
import ScatterDatasetEditor from './ScatterDatasetEditor'
import CoordinateDatasetEditor from './CoordinateDatasetEditor'
import ConfirmModal from './ConfirmModal'
import ColorPaletteSelector from './ColorPaletteSelector'
import LabeledColorEditor from './LabeledColorEditor'
import BackgroundImageEditor from './BackgroundImageEditor'
import { useExport } from '../hooks/useExport'
import ExportPreviewModal from './ExportPreviewModal'

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
        {activeTab === 'data' && (
          <DataTab
            chartType={chartType}
            config={config}
            onConfigChange={onConfigChange}
            onResetData={onResetData}
            onClearData={onClearData}
          />
        )}
        {activeTab === 'styling' && (
          <StylingTab
            chartType={chartType}
            config={config}
            onConfigChange={onConfigChange}
          />
        )}
        {activeTab === 'options' && <OptionsTab chartType={chartType} config={config} onConfigChange={onConfigChange} />}
        {activeTab === 'export' && <ExportTab chartType={chartType} config={config} chartRef={chartRef} onConfigChange={onConfigChange} />}
      </div>
    </div>
  )
}

function DataTab({ chartType, config, onConfigChange, onResetData, onClearData }) {
  const [showClearModal, setShowClearModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  
  const schema = chartType?.configSchema || {}

  const labelsSchema = schema.labels
  const valuesSchema = schema.values
  const datasetsSchema = schema.datasets
  const datasetLabelSchema = schema.datasetLabel

  const defaultValues = Array.isArray(valuesSchema?.default) ? valuesSchema.default : []
  const defaultDatasets = Array.isArray(datasetsSchema?.default) ? datasetsSchema.default : []
  const sampleValue = defaultValues[0]
  const sampleDataset = defaultDatasets[0]
  const sampleDatasetEntry = Array.isArray(sampleDataset?.data) ? sampleDataset.data[0] : undefined

  const hasSimpleValues = Array.isArray(defaultValues) && sampleValue !== undefined && typeof sampleValue !== 'object'
  const hasPointValues = Array.isArray(defaultValues) && typeof sampleValue === 'object' && sampleValue !== null
  const isBubbleValues = hasPointValues && !!((config.values?.[0] ?? sampleValue)?.r || (config.values?.[0] ?? sampleValue)?.v)
  const isRangeDataset = Array.isArray(sampleDatasetEntry)
  const isCalendarHeatmapDataset = chartType?.id === 'calendarHeatmap' && sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'v' in sampleDatasetEntry
  const isHeatmapDataset = chartType?.id === 'heatmap' && sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'v' in sampleDatasetEntry
  const isBubbleDataset = sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'r' in sampleDatasetEntry && 'x' in sampleDatasetEntry && 'y' in sampleDatasetEntry
  const isScatterDataset = sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && !('r' in sampleDatasetEntry) && 'x' in sampleDatasetEntry && 'y' in sampleDatasetEntry && !('v' in sampleDatasetEntry)
  const isCoordinateDataset = sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'longitude' in sampleDatasetEntry && 'latitude' in sampleDatasetEntry
  const usesDatasetEditor = !!datasetsSchema && !isRangeDataset && !isHeatmapDataset && !isCalendarHeatmapDataset && !isBubbleDataset && !isScatterDataset && !isCoordinateDataset
  const usesSimpleEditor = !!labelsSchema && !!valuesSchema && hasSimpleValues
  const excludedKeys = ['title', 'labels', 'yLabels', 'values', 'datasets', 'datasetLabel', 'options', 'colors', 'backgroundColor', 'width', 'height']
  const additionalFields = Object.entries(schema).filter(([key]) => !excludedKeys.includes(key))

  const handleFieldChange = (key, value) => {
    onConfigChange({ [key]: value })
  }

  const renderDatasetEditor = () => {
    if (!datasetsSchema) return null

    if (isRangeDataset) {
      return (
        <RangeBarEditor
          labels={config.labels || []}
          datasets={config.datasets || []}
          onLabelsChange={(labels) => onConfigChange({ labels })}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
        />
      )
    }

    if (isHeatmapDataset) {
      return (
        <HeatmapEditor
          labels={config.labels || []}
          yLabels={config.yLabels || []}
          datasets={config.datasets || []}
          onLabelsChange={(labels) => onConfigChange({ labels })}
          onYLabelsChange={(yLabels) => onConfigChange({ yLabels })}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
        />
      )
    }

    if (isCalendarHeatmapDataset) {
      return (
        <CalendarHeatmapEditor
          datasets={config.datasets || []}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
        />
      )
    }

    if (isBubbleDataset) {
      return (
        <BubbleDatasetEditor
          datasets={config.datasets || []}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
        />
      )
    }

    if (isScatterDataset) {
      return (
        <ScatterDatasetEditor
          datasets={config.datasets || []}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
        />
      )
    }

    if (isCoordinateDataset) {
      return (
        <CoordinateDatasetEditor
          datasets={config.datasets || []}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
        />
      )
    }

    if (usesDatasetEditor) {
      return (
        <DatasetEditor
          datasets={config.datasets || []}
          labels={config.labels || []}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
          onLabelsChange={(labels) => onConfigChange({ labels })}
        />
      )
    }

    return null
  }

  const renderAdditionalField = (key, field) => {
    if (!field) return null

    const label = formatLabel(key)

    if (field.type === 'number') {
      return (
        <div key={key} className="space-y-2">
          <label className="block text-sm font-medium text-dark-textLight">
            {label}
          </label>
          {field.description && (
            <p className="text-xs text-dark-textGray">{field.description}</p>
          )}
          <input
            type="number"
            value={config[key] ?? field.default ?? 0}
            onChange={(e) => handleFieldChange(key, Number(e.target.value))}
            className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
          />
        </div>
      )
    }

    if (field.type === 'string') {
      return (
        <div key={key} className="space-y-2">
          <label className="block text-sm font-medium text-dark-textLight">
            {label}
          </label>
          {field.description && (
            <p className="text-xs text-dark-textGray">{field.description}</p>
          )}
          <input
            type="text"
            value={config[key] ?? field.default ?? ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg border border-gray-700 focus:border-dark-accent1 focus:outline-none transition-all"
          />
        </div>
      )
    }

    if (field.type === 'array') {
      const currentValue = Array.isArray(config[key])
        ? config[key]
        : Array.isArray(field.default)
          ? field.default
          : []

      const sampleValue = (() => {
        if (Array.isArray(currentValue) && currentValue.length > 0) {
          return currentValue.find((entry) => entry !== undefined)
        }
        if (Array.isArray(field.default) && field.default.length > 0) {
          return field.default.find((entry) => entry !== undefined)
        }
        return undefined
      })()

      const detectedType = typeof sampleValue
      const primitiveTypes = ['string', 'number', 'boolean']
      const isPrimitiveArray = sampleValue === undefined || primitiveTypes.includes(detectedType)

      if (isPrimitiveArray) {
        const itemType = detectedType === 'boolean' ? 'boolean' : detectedType === 'number' ? 'number' : 'string'
        return (
          <ArrayFieldEditor
            key={key}
            label={label}
            values={currentValue}
            onChange={(value) => handleFieldChange(key, value)}
            itemType={itemType}
            description={field.description}
          />
        )
      }

      return (
        <JsonFieldEditor
          key={key}
          label={label}
          value={currentValue}
          onChange={(value) => handleFieldChange(key, value)}
        />
      )
    }

    return null
  }

  const renderValueFields = () => {
    if (!valuesSchema) return null

    // Don't show values if using specialized dataset editors
    if (isBubbleDataset || isScatterDataset || isCoordinateDataset || isRangeDataset || isHeatmapDataset || isCalendarHeatmapDataset) {
      return null
    }

    if (hasPointValues) {
      return (
        <PointEditor
          points={config.values || []}
          onPointsChange={(values) => onConfigChange({ values })}
          isBubble={isBubbleValues}
        />
      )
    }

    if (hasSimpleValues) {
      return (
        <ArrayFieldEditor
          label="Werte"
          values={config.values || []}
          onChange={(values) => onConfigChange({ values })}
          itemType="number"
        />
      )
    }

    return (
      <JsonFieldEditor
        label="Werte"
        value={config.values || []}
        onChange={(values) => onConfigChange({ values })}
      />
    )
  }

  const renderLabelFields = () => {
    // Never show labels separately - they are managed within the editors
    // Labels are either:
    // 1. In SimpleDataEditor (for single dataset charts)
    // 2. In DatasetEditor (for multi-dataset charts)
    // 3. In specialized editors (Bubble, Scatter, Range, Heatmap)
    return null
  }

  return (
    <>
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={onClearData}
        title="Alle Daten löschen?"
        message="Möchten Sie wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={onResetData}
        title="Beispieldaten laden?"
        message="Die aktuellen Daten werden durch Beispieldaten ersetzt. Möchten Sie fortfahren?"
        confirmText="Beispieldaten laden"
        cancelText="Abbrechen"
        variant="info"
      />

      {schema.title && (
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
      )}

      <div className="pb-4 mb-4 border-b border-gray-700">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-3 py-1.5 text-xs font-medium text-dark-textGray hover:text-dark-textLight bg-dark-bg hover:bg-gray-800 rounded-md transition-all flex items-center space-x-1.5 border border-gray-700"
            title="Beispieldaten laden"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Beispieldaten</span>
          </button>
          <button
            onClick={() => setShowClearModal(true)}
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

      {usesSimpleEditor ? (
        <>
          <SimpleDataEditor
            labels={config.labels || []}
            values={config.values || []}
            onLabelsChange={(labels) => onConfigChange({ labels })}
            onValuesChange={(values) => onConfigChange({ values })}
          />
          {datasetLabelSchema && (
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
          )}
        </>
      ) : (
        <>
          {renderLabelFields()}
          {renderValueFields()}
          {datasetLabelSchema && !usesDatasetEditor && !usesSimpleEditor && (
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
          )}
          {renderDatasetEditor()}
        </>
      )}

      {additionalFields.map(([key, field]) => renderAdditionalField(key, field))}
    </>
  )
}

function StylingTab({ chartType, config, onConfigChange }) {
  const schema = chartType?.configSchema || {}
  const hasColors = !!schema.colors
  const hasBackground = !!schema.backgroundColor

  const backgroundPresets = [
    { name: 'Dunkel', value: '#0F172A' },
    { name: 'Grau', value: '#1E293B' },
    { name: 'Schwarz', value: '#000000' },
    { name: 'Weiß', value: '#FFFFFF' },
    { name: 'Hellgrau', value: '#F3F4F6' },
    { name: 'Transparent', value: 'transparent' }
  ]

  if (!hasColors && !hasBackground) {
    return (
      <div className="text-sm text-dark-textGray">
        Für diesen Diagrammtyp sind keine Styling-Optionen definiert.
      </div>
    )
  }

  // Determine which labels to use for color assignment
  const getLabelsForColors = () => {
    // For charts with datasets (multi-line, stacked bar, etc.)
    if (config.datasets && Array.isArray(config.datasets) && config.datasets.length > 0) {
      return config.datasets.map(ds => ds.label || 'Unbenannt')
    }
    // For simple charts (bar, pie, etc.)
    if (config.labels && Array.isArray(config.labels)) {
      return config.labels
    }
    return []
  }

  const colorLabels = getLabelsForColors()

  return (
    <div className="space-y-6">
      {hasColors && (
        <div className="space-y-4">
          {/* Color Palette Selector */}
          <ColorPaletteSelector
            selectedColors={config.colors}
            onSelectPalette={(colors) => onConfigChange({ colors })}
          />

          {/* Individual Color Assignment with Labels */}
          <div className="border-t border-gray-700 pt-4">
            <LabeledColorEditor
              labels={colorLabels}
              colors={config.colors}
              onColorsChange={(colors) => onConfigChange({ colors })}
              mode={colorLabels.length > 0 ? 'single' : 'multiple'}
            />
          </div>

          {/* Fallback: Manual color list editor if no labels */}
          {colorLabels.length === 0 && (
            <div className="border-t border-gray-700 pt-4">
              <ColorListEditor
                colors={config.colors}
                onColorsChange={(colors) => onConfigChange({ colors })}
              />
            </div>
          )}
        </div>
      )}

      {hasBackground && (
        <div className="border-t border-gray-700 pt-4">
          <label className="block text-sm font-medium text-dark-textLight mb-3">
            Hintergrundfarbe
          </label>
          <div className="text-xs text-dark-textGray mb-3 bg-dark-bg/50 rounded-lg p-3 flex items-start space-x-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Die Hintergrundfarbe wird beim Export des Diagramms verwendet und ist sichtbar, wenn das Hintergrundbild Lücken lässt.
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {backgroundPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onConfigChange({ backgroundColor: preset.value })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  config.backgroundColor === preset.value
                    ? 'border-dark-accent1 bg-dark-bg'
                    : 'border-gray-700 hover:border-gray-600 hover:bg-dark-bg'
                }`}
              >
                <div
                  className="w-full h-10 rounded border border-gray-600"
                  style={{
                    backgroundColor: preset.value === 'transparent' ? '#fff' : preset.value,
                    backgroundImage: preset.value === 'transparent'
                      ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                      : 'none',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 5px 5px'
                  }}
                />
                <span className="text-xs text-dark-textGray mt-2 block">{preset.name}</span>
              </button>
            ))}
          </div>
          
          {/* Custom color picker */}
          <div className="mt-3">
            <label className="text-xs text-dark-textGray mb-2 block">Benutzerdefinierte Farbe</label>
            <div className="flex items-center space-x-3 bg-dark-bg rounded-lg p-3 border border-gray-700">
              <input
                type="color"
                value={config.backgroundColor && config.backgroundColor !== 'transparent' ? config.backgroundColor : '#0F172A'}
                onChange={(e) => onConfigChange({ backgroundColor: e.target.value })}
                className="w-16 h-16 rounded cursor-pointer border-2 border-gray-600 hover:border-dark-accent1 transition-all"
              />
              <div className="flex-1">
                <div className="text-sm text-dark-textLight font-medium">Eigene Farbe wählen</div>
                <div className="text-xs text-dark-textGray font-mono">
                  {config.backgroundColor || '#0F172A'}
                </div>
              </div>
            </div>
          </div>

          {/* Background Image Editor */}
          <BackgroundImageEditor
            backgroundImage={config.backgroundImage}
            onBackgroundImageChange={(backgroundImage) => onConfigChange({ backgroundImage })}
          />
        </div>
      )}
    </div>
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
  const annotationSchema = schema.annotations
  const supportedChartTypes = [
    'bar', 'stackedBar', 'groupedBar', 'percentageBar', 'segmentedBar', 'waterfall', 'funnel', 'treemap', 'boxPlot', 'violin', 'candlestick', 'sankey',
    'line', 'area', 'multiLine', 'steppedLine', 'verticalLine', 'smoothLine', 'dashedLine', 'curvedArea',
    'scatter', 'bubble', 'matrix', 'calendarHeatmap', 'heatmap', 'mixed', 'rangeBar', 'horizontalBar', 'streamGraph'
  ]
  const showAnnotations = annotationSchema && supportedChartTypes.includes(chartType.id)
  const schemaEntries = Object.entries(schema).filter(([key]) => key !== 'annotations')

  // Aspect Ratio Presets
  const aspectRatioPresets = [
    { label: '16:9 (Widescreen)', value: 16/9 },
    { label: '4:3 (Standard)', value: 4/3 },
    { label: '1:1 (Quadratisch)', value: 1 },
    { label: '21:9 (Ultrawide)', value: 21/9 },
    { label: '3:2', value: 3/2 },
    { label: 'Automatisch', value: null }
  ]

  const getCurrentAspectRatio = () => {
    return config.options?.aspectRatio ?? null
  }

  const handleAspectRatioChange = (value) => {
    handleOptionChange('aspectRatio', value === 'null' ? null : parseFloat(value))
  }

  // Chart types that don't support custom aspect ratio
  const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'gauge', 'chord']
  const supportsAspectRatio = !noAspectRatioCharts.includes(chartType.id)
  const hasOptionFields = schemaEntries.length > 0

  return (
    <div className="space-y-4">
      {/* Global Aspect Ratio Option */}
      {supportsAspectRatio ? (
        <div className="p-4 bg-dark-bg rounded-lg border border-gray-700">
          <label className="block text-sm font-medium text-dark-textLight mb-2">
            Seitenverhältnis
          </label>
          <p className="text-xs text-dark-textGray mb-3">
            Bestimmt das Verhältnis von Breite zu Höhe des Diagramms
          </p>
        <select
          value={getCurrentAspectRatio() === null ? 'null' : getCurrentAspectRatio()}
          onChange={(e) => handleAspectRatioChange(e.target.value)}
          className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
        >
          {aspectRatioPresets.map((preset) => (
            <option key={preset.label} value={preset.value === null ? 'null' : preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
        
        {/* Custom Aspect Ratio */}
        {getCurrentAspectRatio() !== null && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-dark-textGray">Benutzerdefiniert</label>
              <span className="text-xs font-mono text-dark-accent1">
                {typeof getCurrentAspectRatio() === 'number' ? getCurrentAspectRatio().toFixed(2) : '1.00'}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={getCurrentAspectRatio() || 1}
              onChange={(e) => handleOptionChange('aspectRatio', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
            />
            <div className="flex justify-between text-xs text-dark-textGray mt-1">
              <span>Hoch (0.5)</span>
              <span>Breit (3.0)</span>
            </div>
          </div>
        )}
        </div>
      ) : (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-yellow-300 mb-1">Seitenverhältnis nicht verfügbar</div>
              <div className="text-xs text-yellow-200/80">
                Dieses Diagramm verwendet radiale/polare Skalen und unterstützt keine benutzerdefinierten Seitenverhältnisse.
              </div>
            </div>
          </div>
        </div>
      )}

      {showAnnotations && (
        <AnnotationEditor
          annotations={Array.isArray(config.options?.annotations)
            ? config.options.annotations
            : Array.isArray(annotationSchema.default)
              ? [...annotationSchema.default]
              : []}
          onChange={(value) => handleOptionChange('annotations', value)}
          chartType={chartType}
        />
      )}

      {/* Separator if there are additional options */}
      {hasOptionFields && (
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-dark-textLight mb-4">Diagrammspezifische Optionen</h3>
        </div>
      )}

      {!hasOptionFields && !showAnnotations && (
        <div className="text-sm text-dark-textGray bg-dark-bg/50 rounded-lg p-4 text-center">
          Keine weiteren diagrammspezifischen Optionen verfügbar.
        </div>
      )}
      {schemaEntries.map(([key, field]) => {
        // Boolean Toggle
        if (field.type === 'boolean') {
          return (
            <div key={key} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
              <div className="flex-1">
                <label className="text-sm font-medium text-dark-textLight block">
                  {formatLabel(key)}
                </label>
                {field.description && (
                  <p className="text-xs text-dark-textGray mt-0.5">{field.description}</p>
                )}
              </div>
              <button
                onClick={() => handleOptionChange(key, !config.options?.[key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${
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

        // Number Input with Range Slider
        if (field.type === 'number') {
          const value = config.options?.[key] ?? field.default
          const hasRange = field.min !== undefined && field.max !== undefined

          return (
            <div key={key} className="p-3 bg-dark-bg rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-dark-textLight">
                  {formatLabel(key)}
                </label>
                <span className="text-sm font-mono text-dark-accent1">{value}</span>
              </div>
              {field.description && (
                <p className="text-xs text-dark-textGray mb-2">{field.description}</p>
              )}
              {hasRange ? (
                <div className="space-y-2">
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step || 1}
                    value={value}
                    onChange={(e) => handleOptionChange(key, Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                  />
                  <div className="flex justify-between text-xs text-dark-textGray">
                    <span>{field.min}</span>
                    <span>{field.max}</span>
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  value={value}
                  min={field.min}
                  max={field.max}
                  step={field.step || 1}
                  onChange={(e) => handleOptionChange(key, Number(e.target.value))}
                  className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
                />
              )}
            </div>
          )
        }

        // Select Dropdown
        if (field.type === 'select' && field.options) {
          return (
            <div key={key} className="p-3 bg-dark-bg rounded-lg border border-gray-700">
              <label className="block text-sm font-medium text-dark-textLight mb-2">
                {formatLabel(key)}
              </label>
              {field.description && (
                <p className="text-xs text-dark-textGray mb-2">{field.description}</p>
              )}
              <select
                value={config.options?.[key] ?? field.default ?? ''}
                onChange={(e) => handleOptionChange(key, e.target.value)}
                className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )
        }

        // Text Input
        if (field.type === 'string') {
          return (
            <div key={key} className="p-3 bg-dark-bg rounded-lg border border-gray-700">
              <label className="block text-sm font-medium text-dark-textLight mb-2">
                {formatLabel(key)}
              </label>
              {field.description && (
                <p className="text-xs text-dark-textGray mb-2">{field.description}</p>
              )}
              <input
                type="text"
                value={config.options?.[key] ?? field.default ?? ''}
                onChange={(e) => handleOptionChange(key, e.target.value)}
                placeholder={field.placeholder || ''}
                className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
              />
            </div>
          )
        }

        // Color Input
        if (field.type === 'color') {
          return (
            <div key={key} className="p-3 bg-dark-bg rounded-lg border border-gray-700">
              <label className="block text-sm font-medium text-dark-textLight mb-2">
                {formatLabel(key)}
              </label>
              {field.description && (
                <p className="text-xs text-dark-textGray mb-2">{field.description}</p>
              )}
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={config.options?.[key] ?? field.default ?? '#3B82F6'}
                  onChange={(e) => handleOptionChange(key, e.target.value)}
                  className="w-16 h-16 rounded cursor-pointer border-2 border-gray-600 hover:border-dark-accent1 transition-all"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={config.options?.[key] ?? field.default ?? '#3B82F6'}
                    onChange={(e) => handleOptionChange(key, e.target.value)}
                    className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

function AnnotationEditor({ annotations, onChange, chartType }) {
  const normalizedAnnotations = Array.isArray(annotations)
    ? annotations.map((annotation, index) => {
        if (annotation && typeof annotation === 'object' && !annotation.id) {
          return { ...annotation, id: `annotation-${index + 1}` }
        }
        return annotation
      })
    : []

  const handleAdd = (type) => {
    const newAnnotation = createDefaultAnnotation(type, null, chartType)
    onChange([...normalizedAnnotations, newAnnotation])
  }

  const handleUpdate = (targetId, patch) => {
    const updated = normalizedAnnotations.map((annotation, index) => {
      const id = annotation?.id || `annotation-${index + 1}`
      if (id !== targetId) {
        return annotation
      }
      return { ...annotation, ...patch, id }
    })
    onChange(updated)
  }

  const handleRemove = (targetId) => {
    onChange(normalizedAnnotations.filter((annotation, index) => {
      const id = annotation?.id || `annotation-${index + 1}`
      return id !== targetId
    }))
  }

  const handleTypeChange = (targetId, type) => {
    const updated = normalizedAnnotations.map((annotation, index) => {
      const id = annotation?.id || `annotation-${index + 1}`
      if (id !== targetId) {
        return annotation
      }
      const base = createDefaultAnnotation(type, id, chartType)
      return {
        ...base,
        display: annotation?.display !== undefined ? annotation.display : base.display
      }
    })
    onChange(updated)
  }

  return (
    <div className="p-4 bg-dark-bg rounded-lg border border-gray-700">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between md:space-x-4 space-y-3 md:space-y-0">
        <div>
          <h3 className="text-sm font-medium text-dark-textLight">Annotationen</h3>
          <p className="text-xs text-dark-textGray mt-1">
            Füge Linien, Boxen oder Labels hinzu, um wichtige Bereiche im Diagramm hervorzuheben.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAdd('line')}
            className="px-3 py-1.5 text-xs font-medium text-dark-textLight bg-dark-secondary border border-gray-700 rounded hover:border-dark-accent1 transition-colors"
          >
            + Linie
          </button>
          <button
            type="button"
            onClick={() => handleAdd('box')}
            className="px-3 py-1.5 text-xs font-medium text-dark-textLight bg-dark-secondary border border-gray-700 rounded hover:border-dark-accent1 transition-colors"
          >
            + Box
          </button>
          <button
            type="button"
            onClick={() => handleAdd('label')}
            className="px-3 py-1.5 text-xs font-medium text-dark-textLight bg-dark-secondary border border-gray-700 rounded hover:border-dark-accent1 transition-colors"
          >
            + Label
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {normalizedAnnotations.length === 0 && (
          <div className="text-xs text-dark-textGray bg-dark-secondary/40 border border-dashed border-gray-700 rounded-lg p-4 text-center">
            Noch keine Annotationen hinzugefügt.
          </div>
        )}

        {normalizedAnnotations.map((annotation, index) => {
          const id = annotation?.id || `annotation-${index + 1}`
          const type = annotation?.type || 'line'
          const isActive = annotation?.display !== false

          return (
            <div key={id} className="bg-dark-secondary/40 border border-gray-700 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 border-b border-gray-700 space-y-3 md:space-y-0">
                <div>
                  <div className="text-sm font-medium text-dark-textLight">
                    Annotation {index + 1}
                  </div>
                  <div className="text-xs text-dark-textGray">
                    Typ: {formatAnnotationType(type)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center space-x-2 text-xs text-dark-textGray">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => handleUpdate(id, { display: e.target.checked })}
                      className="w-4 h-4 text-dark-accent1 bg-dark-bg border-gray-600 rounded focus:ring-dark-accent1"
                    />
                    <span>Aktiv</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(id, e.target.value)}
                    className="px-3 py-1.5 bg-dark-bg text-dark-textLight border border-gray-700 rounded text-xs focus:border-dark-accent1 focus:outline-none"
                  >
                    <option value="line">Linie</option>
                    <option value="box">Box</option>
                    <option value="label">Label</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemove(id)}
                    className="px-2.5 py-1.5 text-xs text-red-300 border border-red-500/40 rounded hover:bg-red-500/10 transition-colors"
                  >
                    Entfernen
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {type === 'line' && (
                  <LineAnnotationForm
                    annotation={annotation}
                    onUpdate={(patch) => handleUpdate(id, patch)}
                  />
                )}
                {type === 'box' && (
                  <BoxAnnotationForm
                    annotation={annotation}
                    onUpdate={(patch) => handleUpdate(id, patch)}
                    chartType={chartType}
                  />
                )}
                {type === 'label' && (
                  <LabelAnnotationForm
                    annotation={annotation}
                    onUpdate={(patch) => handleUpdate(id, patch)}
                    chartType={chartType}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LineAnnotationForm({ annotation, onUpdate }) {
  const orientation = annotation.orientation || 'vertical'
  const positionHelpText = orientation === 'horizontal'
    ? 'Gib den numerischen Y-Wert an, an dem die Linie erscheinen soll.'
    : 'Gib den X-Wert oder die Bezeichnung an, an der die Linie erscheinen soll.'
  const borderColorValue = typeof annotation.borderColor === 'string' && annotation.borderColor.startsWith('#')
    ? annotation.borderColor
    : '#F97316'
  const labelBackgroundColorValue = typeof annotation.labelBackgroundColor === 'string' && annotation.labelBackgroundColor.startsWith('#')
    ? annotation.labelBackgroundColor
    : '#0F172A'
  const labelColorValue = typeof annotation.labelColor === 'string' && annotation.labelColor.startsWith('#')
    ? annotation.labelColor
    : '#F8FAFC'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Ausrichtung</label>
          <select
            value={orientation}
            onChange={(e) => {
              const newOrientation = e.target.value
              onUpdate({
                orientation: newOrientation,
                scaleID: newOrientation === 'horizontal' ? 'y' : 'x'
              })
            }}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          >
            <option value="vertical">Vertikal (X-Achse)</option>
            <option value="horizontal">Horizontal (Y-Achse)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Linienfarbe</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={borderColorValue}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={annotation.borderColor || '#F97316'}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Position (Wert)</label>
          <input
            type="text"
            value={annotation.value ?? ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
          <p className="text-[11px] text-dark-textGray mt-1">{positionHelpText}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Endwert (optional)</label>
          <input
            type="text"
            value={annotation.endValue ?? ''}
            onChange={(e) => onUpdate({ endValue: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
          <p className="text-[11px] text-dark-textGray mt-1">
            Definiert ein optionales Ende, um nur einen bestimmten Abschnitt zu markieren.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Linienstärke</label>
          <input
            type="number"
            min="1"
            max="10"
            step="1"
            value={annotation.borderWidth ?? 2}
            onChange={(e) => onUpdate({ borderWidth: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-6">
          <input
            id={`line-label-toggle-${annotation.id}`}
            type="checkbox"
            checked={annotation.labelEnabled || false}
            onChange={(e) => onUpdate({ labelEnabled: e.target.checked })}
            className="w-4 h-4 text-dark-accent1 bg-dark-bg border-gray-600 rounded focus:ring-dark-accent1"
          />
          <label htmlFor={`line-label-toggle-${annotation.id}`} className="text-xs text-dark-textGray">
            Label anzeigen
          </label>
        </div>
      </div>

      {annotation.labelEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Text</label>
            <input
              type="text"
              value={annotation.labelContent ?? ''}
              onChange={(e) => onUpdate({ labelContent: e.target.value })}
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Position</label>
            <select
              value={annotation.labelPosition || 'center'}
              onChange={(e) => onUpdate({ labelPosition: e.target.value })}
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            >
              <option value="start">Start</option>
              <option value="center">Mitte</option>
              <option value="end">Ende</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Hintergrund</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={labelBackgroundColorValue}
                onChange={(e) => onUpdate({ labelBackgroundColor: e.target.value })}
                className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={annotation.labelBackgroundColor || '#0F172A'}
                onChange={(e) => onUpdate({ labelBackgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Schriftfarbe</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={labelColorValue}
                onChange={(e) => onUpdate({ labelColor: e.target.value })}
                className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={annotation.labelColor || '#F8FAFC'}
                onChange={(e) => onUpdate({ labelColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Schriftgröße</label>
            <input
              type="number"
              min="8"
              max="32"
              step="1"
              value={annotation.labelFontSize ?? 12}
              onChange={(e) => onUpdate({ labelFontSize: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Innenabstand</label>
            <input
              type="number"
              min="0"
              max="32"
              step="1"
              value={annotation.labelPadding ?? 6}
              onChange={(e) => onUpdate({ labelPadding: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function BoxAnnotationForm({ annotation, onUpdate, chartType }) {
  const backgroundColorValue = typeof annotation.backgroundColor === 'string' && annotation.backgroundColor.startsWith('#')
    ? annotation.backgroundColor
    : '#3B82F6'
  const borderColorValue = typeof annotation.borderColor === 'string' && annotation.borderColor.startsWith('#')
    ? annotation.borderColor
    : '#3B82F6'
  const labelBackgroundColorValue = typeof annotation.labelBackgroundColor === 'string' && annotation.labelBackgroundColor.startsWith('#')
    ? annotation.labelBackgroundColor
    : '#0F172A'
  const labelColorValue = typeof annotation.labelColor === 'string' && annotation.labelColor.startsWith('#')
    ? annotation.labelColor
    : '#F8FAFC'

  // Determine scale options based on chart type
  const isHorizontalChart = ['horizontalBar', 'rangeBar'].includes(chartType?.id)
  const xScaleLabel = isHorizontalChart ? 'Y-Skala (vertikal)' : 'X-Skala (horizontal)'
  const yScaleLabel = isHorizontalChart ? 'X-Skala (horizontal)' : 'Y-Skala (vertikal)'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">{xScaleLabel}</label>
          <select
            value={annotation.xScaleID || 'x'}
            onChange={(e) => onUpdate({ xScaleID: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          >
            <option value="x">X-Achse</option>
            <option value="y">Y-Achse</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">{yScaleLabel}</label>
          <select
            value={annotation.yScaleID || 'y'}
            onChange={(e) => onUpdate({ yScaleID: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          >
            <option value="x">X-Achse</option>
            <option value="y">Y-Achse</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">X-Minimum</label>
          <input
            type="text"
            value={annotation.xMin ?? ''}
            onChange={(e) => onUpdate({ xMin: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">X-Maximum</label>
          <input
            type="text"
            value={annotation.xMax ?? ''}
            onChange={(e) => onUpdate({ xMax: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Y-Minimum</label>
          <input
            type="text"
            value={annotation.yMin ?? ''}
            onChange={(e) => onUpdate({ yMin: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Y-Maximum</label>
          <input
            type="text"
            value={annotation.yMax ?? ''}
            onChange={(e) => onUpdate({ yMax: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Füllfarbe</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={backgroundColorValue}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={annotation.backgroundColor || '#3B82F6'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Rahmenfarbe</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={borderColorValue}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={annotation.borderColor || '#3B82F6'}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Rahmenbreite</label>
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            value={annotation.borderWidth ?? 1}
            onChange={(e) => onUpdate({ borderWidth: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-6">
          <input
            id={`box-label-toggle-${annotation.id}`}
            type="checkbox"
            checked={annotation.labelEnabled || false}
            onChange={(e) => onUpdate({ labelEnabled: e.target.checked })}
            className="w-4 h-4 text-dark-accent1 bg-dark-bg border-gray-600 rounded focus:ring-dark-accent1"
          />
          <label htmlFor={`box-label-toggle-${annotation.id}`} className="text-xs text-dark-textGray">
            Label anzeigen
          </label>
        </div>
      </div>

      {annotation.labelEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Text</label>
            <input
              type="text"
              value={annotation.labelContent ?? ''}
              onChange={(e) => onUpdate({ labelContent: e.target.value })}
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Position</label>
            <select
              value={annotation.labelPosition || 'center'}
              onChange={(e) => onUpdate({ labelPosition: e.target.value })}
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            >
              <option value="center">Mitte</option>
              <option value="start">Start</option>
              <option value="end">Ende</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Hintergrund</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={labelBackgroundColorValue}
                onChange={(e) => onUpdate({ labelBackgroundColor: e.target.value })}
                className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={annotation.labelBackgroundColor || '#0F172A'}
                onChange={(e) => onUpdate({ labelBackgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Schriftfarbe</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={labelColorValue}
                onChange={(e) => onUpdate({ labelColor: e.target.value })}
                className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={annotation.labelColor || '#F8FAFC'}
                onChange={(e) => onUpdate({ labelColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Schriftgröße</label>
            <input
              type="number"
              min="8"
              max="32"
              step="1"
              value={annotation.labelFontSize ?? 12}
              onChange={(e) => onUpdate({ labelFontSize: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-1">Innenabstand</label>
            <input
              type="number"
              min="0"
              max="32"
              step="1"
              value={annotation.labelPadding ?? 6}
              onChange={(e) => onUpdate({ labelPadding: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function LabelAnnotationForm({ annotation, onUpdate, chartType }) {
  const backgroundColorValue = typeof annotation.backgroundColor === 'string' && annotation.backgroundColor.startsWith('#')
    ? annotation.backgroundColor
    : '#0F172A'
  const textColorValue = typeof annotation.color === 'string' && annotation.color.startsWith('#')
    ? annotation.color
    : '#F8FAFC'

  // Determine scale options based on chart type
  const isHorizontalChart = ['horizontalBar', 'rangeBar'].includes(chartType?.id)
  const xScaleLabel = isHorizontalChart ? 'Y-Skala (vertikal)' : 'X-Skala (horizontal)'
  const yScaleLabel = isHorizontalChart ? 'X-Skala (horizontal)' : 'Y-Skala (vertikal)'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">{xScaleLabel}</label>
          <select
            value={annotation.xScaleID || 'x'}
            onChange={(e) => onUpdate({ xScaleID: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          >
            <option value="x">X-Achse</option>
            <option value="y">Y-Achse</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">{yScaleLabel}</label>
          <select
            value={annotation.yScaleID || 'y'}
            onChange={(e) => onUpdate({ yScaleID: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          >
            <option value="x">X-Achse</option>
            <option value="y">Y-Achse</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Text</label>
          <input
            type="text"
            value={annotation.content ?? ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Ausrichtung</label>
          <select
            value={annotation.textAlign || 'center'}
            onChange={(e) => onUpdate({ textAlign: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          >
            <option value="start">Links</option>
            <option value="center">Zentriert</option>
            <option value="end">Rechts</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">X-Wert</label>
          <input
            type="text"
            value={annotation.xValue ?? ''}
            onChange={(e) => onUpdate({ xValue: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
          <p className="text-[11px] text-dark-textGray mt-1">Label-Position entlang der X-Achse.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Y-Wert</label>
          <input
            type="text"
            value={annotation.yValue ?? ''}
            onChange={(e) => onUpdate({ yValue: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
          <p className="text-[11px] text-dark-textGray mt-1">Label-Position entlang der Y-Achse.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Hintergrundfarbe</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={backgroundColorValue}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={annotation.backgroundColor || '#0F172A'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Schriftfarbe</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={textColorValue}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={annotation.color || '#F8FAFC'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Schriftgröße</label>
          <input
            type="number"
            min="8"
            max="48"
            step="1"
            value={annotation.fontSize ?? 14}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Innenabstand</label>
          <input
            type="number"
            min="0"
            max="32"
            step="1"
            value={annotation.padding ?? 6}
            onChange={(e) => onUpdate({ padding: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Eckenradius</label>
          <input
            type="number"
            min="0"
            max="30"
            step="1"
            value={annotation.borderRadius ?? 8}
            onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">X-Verschiebung</label>
          <input
            type="number"
            value={annotation.xAdjust ?? 0}
            onChange={(e) => onUpdate({ xAdjust: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textLight mb-1">Y-Verschiebung</label>
          <input
            type="number"
            value={annotation.yAdjust ?? 0}
            onChange={(e) => onUpdate({ yAdjust: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
          />
        </div>
      </div>
    </div>
  )
}

function createDefaultAnnotation(type, idOverride, chartType) {
  const base = {
    id: idOverride || `annotation-${Math.random().toString(36).slice(2, 10)}`,
    type,
    display: true
  }

  // Determine default scale IDs based on chart type
  const isHorizontalChart = ['horizontalBar', 'rangeBar'].includes(chartType?.id)
  const defaultXScaleID = isHorizontalChart ? 'y' : 'x'
  const defaultYScaleID = isHorizontalChart ? 'x' : 'y'

  if (type === 'box') {
    return {
      ...base,
      xMin: '',
      xMax: '',
      yMin: '',
      yMax: '',
      xScaleID: defaultXScaleID,
      yScaleID: defaultYScaleID,
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: '#3B82F6',
      borderWidth: 1,
      labelEnabled: false,
      labelContent: '',
      labelPosition: 'center',
      labelColor: '#F8FAFC',
      labelBackgroundColor: 'rgba(15, 23, 42, 0.8)',
      labelFontSize: 12,
      labelPadding: 6
    }
  }

  if (type === 'label') {
    return {
      ...base,
      content: 'Neues Label',
      xValue: '',
      yValue: '',
      xScaleID: defaultXScaleID,
      yScaleID: defaultYScaleID,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      color: '#F8FAFC',
      fontSize: 14,
      fontWeight: '600',
      padding: 6,
      borderRadius: 8,
      xAdjust: 0,
      yAdjust: 0,
      textAlign: 'center'
    }
  }

  return {
    ...base,
    orientation: 'vertical',
    scaleID: defaultXScaleID,
    value: '',
    endValue: '',
    borderColor: '#F97316',
    borderWidth: 2,
    labelEnabled: false,
    labelContent: '',
    labelPosition: 'center',
    labelColor: '#F8FAFC',
    labelBackgroundColor: 'rgba(15, 23, 42, 0.75)',
    labelFontSize: 12,
    labelPadding: 6
  }
}

function formatAnnotationType(type) {
  switch (type) {
    case 'box':
      return 'Box'
    case 'label':
      return 'Label'
    case 'line':
    default:
      return 'Linie'
  }
}

function ArrayFieldEditor({ label, values, onChange, itemType = 'string', description }) {
  const normalizedValues = Array.isArray(values) ? values : []

  const handleValueChange = (index, value) => {
    const updated = normalizedValues.map((entry, i) => {
      if (i === index) {
        if (itemType === 'number') {
          return Number(value) || 0
        }
        if (itemType === 'boolean') {
          return value === 'true'
        }
        return value
      }
      return entry
    })
    onChange(updated)
  }

  const handleAddValue = () => {
    let defaultValue
    if (itemType === 'number') {
      defaultValue = 0
    } else if (itemType === 'boolean') {
      defaultValue = false
    } else {
      defaultValue = `Eintrag ${normalizedValues.length + 1}`
    }
    onChange([...normalizedValues, defaultValue])
  }

  const handleRemoveValue = (index) => {
    onChange(normalizedValues.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-dark-textLight">
          {label}
        </label>
        <button
          onClick={handleAddValue}
          className="text-xs px-3 py-1 bg-dark-secondary hover:bg-gray-800 text-dark-textLight rounded transition-all"
        >
          + Eintrag
        </button>
      </div>
      {description && (
        <p className="text-xs text-dark-textGray">{description}</p>
      )}
      <div className="space-y-2">
        {normalizedValues.map((entry, idx) => (
          <div key={`${label}-${idx}`} className="flex items-center space-x-2">
            {itemType === 'boolean' ? (
              <select
                value={entry ? 'true' : 'false'}
                onChange={(e) => handleValueChange(idx, e.target.value)}
                className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
              >
                <option value="true">Wahr</option>
                <option value="false">Falsch</option>
              </select>
            ) : (
              <input
                type={itemType === 'number' ? 'number' : 'text'}
                value={entry}
                onChange={(e) => handleValueChange(idx, e.target.value)}
                className="flex-1 px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
              />
            )}
            <button
              onClick={() => handleRemoveValue(idx)}
              className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-all"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {normalizedValues.length === 0 && (
        <div className="text-xs text-dark-textGray bg-dark-bg rounded p-3">
          Keine Werte vorhanden. Füge über "Eintrag" neue Werte hinzu.
        </div>
      )}
    </div>
  )
}

function JsonFieldEditor({ label, value, onChange }) {
  const [rawValue, setRawValue] = useState(() => JSON.stringify(value, null, 2))
  const [error, setError] = useState(null)

  useEffect(() => {
    setRawValue(JSON.stringify(value, null, 2))
  }, [value])

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(rawValue)
      onChange(parsed)
      setError(null)
    } catch (err) {
      setError('Ungültiges JSON-Format. Bitte Struktur prüfen.')
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dark-textLight">
        {label}
      </label>
      <textarea
        value={rawValue}
        onChange={(e) => setRawValue(e.target.value)}
        onBlur={handleBlur}
        rows={6}
        className={`w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border ${
          error ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-dark-accent1'
        } focus:outline-none text-sm font-mono`}
      />
      <div className="text-xs text-dark-textGray">
        Bearbeite komplexe Datenstrukturen direkt als JSON.
      </div>
      {error && (
        <div className="text-xs text-red-400">{error}</div>
      )}
    </div>
  )
}

function ExportTab({ chartType, config, chartRef, onConfigChange }) {
  const [format, setFormat] = useState('png')
  const [transparent, setTransparent] = useState(false)
  const [exportWidth, setExportWidth] = useState(1920)
  const [exportHeight, setExportHeight] = useState(1080)
  const [importError, setImportError] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const { handleExport, exporting, error } = useExport()

  const formats = [
    { value: 'png', label: 'PNG', icon: '🖼️' },
    { value: 'jpeg', label: 'JPEG', icon: '📷' },
    { value: 'svg', label: 'SVG', icon: '✨' },
    { value: 'html', label: 'HTML', icon: '🌐' }
  ]

  // Calculate actual export dimensions based on aspect ratio
  const calculateActualDimensions = () => {
    let actualWidth = exportWidth
    let actualHeight = exportHeight
    
    // Chart types that don't support custom aspect ratio
    const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'gauge', 'chord']
    const supportsAspectRatio = !noAspectRatioCharts.includes(chartType.id)
    
    if (supportsAspectRatio && config.options?.aspectRatio && typeof config.options.aspectRatio === 'number') {
      const aspectRatio = config.options.aspectRatio
      // Maintain the specified aspect ratio while keeping within max dimensions
      if (aspectRatio > (exportWidth / exportHeight)) {
        // Wider - use full width, adjust height
        actualHeight = Math.round(exportWidth / aspectRatio)
      } else {
        // Taller - use full height, adjust width
        actualWidth = Math.round(exportHeight * aspectRatio)
      }
    }

    return { actualWidth, actualHeight }
  }

  const { actualWidth, actualHeight } = calculateActualDimensions()

  const onExport = () => {
    if (!chartRef || !chartRef.current) {
      return
    }
    handleExport(chartType, config, format, transparent, chartRef, exportWidth, exportHeight)
  }

  const onPreview = () => {
    if (!chartRef || !chartRef.current) {
      return
    }
    setShowPreview(true)
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

  // Calculate preset resolutions that respect aspect ratio
  const getPresetResolutions = () => {
    const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'gauge', 'chord']
    const supportsAspectRatio = !noAspectRatioCharts.includes(chartType.id)
    
    if (!supportsAspectRatio || !config.options?.aspectRatio || typeof config.options.aspectRatio !== 'number') {
      return presetResolutions
    }

    const aspectRatio = config.options.aspectRatio
    return presetResolutions.map(preset => {
      // Calculate dimensions that maintain the aspect ratio
      if (aspectRatio > (preset.width / preset.height)) {
        // Wider - use full width, adjust height
        return {
          ...preset,
          width: preset.width,
          height: Math.round(preset.width / aspectRatio)
        }
      } else {
        // Taller - use full height, adjust width
        return {
          ...preset,
          width: Math.round(preset.height * aspectRatio),
          height: preset.height
        }
      }
    })
  }

  const adjustedPresets = getPresetResolutions()

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
        
        {config.options?.aspectRatio && typeof config.options.aspectRatio === 'number' && (
          <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-300">
                <strong>Seitenverhältnis aktiv:</strong> Die tatsächliche Export-Größe wird an das eingestellte Seitenverhältnis ({config.options.aspectRatio.toFixed(2)}) angepasst.
                <br />
                <strong>Tatsächliche Größe:</strong> {actualWidth} × {actualHeight}px
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-4 gap-2 mb-3">
          {adjustedPresets.map((preset) => (
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
              <div className="text-[10px] opacity-75 mt-1">
                {preset.width}×{preset.height}
              </div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dark-textGray mb-1 block">Max. Breite (px)</label>
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
            <label className="text-xs text-dark-textGray mb-1 block">Max. Höhe (px)</label>
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

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onPreview}
          disabled={exporting || !chartType || !isChartReady}
          className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Vorschau</span>
        </button>
        
        <button
          onClick={onExport}
          disabled={exporting || !chartType || !isChartReady}
          className="px-6 py-4 bg-gradient-to-r from-dark-accent1 to-dark-accent2 hover:shadow-lg text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
              <span>Direkt exportieren</span>
            </>
          )}
        </button>
      </div>

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        chartType={chartType}
        config={config}
        format={format}
        transparent={transparent}
        exportWidth={exportWidth}
        exportHeight={exportHeight}
        onExport={onExport}
        chartRef={chartRef}
      />

      <div className="text-xs text-dark-textGray text-center">
        {config.options?.aspectRatio && typeof config.options.aspectRatio === 'number' ? (
          <>
            Das Diagramm wird als {format.toUpperCase()} exportiert (tatsächliche Größe: {actualWidth}×{actualHeight}px, angepasst an Seitenverhältnis {config.options.aspectRatio.toFixed(2)})
          </>
        ) : (
          <>
            Das Diagramm wird als {format.toUpperCase()} mit {exportWidth}×{exportHeight}px exportiert
          </>
        )}
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

const chartTypeShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  category: PropTypes.string,
  icon: PropTypes.string,
  description: PropTypes.string,
  configSchema: PropTypes.object.isRequired
})

ChartConfigPanel.propTypes = {
  chartType: chartTypeShape,
  config: PropTypes.object.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  chartRef: PropTypes.shape({ current: PropTypes.any }),
  onResetData: PropTypes.func.isRequired,
  onClearData: PropTypes.func.isRequired
}

DataTab.propTypes = {
  chartType: chartTypeShape,
  config: PropTypes.object.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  onResetData: PropTypes.func.isRequired,
  onClearData: PropTypes.func.isRequired
}

StylingTab.propTypes = {
  chartType: chartTypeShape,
  config: PropTypes.object.isRequired,
  onConfigChange: PropTypes.func.isRequired
}

OptionsTab.propTypes = {
  chartType: chartTypeShape,
  config: PropTypes.object.isRequired,
  onConfigChange: PropTypes.func.isRequired
}

ArrayFieldEditor.propTypes = {
  label: PropTypes.string.isRequired,
  values: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  itemType: PropTypes.oneOf(['string', 'number'])
}

JsonFieldEditor.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

ExportTab.propTypes = {
  chartType: chartTypeShape,
  config: PropTypes.object.isRequired,
  chartRef: PropTypes.shape({ current: PropTypes.any }),
  onConfigChange: PropTypes.func.isRequired
}

