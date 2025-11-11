import { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import DatasetEditor from './DatasetEditor'
import PointEditor from './PointEditor'
import SimpleDataEditor from './SimpleDataEditor'
import ColorListEditor from './ColorListEditor'
import HeatmapEditor from './HeatmapEditor'
import BubbleDatasetEditor from './BubbleDatasetEditor'
import ScatterDatasetEditor from './ScatterDatasetEditor'
import VennDiagramEditor from './VennDiagramEditor'
import BoxPlotEditor from './BoxPlotEditor'
import ViolinPlotEditor from './ViolinPlotEditor'
import ChoroplethEditor from './ChoroplethEditor'
import MixedChartEditor from './MixedChartEditor'
import ConfirmModal from './ConfirmModal'
import CsvWorkbench from './CsvWorkbench'
import ColorPaletteSelector from './ColorPaletteSelector'
import LabeledColorEditor from './LabeledColorEditor'
import BackgroundImageEditor from './BackgroundImageEditor'
import EnhancedColorPicker from './EnhancedColorPicker'
import { useExport } from '../hooks/useExport'
import ExportPreviewModal from './ExportPreviewModal'
import FinancialSeriesEditor from './FinancialSeriesEditor'

export default function ChartConfigPanel({
  chartType,
  config,
  onConfigChange,
  chartRef,
  onResetData,
  onClearData,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isFullscreen,
  onToggleFullscreen
}) {
  const [activeTab, setActiveTab] = useState('data')

  const importCapabilities = getImportCapabilities(chartType)
  const supportsDataImport = importCapabilities.supportsDataImport
  const csvAllowMultipleValueColumns = importCapabilities.usesDatasetEditor || chartType?.id === 'radar'
  const csvRequireDatasets = importCapabilities.usesDatasetEditor
  const csvIsScatterBubble = importCapabilities.isScatterDataset || importCapabilities.isBubbleDataset || chartType?.id === 'matrix'
  const csvIsCoordinate = importCapabilities.isCoordinateDataset
  const schema = chartType?.configSchema || {}

  const handleCsvStateChange = useCallback(
    (state) => {
      onConfigChange({ _importData: state || null })
    },
    [onConfigChange]
  )

  const handleCsvReset = useCallback(() => {
    onConfigChange({ _importData: null })
  }, [onConfigChange])

  const openCsvEditor = useCallback(() => {
    setActiveTab('csv')
  }, [])

  const handleImportedData = useCallback(
    (result) => {
      if (!result) return

      const payload = {
        labels: Array.isArray(result.labels) ? result.labels : [],
        values: Array.isArray(result.values) ? result.values : [],
        datasets: Array.isArray(result.datasets) ? result.datasets : []
      }

      if (csvIsScatterBubble) {
        payload.datasets = result.datasets || []
        payload.labels = []
        payload.values = []
      } else if (chartType?.id === 'radar') {
        if (result.datasets && result.datasets.length > 0) {
          payload.labels = result.labels || []
          payload.datasets = result.datasets
          if (result.datasets.length === 1) {
            payload.values = result.datasets[0].data || []
            payload.datasetLabel = result.datasets[0].label || 'Datensatz'
          } else {
            payload.values = []
            payload.datasetLabel = ''
          }
        }
      } else if (['candlestick', 'ohlc'].includes(chartType?.id)) {
        payload.financialSeries = Array.isArray(result.financialSeries) ? result.financialSeries : []
        payload.labels = Array.isArray(result.labels) ? result.labels : []
        payload.values = []
        payload.datasets = []
      } else if (['boxPlot', 'violinPlot'].includes(chartType?.id)) {
        payload.series = Array.isArray(result.series) ? result.series : []
        payload.labels = Array.isArray(result.labels) ? result.labels : []
        payload.values = []
        payload.datasets = []
      } else if (chartType?.id === 'choropleth') {
        payload.regions = Array.isArray(result.regions) ? result.regions : []
        if (Array.isArray(result.features)) {
          payload.features = result.features
        }
        payload.labels = []
        payload.values = []
        payload.datasets = []
      } else if (chartType?.id === 'venn') {
        payload.sets = Array.isArray(result.vennSets) ? result.vennSets : []
        payload.labels = []
        payload.values = []
        payload.datasets = []
      } else if (schema.datasetLabel) {
        let datasetLabelValue = ''
        if (importCapabilities.usesSimpleEditor && result.meta?.valueColumns?.[0]) {
          datasetLabelValue = result.meta.valueColumns[0]
        } else if (!importCapabilities.usesSimpleEditor && payload.datasets.length === 1) {
          datasetLabelValue = payload.datasets[0]?.label || result.meta?.valueColumns?.[0] || ''
        }
        payload.datasetLabel = datasetLabelValue
      }

      if (result.importState) {
        payload._importData = result.importState
      }

      onConfigChange(payload)
    },
    [chartType, csvIsScatterBubble, importCapabilities.usesSimpleEditor, onConfigChange, schema.datasetLabel]
  )

  useEffect(() => {
    const handleKeydown = (event) => {
      const activeElement = document.activeElement
      const tagName = activeElement?.tagName?.toLowerCase()
      const isEditableElement = activeElement?.isContentEditable || tagName === 'input' || tagName === 'textarea'

      if (isEditableElement) {
        return
      }

      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        if (canUndo) {
          onUndo()
        }
      }

      if (event.ctrlKey && (event.key === 'Z' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault()
        if (canRedo) {
          onRedo()
        }
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [onUndo, onRedo, canUndo, canRedo])

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
      
      <div className="mb-6 border-b border-gray-700 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            {supportsDataImport && (
              <TabButton label="CSV-Editor" isActive={activeTab === 'csv'} onClick={() => setActiveTab('csv')} />
            )}
            <TabButton label="Daten" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} />
            <TabButton label="Styling" isActive={activeTab === 'styling'} onClick={() => setActiveTab('styling')} />
            <TabButton label="Annotationen" isActive={activeTab === 'annotations'} onClick={() => setActiveTab('annotations')} />
            <TabButton label="Optionen" isActive={activeTab === 'options'} onClick={() => setActiveTab('options')} />
            <TabButton label="Export" isActive={activeTab === 'export'} onClick={() => setActiveTab('export')} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Vollbild beenden' : 'Vollbild aktivieren'}
              className={`flex items-center justify-center rounded-md border p-2 text-sm transition-all ${
                isFullscreen
                  ? 'border-dark-accent1 bg-dark-accent1 text-white hover:bg-dark-accent1/90'
                  : 'border-gray-700 text-dark-textLight hover:bg-gray-800'
              }`}
            >
              {isFullscreen ? '⊡' : '⊞'}
            </button>
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Rückgängig (Strg+Z)"
              className={`flex items-center justify-center rounded-md border p-2 text-xs transition-all ${
                canUndo
                  ? 'border-gray-700 text-dark-textLight hover:bg-gray-800'
                  : 'border-gray-800 text-dark-textGray cursor-not-allowed bg-gray-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17l-5-5 5-5m8 10a5 5 0 00-5-5H4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Wiederholen (Strg+Shift+Z)"
              className={`flex items-center justify-center rounded-md border p-2 text-xs transition-all ${
                canRedo
                  ? 'border-gray-700 text-dark-textLight hover:bg-gray-800'
                  : 'border-gray-800 text-dark-textGray cursor-not-allowed bg-gray-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7l5 5-5 5m-8-10a5 5 0 015 5h10" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`space-y-4 ${activeTab === 'csv' ? '' : 'max-h-[calc(100vh-300px)] overflow-y-auto pr-2'}`}>
        {activeTab === 'csv' && supportsDataImport && (
          <CsvWorkbench
            allowMultipleValueColumns={csvAllowMultipleValueColumns}
            requireDatasets={csvRequireDatasets}
            initialData={config._importData || null}
            chartType={chartType?.id}
            isScatterBubble={csvIsScatterBubble}
            isCoordinate={csvIsCoordinate}
            onApplyToChart={handleImportedData}
            onImportStateChange={handleCsvStateChange}
            onResetWorkbench={handleCsvReset}
          />
        )}
        {activeTab === 'data' && (
          <DataTab
            chartType={chartType}
            config={config}
            onConfigChange={onConfigChange}
            onResetData={onResetData}
            onClearData={onClearData}
            supportsDataImport={supportsDataImport}
            onOpenCsvEditor={supportsDataImport ? openCsvEditor : null}
          />
        )}
        {activeTab === 'styling' && (
          <StylingTab
            chartType={chartType}
            config={config}
            onConfigChange={onConfigChange}
          />
        )}
        {activeTab === 'annotations' && (
          <AnnotationsTab
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

function TabButton({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-all ${
        isActive
          ? 'text-dark-accent1 border-b-2 border-dark-accent1'
          : 'text-dark-textGray hover:text-dark-textLight'
      }`}
    >
      {label}
    </button>
  )
}

TabButton.propTypes = {
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
}

const getImportCapabilities = (chartType) => {
  if (!chartType) {
    return {
      supportsDataImport: false,
      usesDatasetEditor: false,
      usesSimpleEditor: false,
      isScatterDataset: false,
      isBubbleDataset: false,
      isCoordinateDataset: false
    }
  }

  if (['candlestick', 'ohlc', 'boxPlot', 'violinPlot', 'choropleth', 'venn', 'mixed'].includes(chartType.id)) {
    return {
      supportsDataImport: true,
      usesDatasetEditor: false,
      usesSimpleEditor: false,
      isScatterDataset: false,
      isBubbleDataset: false,
      isCoordinateDataset: false
    }
  }

  const schema = chartType.configSchema || {}
  const labelsSchema = schema.labels
  const valuesSchema = schema.values
  const datasetsSchema = schema.datasets
  const defaultValues = Array.isArray(valuesSchema?.default) ? valuesSchema.default : []
  const defaultDatasets = Array.isArray(datasetsSchema?.default) ? datasetsSchema.default : []
  const sampleValue = defaultValues[0]
  const sampleDataset = defaultDatasets[0]
  const sampleDatasetEntry = Array.isArray(sampleDataset?.data) ? sampleDataset.data[0] : undefined

  const hasSimpleValues = Array.isArray(defaultValues) && sampleValue !== undefined && typeof sampleValue !== 'object'
  const isBubbleDataset = sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'r' in sampleDatasetEntry && 'x' in sampleDatasetEntry && 'y' in sampleDatasetEntry
  const isScatterDataset = sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && !('r' in sampleDatasetEntry) && 'x' in sampleDatasetEntry && 'y' in sampleDatasetEntry && !('v' in sampleDatasetEntry)
  const isCoordinateDataset = sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'longitude' in sampleDatasetEntry && 'latitude' in sampleDatasetEntry
  const isHeatmapDataset = chartType?.id === 'heatmap' && sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'v' in sampleDatasetEntry

  const usesDatasetEditor = !!datasetsSchema && !isHeatmapDataset && !isBubbleDataset && !isScatterDataset && !isCoordinateDataset
  const usesSimpleEditor = !!labelsSchema && !!valuesSchema && hasSimpleValues && chartType?.id !== 'radar'
  const isRadarChart = chartType?.id === 'radar'

  const supportsDataImport = (
    usesSimpleEditor ||
    usesDatasetEditor ||
    isScatterDataset ||
    isBubbleDataset ||
    isCoordinateDataset ||
    chartType?.id === 'matrix' ||
    isRadarChart
  )

  return {
    supportsDataImport,
    usesDatasetEditor,
    usesSimpleEditor,
    isScatterDataset,
    isBubbleDataset,
    isCoordinateDataset
  }
}

function DataTab({ chartType, config, onConfigChange, onResetData, onClearData, supportsDataImport, onOpenCsvEditor }) {
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
  const isBubbleDataset = sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'r' in sampleDatasetEntry && 'x' in sampleDatasetEntry && 'y' in sampleDatasetEntry
  const isScatterDataset = sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && !('r' in sampleDatasetEntry) && 'x' in sampleDatasetEntry && 'y' in sampleDatasetEntry && !('v' in sampleDatasetEntry)
  const isCoordinateDataset = sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'longitude' in sampleDatasetEntry && 'latitude' in sampleDatasetEntry
  const isHeatmapDataset = chartType?.id === 'heatmap' && sampleDatasetEntry && typeof sampleDatasetEntry === 'object' && 'v' in sampleDatasetEntry
  
  // Special chart types with custom editors
  const isVennChart = chartType?.id === 'venn'
  const isBoxPlot = chartType?.id === 'boxPlot'
  const isViolinPlot = chartType?.id === 'violinPlot'
  const isChoropleth = chartType?.id === 'choropleth'
  const isMixedChart = chartType?.id === 'mixed'
  const isFinancialChart = ['candlestick', 'ohlc'].includes(chartType?.id)
  
  const usesDatasetEditor = !!datasetsSchema && !isHeatmapDataset && !isBubbleDataset && !isScatterDataset && !isCoordinateDataset && !isVennChart && !isBoxPlot && !isViolinPlot && !isChoropleth && !isMixedChart
  const usesSimpleEditor = !!labelsSchema && !!valuesSchema && hasSimpleValues && chartType?.id !== 'radar'
  // Radar charts always use datasets (can have multiple datasets with different colors)
  const isRadarChart = chartType?.id === 'radar'
  const excludedKeys = ['title', 'labels', 'yLabels', 'values', 'datasets', 'datasetLabel', 'options', 'colors', 'backgroundColor', 'width', 'height', 'sets', 'series', 'regions', 'features', 'financialSeries']
  const additionalFields = Object.entries(schema).filter(([key]) => !excludedKeys.includes(key))

  const handleFieldChange = (key, value) => {
    onConfigChange({ [key]: value })
  }

  const renderDatasetEditor = () => {
    // Special chart types with custom editors
    if (isVennChart) {
      return (
        <VennDiagramEditor
          sets={config.sets || []}
          onSetsChange={(sets) => onConfigChange({ sets })}
        />
      )
    }

    if (isBoxPlot) {
      return (
        <BoxPlotEditor
          labels={config.labels || []}
          series={config.series || []}
          onLabelsChange={(labels) => onConfigChange({ labels })}
          onSeriesChange={(series) => onConfigChange({ series })}
        />
      )
    }

    if (isViolinPlot) {
      return (
        <ViolinPlotEditor
          labels={config.labels || []}
          series={config.series || []}
          onLabelsChange={(labels) => onConfigChange({ labels })}
          onSeriesChange={(series) => onConfigChange({ series })}
        />
      )
    }

    if (isChoropleth) {
      return (
        <ChoroplethEditor
          regions={config.regions || []}
          onRegionsChange={(regions) => onConfigChange({ regions })}
          features={config.features || []}
          onFeaturesChange={(features) => onConfigChange({ features })}
        />
      )
    }

    if (isFinancialChart) {
      return (
        <FinancialSeriesEditor
          labels={config.labels || []}
          series={config.financialSeries || []}
          onLabelsChange={(labels) => onConfigChange({ labels })}
          onSeriesChange={(financialSeries) => onConfigChange({ financialSeries })}
        />
      )
    }

    if (isMixedChart) {
      return (
        <MixedChartEditor
          labels={config.labels || []}
          datasets={config.datasets || []}
          onLabelsChange={(labels) => onConfigChange({ labels })}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
        />
      )
    }

    if (!datasetsSchema) return null

    if (isHeatmapDataset) {
      // Check if calendar type
      const isCalendarType = config.options?.heatmapType === 'calendar'
      
      if (isCalendarType) {
        // Use heatmap editor but with calendar-specific handling
        return (
          <HeatmapEditor
            labels={config.labels || []}
            yLabels={config.yLabels || []}
            datasets={config.datasets || []}
            onLabelsChange={(labels) => onConfigChange({ labels })}
            onYLabelsChange={(yLabels) => onConfigChange({ yLabels })}
            onDatasetsChange={(datasets) => onConfigChange({ datasets })}
            isCalendarType={true}
          />
        )
      }
      
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

    if (isBubbleDataset) {
      return (
        <BubbleDatasetEditor
          datasets={config.datasets || []}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
        />
      )
    }

    if (isScatterDataset || isCoordinateDataset) {
      // Check if coordinate format
      const isCoordinateFormat = config.options?.dataFormat === 'coordinates' || isCoordinateDataset
      
      if (isCoordinateFormat) {
        // Use scatter editor but with coordinate-specific handling
        return (
          <ScatterDatasetEditor
            datasets={config.datasets || []}
            onDatasetsChange={(datasets) => onConfigChange({ datasets })}
            isCoordinateFormat={true}
          />
        )
      }
      
      return (
        <ScatterDatasetEditor
          datasets={config.datasets || []}
          onDatasetsChange={(datasets) => onConfigChange({ datasets })}
        />
      )
    }

    if (usesDatasetEditor || isRadarChart) {
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

    // Don't show values if using specialized dataset editors or radar charts (they use DatasetEditor)
    if (isBubbleDataset || isScatterDataset || isCoordinateDataset || isHeatmapDataset || isRadarChart) {
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

      {supportsDataImport && onOpenCsvEditor && (
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-dark-accent1/40 bg-dark-bg/40 p-3 text-xs text-dark-textGray sm:flex-row sm:items-center sm:justify-between">
          <span>
            Nutze den CSV-Editor, um Daten zu importieren, zu filtern und zu transformieren. Übernehme die Ergebnisse anschließend in diesen Tab.
          </span>
          <button
            type="button"
            onClick={onOpenCsvEditor}
            className="inline-flex items-center gap-1 rounded-md border border-dark-accent1/60 px-3 py-1.5 text-xs font-medium text-dark-accent1 transition-colors hover:bg-dark-accent1/10"
          >
            CSV-Editor öffnen
          </button>
        </div>
      )}

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center space-x-1.5 rounded-md border border-gray-700 bg-dark-bg px-3 py-1.5 text-xs font-medium text-dark-textGray transition-all hover:bg-gray-800 hover:text-dark-textLight"
              title="Beispieldaten laden"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Beispieldaten</span>
            </button>
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center space-x-1.5 rounded-md border border-red-900 bg-dark-bg px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:border-red-800 hover:bg-red-950 hover:text-red-300"
              title="Alle Daten löschen"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Alle löschen</span>
            </button>
          </div>
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
  const isChoropleth = chartType?.id === 'choropleth'
  const isHeatmap = chartType?.id === 'heatmap'
  const isCalendarHeatmap = isHeatmap && config.options?.heatmapType === 'calendar'

  const backgroundPresets = [
    { name: 'Dunkel', value: '#0F172A' },
    { name: 'Grau', value: '#1E293B' },
    { name: 'Schwarz', value: '#000000' },
    { name: 'Weiß', value: '#FFFFFF' },
    { name: 'Hellgrau', value: '#F3F4F6' },
    { name: 'Transparent', value: 'transparent' }
  ]

  const fontFamilies = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Poppins', label: 'Poppins' }
  ]

  const handleFontStyleChange = (element, property, value) => {
    const currentStyles = config.options?.fontStyles || {}
    onConfigChange({
      options: {
        ...config.options,
        fontStyles: {
          ...currentStyles,
          [element]: {
            ...(currentStyles[element] || {}),
            [property]: value
          }
        }
      }
    })
  }

  const getFontStyle = (element, property, defaultValue) => {
    return config.options?.fontStyles?.[element]?.[property] ?? defaultValue
  }

  const handleOptionChange = (key, value) => {
    onConfigChange({
      options: {
        ...config.options,
        [key]: value
      }
    })
  }

  if (!hasColors && !hasBackground && !isChoropleth && !isHeatmap) {
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
      {isChoropleth && (
        <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight mb-1">Choropleth-Farben</h3>
            <p className="text-xs text-dark-textGray">Passe die Farbpalette für die Werteverteilung an.</p>
          </div>
          <ColorListEditor
            label="Farbpalette"
            values={Array.isArray(config.options?.colorPalette) ? config.options.colorPalette : ['#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#BFDBFE']}
            onChange={(values) => handleOptionChange('colorPalette', values)}
            maxColors={9}
          />
          <div className="border-t border-gray-700 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-dark-textLight mb-2">Outline-Farbe</label>
              <EnhancedColorPicker
                value={config.options?.outlineColor || '#0F172A'}
                onChange={(newColor) => handleOptionChange('outlineColor', newColor)}
                label="Outline-Farbe"
                size="md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-textLight mb-1">Outline-Breite</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={config.options?.outlineWidth ?? 0.5}
                onChange={(event) => handleOptionChange('outlineWidth', Number(event.target.value))}
                className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {isChoropleth && (
        <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight mb-1">Legende Schriftfarbe</h3>
            <p className="text-xs text-dark-textGray">Passe die Schriftfarbe der Skala an.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textLight mb-2">Schriftfarbe</label>
            <EnhancedColorPicker
              value={config.options?.fontStyles?.legend?.color || '#F8FAFC'}
              onChange={(newColor) => {
                const currentStyles = config.options?.fontStyles || {}
                handleOptionChange('fontStyles', {
                  ...currentStyles,
                  legend: {
                    ...(currentStyles.legend || {}),
                    color: newColor
                  }
                })
              }}
              label="Schriftfarbe"
              size="md"
            />
          </div>
        </div>
      )}

      {isHeatmap && (
        <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-dark-textLight mb-1">Heatmap-Farben</h3>
            <p className="text-xs text-dark-textGray">
              {isCalendarHeatmap 
                ? 'Passe die Farbpalette für die Kalender-Heatmap an. Die Farben werden basierend auf den Werten zugeordnet.'
                : 'Passe die Basis-Farbe für die Standard-Heatmap an. Die Intensität wird basierend auf den Werten angepasst.'}
            </p>
          </div>
          
          {isCalendarHeatmap ? (
            <ColorListEditor
              label="Farbpalette"
              values={Array.isArray(config.colors) ? config.colors : ['#0F172A', '#1E3A5F', '#2563EB', '#3B82F6', '#60A5FA']}
              onChange={(values) => onConfigChange({ colors: values })}
              maxColors={9}
            />
          ) : (
            <div>
              <label className="block text-xs font-medium text-dark-textLight mb-2">Basis-Farbe</label>
              <EnhancedColorPicker
                value={Array.isArray(config.colors) && config.colors.length > 0 
                  ? config.colors[0] 
                  : (config.datasets?.[0]?.backgroundColor || '#3B82F6')}
                onChange={(newColor) => {
                  // Update config.colors array with the new color as first element
                  const currentColors = Array.isArray(config.colors) ? config.colors : []
                  const updatedColors = [newColor, ...currentColors.slice(1)]
                  if (updatedColors.length === 0) {
                    updatedColors.push(newColor)
                  }
                  
                  // Also update the first dataset's backgroundColor
                  const updatedDatasets = config.datasets?.map((ds, idx) => 
                    idx === 0 ? { ...ds, backgroundColor: newColor } : ds
                  ) || []
                  
                  onConfigChange({ 
                    colors: updatedColors,
                    datasets: updatedDatasets
                  })
                }}
                label="Basis-Farbe"
                size="md"
              />
              <p className="text-xs text-dark-textGray mt-2">
                Die Intensität der Farbe wird automatisch basierend auf den Werten (v) angepasst.
              </p>
            </div>
          )}
        </div>
      )}

      {hasColors && !isHeatmap && (
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

      {/* Font Styling Section */}
      <div className="border-t border-gray-700 pt-4">
        <label className="block text-sm font-medium text-dark-textLight mb-4">
          Schriftart & Textfarben
        </label>
        <div className="text-xs text-dark-textGray mb-4 bg-dark-bg/50 rounded-lg p-3 flex items-start space-x-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Schriftfarben und Schriftarten werden auf alle Texte im Diagramm angewendet und auch beim Export berücksichtigt.
          </span>
        </div>

        <div className="space-y-4">
          {/* Title Font */}
          {config.title && (
            <div className="bg-dark-bg rounded-lg p-4 border border-gray-700">
              <label className="block text-xs font-medium text-dark-textLight mb-3">
                Titel
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <EnhancedColorPicker
                    value={getFontStyle('title', 'color', '#F8FAFC')}
                    onChange={(newColor) => handleFontStyleChange('title', 'color', newColor)}
                    label="Schriftfarbe"
                    size="sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Schriftart</label>
                  <select
                    value={getFontStyle('title', 'family', 'Inter')}
                    onChange={(e) => handleFontStyleChange('title', 'family', e.target.value)}
                    className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                  >
                    {fontFamilies.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Legend Font */}
          {config.options?.showLegend !== false && (
            <div className="bg-dark-bg rounded-lg p-4 border border-gray-700">
              <label className="block text-xs font-medium text-dark-textLight mb-3">
                Legende
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <EnhancedColorPicker
                    value={getFontStyle('legend', 'color', '#F8FAFC')}
                    onChange={(newColor) => handleFontStyleChange('legend', 'color', newColor)}
                    label="Schriftfarbe"
                    size="sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Schriftart</label>
                  <select
                    value={getFontStyle('legend', 'family', 'Inter')}
                    onChange={(e) => handleFontStyleChange('legend', 'family', e.target.value)}
                    className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                  >
                    {fontFamilies.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Axis Labels Font */}
          {(config.options?.xAxisLabel || config.options?.yAxisLabel) && (
            <div className="bg-dark-bg rounded-lg p-4 border border-gray-700">
              <label className="block text-xs font-medium text-dark-textLight mb-3">
                Achsenbeschriftungen
              </label>
              {config.options?.xAxisLabel && (
                <div className="mb-3">
                  <label className="text-xs text-dark-textGray mb-1 block">X-Achse ({config.options.xAxisLabel})</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <EnhancedColorPicker
                        value={getFontStyle('xAxis', 'color', '#F8FAFC')}
                        onChange={(newColor) => handleFontStyleChange('xAxis', 'color', newColor)}
                        label="Schriftfarbe"
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-dark-textGray mb-1 block">Schriftart</label>
                      <select
                        value={getFontStyle('xAxis', 'family', 'Inter')}
                        onChange={(e) => handleFontStyleChange('xAxis', 'family', e.target.value)}
                        className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                      >
                        {fontFamilies.map(font => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {config.options?.yAxisLabel && (
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Y-Achse ({config.options.yAxisLabel})</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <EnhancedColorPicker
                        value={getFontStyle('yAxis', 'color', '#F8FAFC')}
                        onChange={(newColor) => handleFontStyleChange('yAxis', 'color', newColor)}
                        label="Schriftfarbe"
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-dark-textGray mb-1 block">Schriftart</label>
                      <select
                        value={getFontStyle('yAxis', 'family', 'Inter')}
                        onChange={(e) => handleFontStyleChange('yAxis', 'family', e.target.value)}
                        className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                      >
                        {fontFamilies.map(font => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Value Labels Font (when showValues is enabled) */}
          {config.options?.showValues && (
            <div className="bg-dark-bg rounded-lg p-4 border border-gray-700">
              <label className="block text-xs font-medium text-dark-textLight mb-3">
                Werte auf Balken
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <EnhancedColorPicker
                    value={getFontStyle('valueLabels', 'color', '#F8FAFC')}
                    onChange={(newColor) => handleFontStyleChange('valueLabels', 'color', newColor)}
                    label="Schriftfarbe"
                    size="sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-textGray mb-1 block">Schriftart</label>
                  <select
                    value={getFontStyle('valueLabels', 'family', 'Inter')}
                    onChange={(e) => handleFontStyleChange('valueLabels', 'family', e.target.value)}
                    className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                  >
                    {fontFamilies.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Axis Ticks Font */}
          <div className="bg-dark-bg rounded-lg p-4 border border-gray-700">
            <label className="block text-xs font-medium text-dark-textLight mb-3">
              Achsenwerte (Ticks)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <EnhancedColorPicker
                  value={getFontStyle('ticks', 'color', '#CBD5E1')}
                  onChange={(newColor) => handleFontStyleChange('ticks', 'color', newColor)}
                  label="Schriftfarbe"
                  size="sm"
                />
              </div>
              <div>
                <label className="text-xs text-dark-textGray mb-1 block">Schriftart</label>
                <select
                  value={getFontStyle('ticks', 'family', 'Inter')}
                  onChange={(e) => handleFontStyleChange('ticks', 'family', e.target.value)}
                  className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
                >
                  {fontFamilies.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnnotationsTab({ chartType, config, onConfigChange }) {
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
    'bar', 'stackedBar', 'groupedBar', 'percentageBar', 'segmentedBar',
    'line', 'area', 'multiLine', 'steppedLine', 'verticalLine', 'smoothLine', 'dashedLine', 'curvedArea',
    'scatter', 'bubble', 'matrix', 'heatmap', 'mixed', 'horizontalBar', 'streamGraph'
  ]
  const showAnnotations = annotationSchema && supportedChartTypes.includes(chartType.id)

  if (!showAnnotations) {
    return (
      <div className="text-sm text-dark-textGray bg-dark-bg/50 rounded-lg p-4 text-center">
        Annotationen werden für diesen Diagrammtyp nicht unterstützt.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnnotationEditor
        annotations={Array.isArray(config.options?.annotations)
          ? config.options.annotations
          : Array.isArray(annotationSchema.default)
            ? [...annotationSchema.default]
            : []}
        onChange={(value) => handleOptionChange('annotations', value)}
        chartType={chartType}
        config={config}
      />
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
  const schemaEntries = Object.entries(schema).filter(([key]) => key !== 'annotations')
  const isFinancialChart = ['candlestick', 'ohlc'].includes(chartType.id)
  const isChoropleth = chartType.id === 'choropleth'
  const isVenn = chartType.id === 'venn'

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
  const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'chord']
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

      {/* Chart-specific options */}
      {hasOptionFields && (
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-dark-textLight mb-4">Diagrammspezifische Optionen</h3>
        </div>
      )}

      {!hasOptionFields && (
        <div className="text-sm text-dark-textGray bg-dark-bg/50 rounded-lg p-4 text-center">
          Keine weiteren diagrammspezifischen Optionen verfügbar.
        </div>
      )}
      {schemaEntries.map(([key, field]) => {
        // Skip legend-related fields for choropleth charts as they're handled in the dedicated section
        if (chartType?.id === 'choropleth' && ['showLegend', 'legendTitle', 'legendPosition', 'legendHeight'].includes(key)) {
          return null
        }

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
          
          // For radar charts: disable scaleMax if autoScale is enabled
          const isDisabled = chartType.id === 'radar' && key === 'scaleMax' && config.options?.autoScale !== false

          return (
            <div key={key} className={`p-3 bg-dark-bg rounded-lg border border-gray-700 ${isDisabled ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${isDisabled ? 'text-dark-textGray' : 'text-dark-textLight'}`}>
                  {formatLabel(key)}
                </label>
                <span className="text-sm font-mono text-dark-accent1">{value}</span>
              </div>
              {field.description && (
                <p className="text-xs text-dark-textGray mb-2">{field.description}</p>
              )}
              {isDisabled && (
                <p className="text-xs text-yellow-300 mb-2">⚠️ Wird ignoriert, da Auto-Skala aktiviert ist.</p>
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
                    disabled={isDisabled}
                    className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1 ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                  />
                  <div className="flex justify-between text-xs text-dark-textGray">
                    <span>{field.min}</span>
                    <span>{field.max}</span>
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  value={value ?? ''}
                  min={field.min}
                  max={field.max}
                  step={field.step || 1}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    const numValue = inputValue === '' || inputValue === null ? null : Number(inputValue)
                    handleOptionChange(key, numValue)
                  }}
                  disabled={isDisabled}
                  placeholder={field.default === null ? "Automatisch" : ""}
                  className={`w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
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

        // Array Input (e.g., Farbpaletten)
        if (field.type === 'array') {
          // Skip colorPalette for choropleth charts as it's handled in StylingTab
          if (chartType?.id === 'choropleth' && key === 'colorPalette') {
            return null
          }
          
          const currentValue = Array.isArray(config.options?.[key]) ? config.options[key] : field.default || []
          const isColorArray = Array.isArray(currentValue) && currentValue.every(entry => typeof entry === 'string' && /^#|rgb|hsl/i.test(entry))

          if (isColorArray) {
            return (
              <ColorListEditor
                key={key}
                label={formatLabel(key)}
                values={currentValue}
                onChange={(values) => handleOptionChange(key, values)}
                maxColors={12}
              />
            )
          }

          return (
            <ArrayFieldEditor
              key={key}
              label={formatLabel(key)}
              values={currentValue}
              onChange={(values) => handleOptionChange(key, values)}
            />
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
              <EnhancedColorPicker
                value={config.options?.[key] ?? field.default ?? '#3B82F6'}
                onChange={(newColor) => handleOptionChange(key, newColor)}
                label={formatLabel(key)}
                size="lg"
              />
              {field.description && (
                <p className="text-xs text-dark-textGray mt-2">{field.description}</p>
              )}
            </div>
          )
        }

        return null
      })}

      {isFinancialChart && (
        <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-dark-textLight">Erweiterte Finanzoptionen</h3>
          <p className="text-xs text-dark-textGray">Passe Gitter und Achsentexte deiner Finanzdiagramme an.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-dark-bg rounded border border-gray-700">
              <div>
                <div className="text-sm text-dark-textLight">Gitter anzeigen</div>
                <div className="text-xs text-dark-textGray">Ein-/ausschalten der Hintergrundlinien</div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.options?.showGrid !== false}
                  onChange={(event) => handleOptionChange('showGrid', event.target.checked)}
                  className="sr-only"
                />
                <span className="w-10 h-5 flex items-center bg-gray-700 rounded-full p-1 duration-300 ease-in-out">
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${config.options?.showGrid !== false ? 'translate-x-5' : ''}`}
                  />
                </span>
              </label>
            </div>
            <EnhancedColorPicker
              value={config.options?.gridColor || '#334155'}
              onChange={(value) => handleOptionChange('gridColor', value)}
              label="Gitternetzfarbe"
              size="md"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark-textLight mb-1">X-Achsen-Label</label>
              <input
                type="text"
                value={config.options?.xAxisLabel || ''}
                onChange={(event) => handleOptionChange('xAxisLabel', event.target.value)}
                className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-textLight mb-1">Y-Achsen-Label</label>
              <input
                type="text"
                value={config.options?.yAxisLabel || ''}
                onChange={(event) => handleOptionChange('yAxisLabel', event.target.value)}
                className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>
      )}


      {isChoropleth && (
        <>
          {/* Show Legend Toggle */}
          <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex-1">
              <label className="text-sm font-medium text-dark-textLight block">
                Legende anzeigen
              </label>
              <p className="text-xs text-dark-textGray mt-0.5">Skala auf der Karte anzeigen</p>
            </div>
            <button
              onClick={() => handleOptionChange('showLegend', !config.options?.showLegend)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${
                config.options?.showLegend !== false ? 'bg-dark-accent1' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.options?.showLegend !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Legend Title */}
          <div className="p-3 bg-dark-bg rounded-lg border border-gray-700">
            <label className="block text-sm font-medium text-dark-textLight mb-2">
              Legendentitel
            </label>
            <input
              type="text"
              value={config.options?.legendTitle || 'Wert'}
              onChange={(event) => handleOptionChange('legendTitle', event.target.value)}
              placeholder="z.B. Wert, Bevölkerung, etc."
              className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>

          {/* Legend Position */}
          <div className="p-3 bg-dark-bg rounded-lg border border-gray-700">
            <label className="block text-sm font-medium text-dark-textLight mb-2">
              Skala-Position
            </label>
            <select
              value={config.options?.legendPosition || 'bottom-right'}
              onChange={(e) => handleOptionChange('legendPosition', e.target.value)}
              className="w-full px-3 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            >
              <option value="top-left">Oben links</option>
              <option value="top-right">Oben rechts</option>
              <option value="bottom-left">Unten links</option>
              <option value="bottom-right">Unten rechts</option>
            </select>
          </div>

          {/* Legend Height */}
          <div className="p-3 bg-dark-bg rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-dark-textLight">
                Skala-Größe (Höhe in px)
              </label>
              <span className="text-sm font-mono text-dark-accent1">{config.options?.legendHeight || 200}</span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={config.options?.legendHeight || 200}
                onChange={(e) => handleOptionChange('legendHeight', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
              />
              <div className="flex justify-between text-xs text-dark-textGray">
                <span>50</span>
                <span>300</span>
              </div>
            </div>
          </div>
        </>
      )}

      {isVenn && (
        <div className="bg-dark-sidebar border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-dark-textLight">Venn-Farben</h3>
          <p className="text-xs text-dark-textGray">Definiere die Farbflächen der Mengen.</p>
          <ColorListEditor
            label="Farben"
            values={Array.isArray(config.options?.colorScheme) ? config.options.colorScheme : []}
            onChange={(values) => handleOptionChange('colorScheme', values)}
            maxColors={6}
          />
        </div>
      )}

      {/* Radar Chart: Value Labels Font (when showValues is enabled) */}
      {chartType.id === 'radar' && config.options?.showValues && (
        <div className="bg-dark-bg rounded-lg p-4 border border-gray-700">
          <label className="block text-xs font-medium text-dark-textLight mb-3">
            Werte an Punkten
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <EnhancedColorPicker
                value={config.options?.fontStyles?.valueLabels?.color || '#F8FAFC'}
                onChange={(newColor) => {
                  handleOptionChange('fontStyles', {
                    ...config.options?.fontStyles,
                    valueLabels: {
                      ...config.options?.fontStyles?.valueLabels,
                      color: newColor
                    }
                  })
                }}
                label="Schriftfarbe"
                size="sm"
              />
            </div>
            <div>
              <label className="text-xs text-dark-textGray mb-1 block">Schriftart</label>
              <select
                value={config.options?.fontStyles?.valueLabels?.family || 'Inter'}
                onChange={(e) => {
                  handleOptionChange('fontStyles', {
                    ...config.options?.fontStyles,
                    valueLabels: {
                      ...config.options?.fontStyles?.valueLabels,
                      family: e.target.value
                    }
                  })
                }}
                className="w-full px-2 py-2 bg-dark-secondary text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-xs"
              >
                {fontFamilies.map(font => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AnnotationEditor({ annotations, onChange, chartType, config }) {
  const [showAutoAnnotations, setShowAutoAnnotations] = useState(false)
  
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
          <button
            type="button"
            onClick={() => setShowAutoAnnotations(!showAutoAnnotations)}
            className="px-3 py-1.5 text-xs font-medium text-dark-textLight bg-blue-600/20 border border-blue-500/40 rounded hover:border-blue-500 transition-colors"
          >
            Auto-Statistiken
          </button>
        </div>
      </div>

      {showAutoAnnotations && (
        <AutoAnnotationPanel 
          onAddAnnotations={(newAnnotations) => onChange([...normalizedAnnotations, ...newAnnotations])}
          chartType={chartType}
          config={config}
        />
      )}

      <div className="mt-4 space-y-3">
        {normalizedAnnotations.length === 0 && !showAutoAnnotations && (
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
        <EnhancedColorPicker
          value={annotation.borderColor || '#F97316'}
          onChange={(newColor) => onUpdate({ borderColor: newColor })}
          label="Linienfarbe"
          size="md"
        />
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
            <label className="block text-xs font-medium text-dark-textLight mb-1">Label-Anzeige</label>
            <select
              value={annotation.labelDisplay || 'line'}
              onChange={(e) => onUpdate({ labelDisplay: e.target.value })}
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            >
              <option value="line">Nur an der Linie</option>
              <option value="legend">Nur in der Legende</option>
              <option value="both">An der Linie und in der Legende</option>
            </select>
            <p className="text-[11px] text-dark-textGray mt-1">
              {annotation.labelDisplay === 'line' && 'Label wird nur direkt an der Linie angezeigt'}
              {annotation.labelDisplay === 'legend' && 'Label wird nur in der Chart-Legende angezeigt'}
              {annotation.labelDisplay === 'both' && 'Label wird sowohl an der Linie als auch in der Legende angezeigt'}
            </p>
          </div>
          <EnhancedColorPicker
            value={annotation.labelBackgroundColor || '#0F172A'}
            onChange={(newColor) => onUpdate({ labelBackgroundColor: newColor })}
            label="Label-Hintergrund"
            size="md"
          />
          <EnhancedColorPicker
            value={annotation.labelColor || '#F8FAFC'}
            onChange={(newColor) => onUpdate({ labelColor: newColor })}
            label="Label-Schriftfarbe"
            size="md"
          />
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
  const isHorizontalChart = ['horizontalBar'].includes(chartType?.id)
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
        <EnhancedColorPicker
          value={annotation.backgroundColor || '#3B82F6'}
          onChange={(newColor) => onUpdate({ backgroundColor: newColor })}
          label="Füllfarbe"
          size="md"
        />
        <EnhancedColorPicker
          value={annotation.borderColor || '#3B82F6'}
          onChange={(newColor) => onUpdate({ borderColor: newColor })}
          label="Rahmenfarbe"
          size="md"
        />
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
          <EnhancedColorPicker
            value={annotation.labelBackgroundColor || '#0F172A'}
            onChange={(newColor) => onUpdate({ labelBackgroundColor: newColor })}
            label="Label-Hintergrund"
            size="md"
          />
          <EnhancedColorPicker
            value={annotation.labelColor || '#F8FAFC'}
            onChange={(newColor) => onUpdate({ labelColor: newColor })}
            label="Label-Schriftfarbe"
            size="md"
          />
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
  const isHorizontalChart = ['horizontalBar'].includes(chartType?.id)
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
        <EnhancedColorPicker
          value={annotation.backgroundColor || '#0F172A'}
          onChange={(newColor) => onUpdate({ backgroundColor: newColor })}
          label="Hintergrundfarbe"
          size="md"
        />
        <EnhancedColorPicker
          value={annotation.color || '#F8FAFC'}
          onChange={(newColor) => onUpdate({ color: newColor })}
          label="Schriftfarbe"
          size="md"
        />
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
  const isHorizontalChart = ['horizontalBar'].includes(chartType?.id)
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

const EXPORT_SETTINGS_KEY = 'ccc:exportSettings'
const DEFAULT_EXPORT_SETTINGS = {
  format: 'png',
  transparent: false,
  exportWidth: 1920,
  exportHeight: 1080
}

function ExportTab({ chartType, config, chartRef, onConfigChange }) {
  // Load saved export settings from localStorage
  const loadExportSettings = () => {
    try {
      const saved = localStorage.getItem(EXPORT_SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          format: parsed.format || DEFAULT_EXPORT_SETTINGS.format,
          transparent: parsed.transparent ?? DEFAULT_EXPORT_SETTINGS.transparent,
          exportWidth: parsed.exportWidth || DEFAULT_EXPORT_SETTINGS.exportWidth,
          exportHeight: parsed.exportHeight || DEFAULT_EXPORT_SETTINGS.exportHeight
        }
      }
    } catch (e) {
      console.warn('Failed to load export settings:', e)
    }
    return DEFAULT_EXPORT_SETTINGS
  }

  const savedSettings = loadExportSettings()
  const [format, setFormat] = useState(savedSettings.format)
  const [transparent, setTransparent] = useState(savedSettings.transparent)
  const [exportWidth, setExportWidth] = useState(savedSettings.exportWidth)
  const [exportHeight, setExportHeight] = useState(savedSettings.exportHeight)
  const [scalePercent, setScalePercent] = useState(100)
  const scaleBaseRef = useRef({ width: savedSettings.exportWidth, height: savedSettings.exportHeight })
  const [importError, setImportError] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const { handleExport, exporting, error } = useExport()

  // Save export settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      format,
      transparent,
      exportWidth,
      exportHeight
    }
    try {
      localStorage.setItem(EXPORT_SETTINGS_KEY, JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save export settings:', e)
    }
  }, [format, transparent, exportWidth, exportHeight])

  // Reset to default values
  const resetToDefaults = () => {
    setFormat(DEFAULT_EXPORT_SETTINGS.format)
    setTransparent(DEFAULT_EXPORT_SETTINGS.transparent)
    setExportWidth(DEFAULT_EXPORT_SETTINGS.exportWidth)
    setExportHeight(DEFAULT_EXPORT_SETTINGS.exportHeight)
    scaleBaseRef.current = { width: DEFAULT_EXPORT_SETTINGS.exportWidth, height: DEFAULT_EXPORT_SETTINGS.exportHeight }
    setScalePercent(100)
  }

  const formats = [
    { value: 'png', label: 'PNG', icon: '🖼️' },
    { value: 'jpeg', label: 'JPEG', icon: '📷' },
    { value: 'html', label: 'HTML', icon: '🌐' }
  ]

  // Calculate actual export dimensions based on aspect ratio
  const calculateActualDimensions = () => {
    let actualWidth = exportWidth
    let actualHeight = exportHeight
    
    // Chart types that don't support custom aspect ratio
    const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'chord']
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

  // Initialize baseline when tab mounts or when chart/aspect changes significantly
  useEffect(() => {
    // Use current actual dimensions as baseline
    const baseW = actualWidth || exportWidth
    const baseH = actualHeight || exportHeight
    scaleBaseRef.current = { width: baseW, height: baseH }
    setScalePercent(100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType?.id, config.options?.aspectRatio])

  const onScaleChange = (value) => {
    const v = Number(value)
    setScalePercent(v)
    const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'chord']
    const supportsAspectRatio = !noAspectRatioCharts.includes(chartType.id)
    const hasAspect = supportsAspectRatio && config.options?.aspectRatio && typeof config.options.aspectRatio === 'number'
    const baseW = Math.max(1, scaleBaseRef.current.width)
    const baseH = Math.max(1, scaleBaseRef.current.height)
    const aspectRatio = hasAspect ? config.options.aspectRatio : (baseW / baseH)
    const scale = Math.max(10, Math.min(300, v)) / 100 // clamp 10%..300%
    if (hasAspect) {
      const newW = Math.max(100, Math.round(baseW * scale))
      const newH = Math.max(100, Math.round(newW / aspectRatio))
      setExportWidth(Math.min(7680, newW))
      setExportHeight(Math.min(7680, newH))
    } else {
      const newW = Math.max(100, Math.round(baseW * scale))
      const newH = Math.max(100, Math.round(baseH * scale))
      setExportWidth(Math.min(7680, newW))
      setExportHeight(Math.min(7680, newH))
    }
  }

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
    const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'chord']
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

  // Check if chart is ready - must exist and not be destroyed
  const isChartReady = chartRef && chartRef.current && !chartRef.current.destroyed

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-textLight flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Diagramm als Bild
          </h3>
          <button
            onClick={resetToDefaults}
            className="px-3 py-1.5 text-xs font-medium text-dark-textGray hover:text-dark-textLight bg-dark-bg hover:bg-gray-800 rounded-lg transition-colors flex items-center space-x-1"
            title="Export-Einstellungen auf Standardwerte zurücksetzen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Standard</span>
          </button>
        </div>
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
                scaleBaseRef.current = { width: preset.width, height: preset.height }
                setScalePercent(100)
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
              onChange={(e) => {
                const val = Math.min(7680, Math.max(100, Number(e.target.value)))
                setExportWidth(val)
                scaleBaseRef.current = { width: val, height: exportHeight }
                setScalePercent(100)
              }}
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
              onChange={(e) => {
                const val = Math.min(7680, Math.max(100, Number(e.target.value)))
                setExportHeight(val)
                scaleBaseRef.current = { width: exportWidth, height: val }
                setScalePercent(100)
              }}
              min="100"
              max="7680"
              className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-dark-accent1 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Skalierungs-Slider (bewahrt Seitenverhältnis) */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-dark-textLight mb-2">
            Skalierung ({scalePercent}%)
          </label>
          <input
            type="range"
            min="10"
            max="300"
            step="5"
            value={scalePercent}
            onChange={(e) => onScaleChange(e.target.value)}
            className="w-full"
          />
          <div className="text-xs text-dark-textGray mt-2">
            Ergebnis: {actualWidth ? Math.round(actualWidth * (scalePercent/100)) : exportWidth}×{actualHeight ? Math.round(actualHeight * (scalePercent/100)) : exportHeight} px (relativ zur aktuellen Einstellung)
          </div>
        </div>
      </div>

      {(format === 'png' || format === 'jpeg') && (
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

// AutoAnnotationPanel Component
function AutoAnnotationPanel({ onAddAnnotations, chartType, config }) {
  const [selectedDataset, setSelectedDataset] = useState('')
  const [selectedStatistic, setSelectedStatistic] = useState('mean')
  const [color, setColor] = useState('#F97316')
  const [multipleAnnotations, setMultipleAnnotations] = useState([])

  // Extract numeric data from various chart data formats
  const extractNumericData = (chartType, config) => {
    if (!config) return []

    const datasets = []

    // Handle different chart data formats
    switch (chartType.id) {
      case 'bar':
      case 'horizontalBar':
      case 'line':
      case 'area':
      case 'pie':
      case 'donut':
      case 'radar':
      case 'polarArea':
      case 'semiCircle':
      case 'sunburst':
        // Simple format: config.values + config.datasetLabel
        if (config.values && Array.isArray(config.values)) {
          datasets.push({
            label: config.datasetLabel || 'Datensatz',
            data: config.values.filter(val => typeof val === 'number' && !isNaN(val))
          })
        }
        break

      case 'stackedBar':
      case 'groupedBar':
      case 'percentageBar':
      case 'segmentedBar':
      case 'multiLine':
      case 'mixed':
      case 'smoothLine':
      case 'dashedLine':
      case 'curvedArea':
      case 'steppedLine':
      case 'verticalLine':
      case 'streamGraph':
      case 'nestedDonut':
        // Multi-dataset format: config.datasets
        if (config.datasets && Array.isArray(config.datasets)) {
          config.datasets.forEach((ds, index) => {
            if (ds.data && Array.isArray(ds.data)) {
              datasets.push({
                label: ds.label || `Dataset ${index + 1}`,
                data: ds.data.filter(val => typeof val === 'number' && !isNaN(val))
              })
            }
          })
        }
        break

      case 'scatter':
      case 'bubble':
      case 'heatmap':
      case 'matrix':
        // Scatter format: config.datasets with x,y coordinates
        // Also handles coordinate format (longitude/latitude) and heatmap format (x,y,v)
        if (config.datasets && Array.isArray(config.datasets)) {
          config.datasets.forEach((ds, index) => {
            if (ds.data && Array.isArray(ds.data)) {
              // Extract y-values from scatter data
              const yValues = ds.data.map(point => {
                if (typeof point === 'object' && point !== null) {
                  return point.y || point.latitude || point.v || point.value
                }
                return point
              }).filter(val => typeof val === 'number' && !isNaN(val))
              
              if (yValues.length > 0) {
                datasets.push({
                  label: ds.label || `Dataset ${index + 1}`,
                  data: yValues
                })
              }
            }
          })
        }
        break

      default:
        // Fallback: try to find any numeric data
        if (config.values && Array.isArray(config.values)) {
          datasets.push({
            label: config.datasetLabel || 'Datensatz',
            data: config.values.filter(val => typeof val === 'number' && !isNaN(val))
          })
        }
        if (config.datasets && Array.isArray(config.datasets)) {
          config.datasets.forEach((ds, index) => {
            if (ds.data && Array.isArray(ds.data)) {
              datasets.push({
                label: ds.label || `Dataset ${index + 1}`,
                data: ds.data.filter(val => typeof val === 'number' && !isNaN(val))
              })
            }
          })
        }
    }

    return datasets
  }

  // Get current chart data from the config
  const getChartData = () => {
    const datasets = extractNumericData(chartType, config)
    return { labels: config.labels || [], datasets }
  }

  const calculateStatistic = (data, statistic) => {
    if (!Array.isArray(data) || data.length === 0) return null
    
    const numericData = data.filter(val => typeof val === 'number' && !isNaN(val))
    if (numericData.length === 0) return null

    switch (statistic) {
      case 'mean':
        return numericData.reduce((sum, val) => sum + val, 0) / numericData.length
      case 'median':
        const sorted = [...numericData].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
      case 'min':
        return Math.min(...numericData)
      case 'max':
        return Math.max(...numericData)
      case 'sum':
        return numericData.reduce((sum, val) => sum + val, 0)
      case 'std':
        const mean = numericData.reduce((sum, val) => sum + val, 0) / numericData.length
        const variance = numericData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericData.length
        return Math.sqrt(variance)
      default:
        return null
    }
  }

  const handleAddStatisticLine = () => {
    const chartData = getChartData()
    const dataset = chartData.datasets.find(ds => ds.label === selectedDataset)
    
    if (!dataset || !Array.isArray(dataset.data)) {
      alert('Bitte wählen Sie ein gültiges Dataset aus.')
      return
    }

    const value = calculateStatistic(dataset.data, selectedStatistic)
    if (value === null) {
      alert('Keine gültigen numerischen Daten gefunden.')
      return
    }

    const statisticNames = {
      mean: 'Durchschnitt',
      median: 'Median',
      min: 'Minimum',
      max: 'Maximum',
      sum: 'Summe',
      std: 'Standardabweichung'
    }

    const annotation = {
      id: `auto-${selectedStatistic}-${Date.now()}`,
      type: 'line',
      display: true,
      orientation: 'horizontal',
      scaleID: 'y',
      value: value,
      borderColor: color,
      borderWidth: 2,
      borderDash: [5, 5],
      label: {
        content: `${statisticNames[selectedStatistic]}: ${value.toFixed(2)}`,
        enabled: true,
        position: 'end',
        backgroundColor: color,
        color: '#FFFFFF',
        font: {
          size: 12,
          weight: 'bold'
        }
      }
    }

    // Add to multiple annotations list
    const newAnnotation = {
      ...annotation,
      datasetLabel: selectedDataset,
      statisticType: selectedStatistic,
      color: color
    }
    
    setMultipleAnnotations(prev => [...prev, newAnnotation])
  }

  const handleAddAllAnnotations = () => {
    if (multipleAnnotations.length === 0) {
      alert('Keine Annotationen zum Hinzufügen vorhanden.')
      return
    }

    const annotationsToAdd = multipleAnnotations.map(annotation => ({
      id: annotation.id,
      type: annotation.type,
      display: annotation.display,
      orientation: annotation.orientation,
      scaleID: annotation.scaleID,
      value: annotation.value,
      borderColor: annotation.borderColor,
      borderWidth: annotation.borderWidth,
      borderDash: annotation.borderDash,
      label: annotation.label
    }))

    onAddAnnotations(annotationsToAdd)
    setMultipleAnnotations([])
    setSelectedDataset('')
  }

  const handleRemoveFromMultiple = (annotationId) => {
    setMultipleAnnotations(prev => prev.filter(ann => ann.id !== annotationId))
  }

  const handleClearAll = () => {
    setMultipleAnnotations([])
  }

  const statistics = [
    { value: 'mean', label: 'Durchschnitt (Mean)', description: 'Arithmetisches Mittel aller Werte' },
    { value: 'median', label: 'Median', description: 'Mittlerer Wert der sortierten Daten' },
    { value: 'min', label: 'Minimum', description: 'Kleinster Wert' },
    { value: 'max', label: 'Maximum', description: 'Größter Wert' },
    { value: 'sum', label: 'Summe', description: 'Summe aller Werte' },
    { value: 'std', label: 'Standardabweichung', description: 'Streuung der Daten' }
  ]

  return (
    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <h4 className="text-sm font-medium text-blue-300 mb-3">Automatische Statistiken</h4>
      <p className="text-xs text-blue-200 mb-4">
        Erstelle automatisch Linien für wichtige statistische Werte basierend auf Ihren Daten.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Dataset</label>
          <select
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="">Dataset auswählen...</option>
            {getChartData().datasets.map((dataset, index) => (
              <option key={index} value={dataset.label}>
                {dataset.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Statistik</label>
          <select
            value={selectedStatistic}
            onChange={(e) => setSelectedStatistic(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg text-dark-textLight rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
          >
            {statistics.map((stat) => (
              <option key={stat.value} value={stat.value}>
                {stat.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-blue-200 mt-1">
            {statistics.find(s => s.value === selectedStatistic)?.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-blue-300 mb-1">Farbe</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 bg-dark-bg border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <p className="text-xs text-blue-200">
              Label-Text wird automatisch generiert. Position kann später in der Annotation-Bearbeitung angepasst werden.
            </p>
          </div>
        </div>

        <button
          onClick={handleAddStatisticLine}
          disabled={!selectedDataset}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
        >
          📈 Statistik-Linie hinzufügen
        </button>

        {/* Multiple Annotations Preview */}
        {multipleAnnotations.length > 0 && (
          <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium text-blue-300">
                Vorschau ({multipleAnnotations.length} Annotationen)
              </h5>
              <button
                onClick={handleClearAll}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Alle löschen
              </button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {multipleAnnotations.map((annotation, index) => (
                <div key={annotation.id} className="flex items-center justify-between bg-blue-500/10 rounded p-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full border-2"
                      style={{ borderColor: annotation.color }}
                    />
                    <span className="text-xs text-blue-200">
                      {annotation.datasetLabel}: {annotation.statisticType} = {annotation.value.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFromMultiple(annotation.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleAddAllAnnotations}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                ✅ Alle hinzufügen ({multipleAnnotations.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

AutoAnnotationPanel.propTypes = {
  onAddAnnotations: PropTypes.func.isRequired,
  chartType: PropTypes.object,
  config: PropTypes.object.isRequired
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
  onClearData: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
  onRedo: PropTypes.func.isRequired,
  canUndo: PropTypes.bool.isRequired,
  canRedo: PropTypes.bool.isRequired,
  isFullscreen: PropTypes.bool,
  onToggleFullscreen: PropTypes.func
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

AnnotationsTab.propTypes = {
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

