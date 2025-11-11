import { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import PropTypes from 'prop-types'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import {
  BoxAndWiskers,
  BoxPlotController,
  ViolinController,
  Violin
} from '@sgratzl/chartjs-chart-boxplot'
import { FunnelController, TrapezoidElement } from 'chartjs-chart-funnel'
import {
  ChoroplethController,
  ProjectionScale,
  ColorScale,
  ColorLogarithmicScale,
  GeoFeature
} from 'chartjs-chart-geo'
import { VennDiagramController, ArcSlice } from 'chartjs-chart-venn'
import 'chartjs-adapter-date-fns'

export default function ExportPreviewModal({ 
  isOpen, 
  onClose, 
  chartType, 
  config, 
  format, 
  transparent, 
  exportWidth, 
  exportHeight,
  onExport,
  chartRef
}) {
  const [previewCanvas, setPreviewCanvas] = useState(null)
  const [previewDataUrl, setPreviewDataUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (isOpen && chartType && config) {
      generatePreview()
    }
  }, [isOpen, chartType, config, format, transparent, exportWidth, exportHeight])

  const generatePreview = async () => {
    if (!chartType || !config) return

    setLoading(true)
    setError(null)

    try {
      // Ensure required Chart.js elements/plugins are registered once
      try {
        ChartJS.register(
          CategoryScale,
          LinearScale,
          RadialLinearScale,
          TimeScale,
          TimeSeriesScale,
          BarElement,
          LineElement,
          PointElement,
          ArcElement,
          Title,
          Tooltip,
          Legend,
          Filler,
          CandlestickController,
          CandlestickElement,
          OhlcController,
          OhlcElement,
          BoxPlotController,
          ViolinController,
          BoxAndWiskers,
          Violin,
          FunnelController,
          TrapezoidElement,
          ChoroplethController,
          ProjectionScale,
          ColorScale,
          ColorLogarithmicScale,
          GeoFeature,
          VennDiagramController,
          ArcSlice,
          annotationPlugin
        )
      } catch (_) {
        // ignore if already registered
      }

      // Calculate actual export dimensions based on aspect ratio
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

      // Create preview canvas (smaller for performance)
      const previewScale = 0.3 // 30% of actual size for preview
      const previewWidth = Math.round(actualWidth * previewScale)
      const previewHeight = Math.round(actualHeight * previewScale)

      const canvas = document.createElement('canvas')
      canvas.width = previewWidth
      canvas.height = previewHeight
      canvas.style.width = previewWidth + 'px'
      canvas.style.height = previewHeight + 'px'
      
      const ctx = canvas.getContext('2d')

      // Draw background image if present
      if (config.backgroundImage && config.backgroundImage.url) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            img.onload = () => {
              const {
                positionX = 50,
                positionY = 50,
                scale = 100,
                flipHorizontal = false,
                flipVertical = false,
                rotation = 0,
                opacity = 100,
                blur = 0,
                brightness = 100,
                contrast = 100,
                grayscale = 0
              } = config.backgroundImage

              ctx.save()

              // Apply filters
              const filters = []
              if (opacity < 100) filters.push(`opacity(${opacity}%)`)
              if (blur > 0) filters.push(`blur(${blur}px)`)
              if (brightness !== 100) filters.push(`brightness(${brightness}%)`)
              if (contrast !== 100) filters.push(`contrast(${contrast}%)`)
              if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`)
              
              if (filters.length > 0) {
                ctx.filter = filters.join(' ')
              }

              // Calculate image dimensions and position
              const imgAspectRatio = img.width / img.height
              const canvasAspectRatio = previewWidth / previewHeight
              
              let drawWidth, drawHeight
              if (imgAspectRatio > canvasAspectRatio) {
                drawWidth = previewWidth
                drawHeight = previewWidth / imgAspectRatio
              } else {
                drawHeight = previewHeight
                drawWidth = previewHeight * imgAspectRatio
              }

              // Apply scale
              const scaleValue = scale / 100
              drawWidth *= scaleValue
              drawHeight *= scaleValue

              // Calculate position
              const centerX = (previewWidth * positionX) / 100
              const centerY = (previewHeight * positionY) / 100

              ctx.translate(centerX, centerY)

              if (rotation !== 0) {
                ctx.rotate((rotation * Math.PI) / 180)
              }

              const flipX = flipHorizontal ? -1 : 1
              const flipY = flipVertical ? -1 : 1
              ctx.scale(flipX, flipY)

              ctx.drawImage(
                img,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
              )

              ctx.restore()
              resolve()
            }
            
            img.onerror = () => {
              console.warn('Failed to load background image for preview')
              resolve()
            }
            
            img.src = config.backgroundImage.url
          })
        } catch (err) {
          console.warn('Error drawing background image:', err)
        }
      }

      // Build preview config based on the already rendered chart to ensure correct base type
      if (!chartRef || !chartRef.current) {
        throw new Error('Chart-Instanz nicht verfügbar')
      }

      const originalChart = chartRef.current
      const chartConfig = {
        type: originalChart.config.type,
        data: JSON.parse(JSON.stringify(originalChart.config.data || { labels: [], datasets: [] })),
        options: JSON.parse(JSON.stringify(originalChart.config.options || {}))
      }

      // Scale factor for preview
      const scaleFactor = previewHeight / 450

      const scaleValue = (value) => {
        if (value === undefined || value === null) return undefined
        return Math.max(1, Math.round(value * scaleFactor))
      }
      
      const scaleFont = (fontSize) => Math.round(fontSize * scaleFactor)

      // Update options for preview rendering
      chartConfig.options = {
        ...chartConfig.options,
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          ...chartConfig.options.plugins,
          legend: {
            ...chartConfig.options.plugins?.legend,
            labels: {
              ...chartConfig.options.plugins?.legend?.labels,
              font: {
                ...chartConfig.options.plugins?.legend?.labels?.font,
                size: scaleFont(14)
              },
              padding: scaleValue(10),
              boxWidth: scaleValue(40),
              boxHeight: scaleValue(15)
            }
          },
          title: {
            ...chartConfig.options.plugins?.title,
            font: {
              ...chartConfig.options.plugins?.title?.font,
              size: scaleFont(20)
            },
            padding: scaleValue(20)
          },
          tooltip: {
            ...chartConfig.options.plugins?.tooltip,
            titleFont: {
              size: scaleFont(14)
            },
            bodyFont: {
              size: scaleFont(12)
            },
            padding: scaleValue(12)
          }
        }
      }

      // Scale axis fonts
      if (chartConfig.options.scales) {
        Object.keys(chartConfig.options.scales).forEach(scaleKey => {
          const scale = chartConfig.options.scales[scaleKey]
          if (scale.ticks) {
            scale.ticks = {
              ...scale.ticks,
              font: {
                ...scale.ticks.font,
                size: scaleFont(12)
              }
            }
          }
          if (scale.pointLabels) {
            scale.pointLabels = {
              ...scale.pointLabels,
              font: {
                ...scale.pointLabels.font,
                size: scaleFont(13)
              }
            }
          }
          if (scale.title) {
            scale.title = {
              ...scale.title,
              font: {
                ...scale.title.font,
                size: scaleFont(13)
              }
            }
          }
          if (scale.grid) {
            scale.grid = {
              ...scale.grid,
              lineWidth: Math.max(1, scaleFactor * 1)
            }
          }
        })
      }

      // Special handling for heatmap charts - recreate backgroundColor functions
      if (chartType.id === 'heatmap' && chartConfig.data.datasets && Array.isArray(chartConfig.data.datasets)) {
        const isCalendarType = config.options?.heatmapType === 'calendar'
        
        chartConfig.data.datasets = chartConfig.data.datasets.map(ds => {
          if (isCalendarType) {
            // Calendar heatmap uses color scale
            return {
              ...ds,
              label: ds.label || 'Aktivität',
              data: ds.data || [],
              backgroundColor: function(context) {
                const value = context.raw?.v || 0
                const colorScale = config.colors || ['#0F172A', '#1E3A5F', '#2563EB', '#3B82F6', '#60A5FA']
                const index = Math.min(Math.floor((value / 5) * (colorScale.length - 1)), colorScale.length - 1)
                return colorScale[index]
              },
              borderWidth: scaleValue(2),
              borderColor: '#0F172A',
              pointRadius: scaleValue(config.options?.cellSize || 12),
              pointStyle: 'rect'
            }
          } else {
            // Standard heatmap uses alpha-based coloring
            return {
              ...ds,
              pointRadius: scaleValue(config.options?.cellSize || 20),
              pointStyle: 'rect',
              backgroundColor: function(context) {
                const value = context.raw?.v || 0;
                const alpha = value / 100;
                // Use dataset backgroundColor, or first color from config.colors, or default
                const color = ds.backgroundColor || 
                             (Array.isArray(config.colors) && config.colors.length > 0 ? config.colors[0] : null) ||
                             '#3B82F6';
                // Extract RGB from hex color
                const hex = color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              }
            }
          }
        })
      } else {
        // Scale dataset properties
        chartConfig.data.datasets = chartConfig.data.datasets.map(ds => ({
          ...ds,
          borderWidth: scaleValue(ds.borderWidth),
          pointRadius: scaleValue(ds.pointRadius),
          pointHoverRadius: scaleValue(ds.pointHoverRadius),
          pointBorderWidth: scaleValue(ds.pointBorderWidth),
          borderRadius: scaleValue(ds.borderRadius),
          barThickness: scaleValue(ds.barThickness),
          minBarLength: scaleValue(ds.minBarLength),
          hoverOffset: scaleValue(ds.hoverOffset),
          borderDash: ds.borderDash ? ds.borderDash.map(v => scaleValue(v)) : undefined,
          pointStyle: ds.pointStyle,
          tension: ds.tension,
          fill: ds.fill,
          stepped: ds.stepped,
          backgroundColor: ds.backgroundColor,
          borderColor: ds.borderColor
        }))
      }

      // Apply scaled barThickness at chart level
      if (chartConfig.options.barThickness) {
        chartConfig.options.datasets = {
          bar: {
            barThickness: scaleValue(chartConfig.options.barThickness)
          }
        }
      }

      // Create temporary chart for preview
      const tempChart = new ChartJS(canvas, chartConfig)
      
      // Wait for the chart to render (two frames is safer)
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

      // Composite background BEHIND the drawn chart so it isn't cleared by Chart.js
      if (!transparent && (format === 'png' || format === 'jpeg')) {
        ctx.save()
        ctx.globalCompositeOperation = 'destination-over'
        ctx.fillStyle = config.backgroundColor || '#0F172A'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.restore()
      }

      // Capture PNG data URL for display
      const dataUrl = canvas.toDataURL('image/png')
      setPreviewCanvas(canvas)
      setPreviewDataUrl(dataUrl)
      
      // Clean up
      tempChart.destroy()

    } catch (err) {
      setError('Vorschau konnte nicht generiert werden: ' + err.message)
      console.error('Preview error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    onExport()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-bg rounded-xl border border-gray-700 max-w-5xl w-full h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-dark-textLight flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Export-Vorschau
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-dark-textLight transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Export Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-secondary/40 rounded-lg p-4">
              <div className="text-sm text-dark-textGray mb-1">Format</div>
              <div className="text-lg font-semibold text-dark-textLight uppercase">{format}</div>
            </div>
            <div className="bg-dark-secondary/40 rounded-lg p-4">
              <div className="text-sm text-dark-textGray mb-1">Auflösung</div>
              <div className="text-lg font-semibold text-dark-textLight">
                {exportWidth} × {exportHeight}px
              </div>
            </div>
            <div className="bg-dark-secondary/40 rounded-lg p-4">
              <div className="text-sm text-dark-textGray mb-1">Transparenz</div>
              <div className="text-lg font-semibold text-dark-textLight">
                {transparent ? 'Ja' : 'Nein'}
              </div>
            </div>
          </div>

          {/* Aspect Ratio Info */}
          {config.options?.aspectRatio && typeof config.options.aspectRatio === 'number' && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-300">
                  <strong>Seitenverhältnis aktiv:</strong> Die tatsächliche Export-Größe wird an das eingestellte Seitenverhältnis ({config.options.aspectRatio.toFixed(2)}) angepasst.
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-dark-secondary/20 rounded-lg p-6">
            <div className="text-sm font-medium text-dark-textLight mb-4">Vorschau</div>
            
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2 text-dark-textGray">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generiere Vorschau...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-red-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm">{error}</div>
                </div>
              </div>
            )}

            {previewDataUrl && !loading && !error && (
              <div className="flex justify-center">
                <div className="border border-gray-600 rounded-lg overflow-hidden bg-white max-w-full">
                  <img 
                    src={previewDataUrl} 
                    alt="Export Vorschau"
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '60vh' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer actions */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleExport}
              disabled={loading || error}
              className="px-6 py-3 bg-gradient-to-r from-dark-accent1 to-dark-accent2 hover:shadow-lg text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Exportieren</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

ExportPreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  chartType: PropTypes.object,
  config: PropTypes.object,
  format: PropTypes.string,
  transparent: PropTypes.bool,
  exportWidth: PropTypes.number,
  exportHeight: PropTypes.number,
  onExport: PropTypes.func.isRequired
}
