import { useEffect, useState, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
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
import { Bar, Line, Pie, Doughnut, Radar, PolarArea, Scatter, Bubble } from 'react-chartjs-2'
import ChartErrorBoundary from './ChartErrorBoundary'

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
  valueLabelPlugin(),
  backgroundImagePlugin()
)

function backgroundImagePlugin() {
  return {
    id: 'backgroundImage',
    beforeDraw(chart, args, options) {
      if (!options || !options.image || !options.settings) {
        return
      }

      const { ctx, chartArea } = chart
      if (!chartArea) return

      const { left, top, right, bottom } = chartArea
      const width = right - left
      const height = bottom - top

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
      } = options.settings

      const img = options.image

      ctx.save()

      // Clip to chart area only (where data is shown)
      ctx.beginPath()
      ctx.rect(left, top, width, height)
      ctx.clip()

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

      // Calculate image dimensions maintaining aspect ratio
      const imgAspectRatio = img.width / img.height
      const chartAspectRatio = width / height
      
      let drawWidth, drawHeight
      if (imgAspectRatio > chartAspectRatio) {
        drawWidth = width
        drawHeight = width / imgAspectRatio
      } else {
        drawHeight = height
        drawWidth = height * imgAspectRatio
      }

      // Apply scale
      const scaleValue = scale / 100
      drawWidth *= scaleValue
      drawHeight *= scaleValue

      // Calculate position within chart area
      const centerX = left + (width * positionX) / 100
      const centerY = top + (height * positionY) / 100

      // Move to center point for transformation
      ctx.translate(centerX, centerY)

      // Apply rotation
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180)
      }

      // Apply flip
      const flipX = flipHorizontal ? -1 : 1
      const flipY = flipVertical ? -1 : 1
      ctx.scale(flipX, flipY)

      // Draw image centered at transformation point
      ctx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      )

      ctx.restore()
    }
  }
}

function valueLabelPlugin() {
  return {
    id: 'customValueLabels',
    afterDatasetsDraw(chart, args, pluginOptions) {
      if (!pluginOptions || !pluginOptions.display) {
        return
      }

      const {
        color = '#F8FAFC',
        font = {},
        layout = 'default',
        offsetX = 0,
        offsetY = 0,
        formatter
      } = pluginOptions

      const resolveFont = {
        family: font.family || 'Inter',
        weight: font.weight || '600',
        size: font.size || 12
      }

      const formatValue = typeof formatter === 'function'
        ? formatter
        : (value) => {
            if (value === null || value === undefined) return ''
            if (typeof value === 'number' && Number.isFinite(value)) {
              return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value)
            }
            if (typeof value === 'object') {
              if (value === null) return ''
              if (typeof value.v === 'number') {
                return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value.v)
              }
              if (typeof value.value === 'number') {
                return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value.value)
              }
              if (Array.isArray(value)) {
                return value.join(' – ')
              }
            }
            return String(value)
          }

      const { ctx } = chart
      ctx.save()

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex)
        if (!meta || meta.hidden) return

        meta.data.forEach((element, index) => {
          if (!element || typeof element.tooltipPosition !== 'function') return

          const rawValue = dataset?.data?.[index]
          const formatted = formatValue(rawValue, dataset, index, chart)
          
          // Calculate percentage if showPercentages is enabled for bar charts
          let displayText = formatted
          const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue)
          const isNumeric = Number.isFinite(numericValue)
          
          if (chart.config.type === 'bar' && chart.config.options?.plugins?.customValueLabels?.showPercentages && isNumeric) {
            const total = dataset.data.reduce((sum, val) => {
              const num = typeof val === 'number' ? val : Number(val)
              return sum + (Number.isFinite(num) ? num : 0)
            }, 0)
            if (total > 0) {
              const percentage = (numericValue / total * 100).toFixed(1)
              displayText = `${formatted} (${percentage}%)`
            }
          }
          
          const text = displayText === null || displayText === undefined ? '' : String(displayText)
          if (!text || text.trim().length === 0) {
            return
          }

          const position = element.tooltipPosition()
          let drawX = position.x
          let drawY = position.y

          if (layout === 'verticalBar') {
            ctx.textAlign = 'center'
            ctx.textBaseline = isNumeric && numericValue < 0 ? 'top' : 'bottom'
            drawY = isNumeric && numericValue < 0 ? position.y + offsetY : position.y - offsetY
          } else if (layout === 'horizontalBar') {
            ctx.textAlign = isNumeric && numericValue < 0 ? 'right' : 'left'
            ctx.textBaseline = 'middle'
            drawX = isNumeric && numericValue < 0 ? position.x - offsetX : position.x + offsetX
          } else if (layout === 'radar') {
            // For radar charts, position labels at the point with a slight offset outward
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            // Calculate angle for this point
            const angle = (index * 2 * Math.PI) / meta.data.length - Math.PI / 2
            // Offset outward from the point
            const offsetDistance = 15 + offsetY
            drawX = position.x + Math.cos(angle) * offsetDistance
            drawY = position.y + Math.sin(angle) * offsetDistance
          } else {
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            drawX = position.x + offsetX
            drawY = position.y - offsetY
          }

          ctx.fillStyle = typeof color === 'function' ? color(rawValue, dataset, index, chart) : color
          ctx.font = `${resolveFont.weight} ${resolveFont.size}px ${resolveFont.family}`
          ctx.fillText(text, drawX, drawY)
        })
      })

      ctx.restore()
    }
  }
}

// Wrapper component to force complete remount
function ChartWrapper({ chartType, data, options, chartRef, onDataPointClick }) {
  // For vertical line charts, use Scatter instead of Line
  let ChartComponent = getChartComponent(chartType.id)
  if (chartType.id === 'line' && options?.scales?.x?.type === 'linear') {
    ChartComponent = Scatter
  }
  
  const handleClick = useCallback(
    (event, elements) => {
      if (!onDataPointClick || !elements || elements.length === 0) {
        return
      }
      const [primary] = elements
      if (!primary) {
        return
      }

      onDataPointClick({
        event,
        datasetIndex: primary.datasetIndex,
        index: primary.index,
        element: primary
      })
    },
    [onDataPointClick]
  )

  // Trigger animation after chart is created
  const chartRefCallback = useCallback((chartInstance) => {
    if (chartRef) {
      if (typeof chartRef === 'function') {
        chartRef(chartInstance)
      } else if (chartRef.current !== undefined) {
        chartRef.current = chartInstance
      }
    }
    
    // Trigger animation if enabled
    if (chartInstance && options?.animation && options.animation !== false) {
      // Chart.js animations only run on initial creation
      // We need to ensure the chart is reset and updated to trigger animation
      // Small delay to ensure chart is fully initialized
      setTimeout(() => {
        try {
          if (chartInstance && typeof chartInstance.reset === 'function') {
            // Set animation mode explicitly
            const originalAnimation = chartInstance.options.animation
            if (originalAnimation && originalAnimation !== false) {
              // Reset chart to initial state
              chartInstance.reset()
              // Update with animation mode to trigger animation
              chartInstance.update('active')
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }, 200)
    }
  }, [chartRef, options?.animation])

  return (
    <ChartComponent
      ref={chartRefCallback}
      data={data}
      options={options}
      onClick={handleClick}
    />
  )
}

export default function ChartPreview({
  chartType,
  config,
  chartRef,
  onDataPointClick = null,
  compact = false,
  title = null,
  subtitle = null
}) {
  const [chartData, setChartData] = useState(null)
  const [chartOptions, setChartOptions] = useState(null)
  const [mountKey, setMountKey] = useState(0)
  const localChartRef = useRef(null)

  // Helper function to load images
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  // Sync local ref with parent ref is now handled in ChartWrapper

  useEffect(() => {
    if (!chartType || !config) return

    // Destroy any existing chart on the ref
    if (chartRef?.current) {
      try {
        chartRef.current.destroy()
      } catch (e) {
        console.warn('Error destroying chart:', e)
      }
      chartRef.current = null
    }

    // Also destroy any chart instances that might be lingering
    if (localChartRef.current) {
      try {
        localChartRef.current.destroy()
      } catch (e) {
        console.warn('Error destroying local chart:', e)
      }
      localChartRef.current = null
    }

    // Clear all Chart.js instances
    try {
      ChartJS.instances.forEach(instance => {
        try {
          instance.destroy()
        } catch (e) {
          // Ignore
        }
      })
    } catch (e) {
      // Ignore if instances array doesn't exist
    }

    // Clear current data
    setChartData(null)
    setChartOptions(null)

    // Increment mount key to force complete unmount/remount
    const timeoutId = setTimeout(async () => {
      setMountKey(prev => prev + 1)
      const data = prepareChartData(chartType, config)
      
      // Load background image if present
      let backgroundImageObj = null
      if (config.backgroundImage && config.backgroundImage.url) {
        try {
          backgroundImageObj = await loadImage(config.backgroundImage.url)
        } catch (err) {
          console.warn('Failed to load background image:', err)
        }
      }
      
      const options = prepareChartOptions(chartType, config, backgroundImageObj)
      
      setChartData(data)
      setChartOptions(options)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [chartType, config, chartRef])

  if (!chartType || !config || !chartData) {
    return (
      <div
        className={
          compact
            ? 'rounded-xl border border-gray-700/60 bg-dark-bg/40 p-4 flex items-center justify-center h-48'
            : 'bg-dark-secondary rounded-2xl shadow-lg p-6 flex items-center justify-center h-[600px]'
        }
      >
        <div className="text-dark-textGray">Wähle einen Diagrammtyp aus...</div>
      </div>
    )
  }

  // Get background color from config, default to dark theme
  const backgroundColor = config.backgroundColor || '#0F172A'
  const isTransparent = backgroundColor === 'transparent'

  // Calculate preview dimensions based on aspect ratio
  const getPreviewDimensions = () => {
    if (compact) {
      return { maxWidth: '100%', maxHeight: '220px' }
    }
    // Chart types that don't support custom aspect ratio
    const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'chord']
    const supportsAspectRatio = !noAspectRatioCharts.includes(chartType.id)

    const aspectRatio = config.options?.aspectRatio
    if (!aspectRatio || !supportsAspectRatio || typeof aspectRatio !== 'number') {
      return { maxWidth: '600px', maxHeight: '450px' }
    }
    
    const maxWidth = 600
    const maxHeight = 450
    
    // Calculate dimensions based on aspect ratio
    if (aspectRatio > (maxWidth / maxHeight)) {
      // Wider than container - constrain by width
      return {
        maxWidth: `${maxWidth}px`,
        maxHeight: `${maxWidth / aspectRatio}px`
      }
    } else {
      // Taller than container - constrain by height
      return {
        maxWidth: `${maxHeight * aspectRatio}px`,
        maxHeight: `${maxHeight}px`
      }
    }
  }
  
  const previewDimensions = getPreviewDimensions()

  return (
    <div
      className={
        compact
          ? 'rounded-xl border border-gray-700/60 bg-dark-bg/50 p-4 flex flex-col h-64'
          : 'bg-dark-secondary rounded-2xl shadow-lg p-6 flex flex-col h-[600px]'
      }
    >
      <div className={`flex-shrink-0 ${compact ? 'mb-2' : 'mb-4'}`}>
        {(title || !compact) && (
          <h2 className={`${compact ? 'text-sm' : 'text-xl'} font-semibold text-dark-textLight`}>
            {title || 'Vorschau'}
          </h2>
        )}
        {(subtitle || (!compact && chartType.name)) && (
          <p className={`${compact ? 'text-[11px]' : 'text-sm'} text-dark-textGray`}>
            {subtitle || chartType.name}
          </p>
        )}
      </div>
      <div
        className="rounded-xl p-6 flex items-center justify-center flex-1 transition-colors duration-300"
        style={{
          backgroundColor: isTransparent ? '#1E293B' : backgroundColor,
          backgroundImage: isTransparent 
            ? 'linear-gradient(45deg, #334155 25%, transparent 25%, transparent 75%, #334155 75%, #334155), linear-gradient(45deg, #334155 25%, transparent 25%, transparent 75%, #334155 75%, #334155)'
            : 'none',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}
      >
        {chartData && (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              maxWidth: previewDimensions.maxWidth,
              maxHeight: previewDimensions.maxHeight
            }}
          >
            <ChartErrorBoundary chartType={chartType}>
              <ChartWrapper
                key={`${chartType.id}-${mountKey}-${config.options?.animation !== false ? '1' : '0'}-${config.options?.animationDuration || 1000}`}
                chartType={chartType}
                data={chartData}
                options={chartOptions}
                chartRef={localChartRef}
                onDataPointClick={onDataPointClick}
              />
            </ChartErrorBoundary>
          </div>
        )}
      </div>
    </div>
  )
}

function getChartComponent(type) {
  const components = {
    bar: Bar,
    horizontalBar: Bar,
    line: Line,
    area: Line,
    pie: Pie,
    donut: Doughnut,
    radar: Radar,
    scatter: Scatter,
    bubble: Bubble,
    polarArea: PolarArea,
    stackedBar: Bar,
    multiLine: Line,
    mixed: Bar,
    groupedBar: Bar,
    steppedLine: Line,
    verticalLine: Line,
    percentageBar: Bar,
    // Neue Balkendiagramme
    segmentedBar: Bar,
    // Neue Liniendiagramme
    smoothLine: Line,
    dashedLine: Line,
    curvedArea: Line,
    streamGraph: Line,
    // Neue Kreisdiagramme
    nestedDonut: Doughnut,
    radialBar: PolarArea,
    // Neue Streudiagramme
    heatmap: Scatter
  }
  return components[type] || Bar
}

function prepareChartData(chartType, config) {
  switch (chartType.id) {
    case 'bar':
    case 'horizontalBar':
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values || [],
          backgroundColor: config.colors || [],
          borderColor: config.colors || [],
          borderWidth: config.options?.borderWidth || 2,
          borderRadius: config.options?.borderRadius || 8,
          barThickness: config.options?.barThickness,
          minBarLength: config.options?.minBarLength || 0
        }]
      }

    case 'line':
      // Handle vertical orientation - convert to scatter-like data structure
      if (config.options?.orientation === 'vertical') {
        const values = config.values || []
        const labels = config.labels || []
        return {
          labels: [],
          datasets: [{
            label: config.datasetLabel || 'Datensatz',
            data: values.map((val, idx) => ({ x: val, y: idx })),
            backgroundColor: config.colors?.[0] || '#3B82F6',
            borderColor: config.colors?.[0] || '#3B82F6',
            borderWidth: config.options?.lineWidth || 3,
            tension: config.options?.smooth ? (config.options?.tension || 0.4) : 0,
            fill: config.options?.fill || false,
            pointRadius: config.options?.showPoints !== false ? (config.options?.pointRadius || 5) : 0,
            pointStyle: config.options?.pointStyle || 'circle',
            pointBackgroundColor: config.colors?.[0] || '#3B82F6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            showLine: true // Ensure line is drawn
          }]
        }
      }
      
      // Standard horizontal line chart
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values || [],
          backgroundColor: config.colors || [],
          borderColor: config.colors?.[0] || '#3B82F6',
          borderWidth: config.options?.lineWidth || 3,
          tension: config.options?.smooth ? (config.options?.tension || 0.4) : 0,
          fill: config.options?.fill || false,
          pointRadius: config.options?.showPoints !== false ? (config.options?.pointRadius || 5) : 0,
          pointStyle: config.options?.pointStyle || 'circle',
          pointBackgroundColor: config.colors?.[0] || '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      }

    case 'verticalLine':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => ({
            ...ds,
            borderWidth: ds.borderWidth || config.options?.lineWidth || 3,
            tension: config.options?.smooth ? (config.options?.tension || 0.4) : 0,
            fill: config.options?.fill || false,
            pointRadius: config.options?.showPoints !== false ? (config.options?.pointRadius || 5) : 0,
            pointStyle: config.options?.pointStyle || 'circle',
            pointBackgroundColor: ds.borderColor || ds.backgroundColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }))
        }
      }
      return { labels: [], datasets: [] }

    case 'area':
      const areaOpacity = config.options?.fillOpacity !== undefined ? Math.round(config.options.fillOpacity * 2.55).toString(16).padStart(2, '0') : '60'
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values || [],
          backgroundColor: (config.colors?.[0] || '#06B6D4') + areaOpacity,
          borderColor: config.colors?.[0] || '#06B6D4',
          borderWidth: config.options?.lineWidth || 3,
          tension: config.options?.smooth ? (config.options?.tension || 0.4) : 0,
          fill: true,
          pointRadius: config.options?.showPoints !== false ? (config.options?.pointRadius || 5) : 0,
          pointBackgroundColor: config.colors?.[0] || '#06B6D4',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      }

    case 'steppedLine':
      if (config.datasets && Array.isArray(config.datasets)) {
        const steppedOpacity = config.options?.fillOpacity !== undefined ? Math.round(config.options.fillOpacity * 2.55).toString(16).padStart(2, '0') : '40'
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => ({
            ...ds,
            borderWidth: ds.borderWidth || config.options?.lineWidth || 3,
            stepped: true,
            fill: config.options?.fill || false,
            backgroundColor: config.options?.fill ? (ds.borderColor || ds.backgroundColor || '#8B5CF6') + steppedOpacity : 'transparent',
            pointRadius: config.options?.showPoints !== false ? (config.options?.pointRadius || 5) : 0,
            pointStyle: config.options?.pointStyle || 'circle',
            pointBackgroundColor: ds.borderColor || ds.backgroundColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }))
        }
      }
      return { labels: [], datasets: [] }

    case 'scatter':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          datasets: config.datasets.map(ds => {
            // Handle coordinate format conversion if needed
            let processedData = ds.data || []
            if (config.options?.dataFormat === 'coordinates') {
              processedData = processedData.map(point => {
                if (point.longitude !== undefined && point.latitude !== undefined) {
                  return {
                    x: point.longitude || 0,
                    y: point.latitude || 0,
                    label: point.label || ''
                  }
                }
                return point
              })
            }
            
            return {
              ...ds,
              data: processedData,
              backgroundColor: ds.backgroundColor || ds.borderColor || '#8B5CF6',
              borderColor: ds.backgroundColor || ds.borderColor || '#8B5CF6',
              pointRadius: config.options?.pointRadius || 8,
              pointStyle: config.options?.pointStyle || 'circle',
              borderWidth: config.options?.borderWidth || 2,
              pointHoverRadius: (config.options?.pointRadius || 8) + 2
            }
          })
        }
      }
      return { datasets: [] }

    case 'bubble':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          datasets: config.datasets.map(ds => ({
            ...ds,
            backgroundColor: ds.backgroundColor ? ds.backgroundColor + '80' : '#EC489980',
            borderColor: ds.backgroundColor || ds.borderColor || '#EC4899',
            borderWidth: config.options?.borderWidth || 2,
            // Apply pointRadius if set (for fixed size), otherwise use data r values
            pointRadius: config.options?.pointRadius !== undefined && config.options?.pointRadius !== null 
              ? config.options.pointRadius 
              : undefined, // undefined = use r from data
            pointStyle: config.options?.pointStyle || 'circle'
          }))
        }
      }
      return { datasets: [] }

    case 'pie':
    case 'donut':
    case 'polarArea':
      return {
        labels: config.labels || [],
        datasets: [{
          data: config.values || [],
          backgroundColor: config.colors || [],
          borderColor: '#1E293B',
          borderWidth: config.options?.borderWidth || 3,
          hoverOffset: config.options?.hoverOffset || 10
        }]
      }
    
    case 'radar':
      const radarOpacity = config.options?.fillOpacity !== undefined ? Math.round(config.options.fillOpacity * 2.55).toString(16).padStart(2, '0') : '40'
      // Support both old format (values) and new format (datasets)
      if (config.datasets && Array.isArray(config.datasets) && config.datasets.length > 0) {
        return {
          labels: config.labels || [],
          datasets: config.datasets.map((ds, index) => ({
            label: ds.label || `Datensatz ${index + 1}`,
            data: ds.data || [],
            backgroundColor: config.options?.fill !== false ? ((ds.backgroundColor || config.colors?.[index] || config.colors?.[0] || '#22D3EE') + radarOpacity) : 'transparent',
            borderColor: ds.borderColor || ds.backgroundColor || config.colors?.[index] || config.colors?.[0] || '#22D3EE',
            borderWidth: ds.borderWidth || config.options?.lineWidth || 3,
            pointRadius: ds.pointRadius || config.options?.pointRadius || 5,
            pointBackgroundColor: ds.pointBackgroundColor || ds.borderColor || ds.backgroundColor || config.colors?.[index] || config.colors?.[0] || '#22D3EE',
            pointBorderColor: ds.pointBorderColor || '#fff',
            pointBorderWidth: ds.pointBorderWidth || 2
          }))
        }
      }
      // Fallback to old format (single dataset from values)
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Bewertung',
          data: config.values || [],
          backgroundColor: config.options?.fill !== false ? ((config.colors?.[0] || '#22D3EE') + radarOpacity) : 'transparent',
          borderColor: config.colors?.[0] || '#22D3EE',
          borderWidth: config.options?.lineWidth || 3,
          pointRadius: config.options?.pointRadius || 5,
          pointBackgroundColor: config.colors?.[0] || '#22D3EE',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      }

    case 'stackedBar':
    case 'multiLine':
    case 'mixed':
    case 'groupedBar':
    case 'percentageBar':
    case 'segmentedBar':
    case 'nestedDonut':
      // Multi-dataset charts
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => ({
            ...ds,
            borderWidth: ds.borderWidth || (chartType.id.includes('Line') || chartType.id === 'mixed' ? 3 : 2),
            borderRadius: chartType.id.includes('Bar') ? 8 : 0,
            tension: ds.tension !== undefined ? ds.tension : (config.options?.smooth ? 0.4 : 0),
            fill: ds.type === 'line' ? (config.options?.fill || false) : true,
            pointRadius: config.options?.showPoints !== false ? 5 : 0,
            pointBackgroundColor: ds.borderColor || ds.backgroundColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }))
        }
      }
      return { labels: [], datasets: [] }

    // Neue Liniendiagramme
    case 'smoothLine':
    case 'curvedArea':
      if (config.datasets && Array.isArray(config.datasets)) {
        const smoothOpacity = config.options?.fillOpacity !== undefined ? Math.round(config.options.fillOpacity * 2.55).toString(16).padStart(2, '0') : '60'
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => {
            const shouldFill = chartType.id === 'curvedArea' ? (config.options?.fill !== false) : (config.options?.fill || false)
            const bgColor = ds.backgroundColor || ds.borderColor || '#8B5CF6'
            return {
              ...ds,
              borderWidth: ds.borderWidth || config.options?.lineWidth || 3,
              tension: ds.tension !== undefined ? ds.tension : (config.options?.smoothing || 0.4),
              fill: shouldFill,
              backgroundColor: shouldFill ? bgColor + smoothOpacity : 'transparent',
              pointRadius: config.options?.showPoints !== false ? (config.options?.pointRadius || 5) : 0,
              pointStyle: config.options?.pointStyle || 'circle',
              pointBackgroundColor: ds.borderColor || ds.backgroundColor,
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }
          })
        }
      }
      return { labels: [], datasets: [] }

    case 'dashedLine':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => ({
            ...ds,
            borderWidth: ds.borderWidth || config.options?.lineWidth || 2,
            borderDash: ds.borderDash || [],
            tension: ds.tension || 0,
            fill: false,
            pointRadius: config.options?.showPoints !== false ? (config.options?.pointRadius || 5) : 0,
            pointStyle: config.options?.pointStyle || 'circle',
            pointBackgroundColor: ds.borderColor || ds.backgroundColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }))
        }
      }
      return { labels: [], datasets: [] }

    // Neue Kreisdiagramme
    case 'semiCircle':
    case 'sunburst':
      return {
        labels: config.labels || [],
        datasets: [{
          data: config.values || [],
          backgroundColor: config.colors || [],
          borderColor: '#1E293B',
          borderWidth: 3,
          hoverOffset: 10
        }]
      }

    // Neue Streudiagramme
    case 'heatmap':
      if (config.datasets && Array.isArray(config.datasets)) {
        const isCalendarType = config.options?.heatmapType === 'calendar'
        
        return {
          datasets: config.datasets.map(ds => {
            // Calendar heatmap uses different color scale
            if (isCalendarType) {
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
                borderWidth: 2,
                borderColor: '#0F172A',
                pointRadius: config.options?.cellSize || 12,
                pointStyle: 'rect'
              }
            }
            
            // Standard heatmap
            return {
              ...ds,
              pointRadius: config.options?.cellSize || 20,
              pointStyle: 'rect',
              backgroundColor: function(context) {
                const value = context.raw?.v || 0;
                const alpha = value / 100;
                const color = ds.backgroundColor || '#3B82F6';
                // Extract RGB from hex color
                const hex = color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              }
            }
          })
        }
      }
      return { datasets: [] }

    case 'matrix':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          datasets: config.datasets.map(ds => ({
            ...ds,
            backgroundColor: ds.backgroundColor ? ds.backgroundColor + '80' : '#3B82F680',
            borderColor: ds.backgroundColor || ds.borderColor || '#3B82F6',
            borderWidth: config.options?.borderWidth || 2
          }))
        }
      }
      return { datasets: [] }

    case 'radialBar':
      // Use PolarArea for radial bar chart
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values || [],
          backgroundColor: config.colors || [],
          borderColor: config.colors || [],
          borderWidth: config.options?.borderWidth || 2
        }]
      }


    case 'streamGraph':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => ({
            ...ds,
            label: ds.label || 'Stream',
            data: ds.data || [],
            backgroundColor: ds.backgroundColor || '#3B82F6',
            borderColor: ds.backgroundColor || '#3B82F6',
            borderWidth: 0,
            fill: true,
            tension: config.options?.smoothing || 0.4,
            pointRadius: 0
          }))
        }
      }
      return { labels: [], datasets: [] }
    
    default:
      return { labels: [], datasets: [] }
  }
}

function normalizeAnnotationValue(value) {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  if (typeof value === 'number') {
    return value
  }

  const numeric = Number(value)
  return Number.isNaN(numeric) ? value : numeric
}

function transformLineAnnotation(annotation, chartType) {
  const scaleID = annotation.scaleID || (annotation.orientation === 'horizontal' ? 'y' : 'x')
  const value = normalizeAnnotationValue(annotation.value)

  if (!scaleID || value === undefined) {
    return null
  }

  // For horizontal charts, adjust scale ID if not explicitly set
  let finalScaleID = scaleID
  if (['horizontalBar'].includes(chartType.id) && !annotation.scaleID) {
    finalScaleID = annotation.orientation === 'horizontal' ? 'x' : 'y'
  }

  const borderWidth = Number(annotation.borderWidth)
  const result = {
    type: 'line',
    scaleID: finalScaleID,
    value,
    borderColor: annotation.borderColor || '#F97316',
    borderWidth: Number.isNaN(borderWidth) ? 2 : borderWidth,
    display: annotation.display !== false
  }

  if (annotation.endValue !== undefined && annotation.endValue !== '') {
    const endValue = normalizeAnnotationValue(annotation.endValue)
    if (endValue !== undefined) {
      result.endValue = endValue
    }
  }

  if (Array.isArray(annotation.borderDash) && annotation.borderDash.length > 0) {
    result.borderDash = annotation.borderDash.map(segment => Number(segment) || 0)
  }

  if (annotation.labelEnabled && annotation.labelContent) {
    const labelFontSize = Number(annotation.labelFontSize)
    result.label = {
      display: annotation.labelDisplay !== 'legend', // Hide line label if only legend is selected
      content: annotation.labelContent,
      position: annotation.labelPosition || 'center',
      backgroundColor: annotation.labelBackgroundColor || 'rgba(15, 23, 42, 0.75)',
      color: annotation.labelColor || '#F8FAFC',
      font: {
        size: Number.isNaN(labelFontSize) ? 12 : labelFontSize,
        weight: annotation.labelFontWeight || '600',
        family: annotation.labelFontFamily || 'Inter'
      },
      padding: annotation.labelPadding ?? 6
    }
  }

  return result
}

function transformBoxAnnotation(annotation, chartType) {
  // Determine correct scale IDs based on chart type
  let xScaleID = annotation.xScaleID || 'x'
  let yScaleID = annotation.yScaleID || 'y'
  
  // For horizontal charts, swap the scale IDs
  if (['horizontalBar'].includes(chartType.id) && !annotation.xScaleID && !annotation.yScaleID) {
    xScaleID = 'y'
    yScaleID = 'x'
  }

  const result = {
    type: 'box',
    backgroundColor: annotation.backgroundColor || 'rgba(59, 130, 246, 0.15)',
    borderColor: annotation.borderColor || '#3B82F6',
    borderWidth: Number(annotation.borderWidth) || 1,
    display: annotation.display !== false,
    xScaleID,
    yScaleID
  }

  const xMin = normalizeAnnotationValue(annotation.xMin)
  const xMax = normalizeAnnotationValue(annotation.xMax)
  const yMin = normalizeAnnotationValue(annotation.yMin)
  const yMax = normalizeAnnotationValue(annotation.yMax)

  if (xMin !== undefined) result.xMin = xMin
  if (xMax !== undefined) result.xMax = xMax
  if (yMin !== undefined) result.yMin = yMin
  if (yMax !== undefined) result.yMax = yMax

  if (!('xMin' in result) && !('xMax' in result) && !('yMin' in result) && !('yMax' in result)) {
    return null
  }

  if (annotation.labelEnabled && annotation.labelContent) {
    const labelFontSize = Number(annotation.labelFontSize)
    result.label = {
      display: true,
      content: annotation.labelContent,
      position: annotation.labelPosition || 'center',
      color: annotation.labelColor || '#F8FAFC',
      backgroundColor: annotation.labelBackgroundColor || 'rgba(15, 23, 42, 0.8)',
      font: {
        size: Number.isNaN(labelFontSize) ? 12 : labelFontSize,
        weight: annotation.labelFontWeight || '600',
        family: annotation.labelFontFamily || 'Inter'
      },
      padding: annotation.labelPadding ?? 6
    }
  }

  return result
}

function transformLabelAnnotation(annotation, chartType) {
  const xValue = normalizeAnnotationValue(annotation.xValue)
  const yValue = normalizeAnnotationValue(annotation.yValue)

  if (xValue === undefined || yValue === undefined || !annotation.content) {
    return null
  }

  // Determine correct scale IDs based on chart type
  let xScaleID = annotation.xScaleID || 'x'
  let yScaleID = annotation.yScaleID || 'y'
  
  // For horizontal charts, swap the scale IDs
  if (['horizontalBar'].includes(chartType.id) && !annotation.xScaleID && !annotation.yScaleID) {
    xScaleID = 'y'
    yScaleID = 'x'
  }

  const fontSize = Number(annotation.fontSize)
  const result = {
    type: 'label',
    xValue,
    yValue,
    content: annotation.content,
    color: annotation.color || '#F8FAFC',
    backgroundColor: annotation.backgroundColor || 'rgba(15, 23, 42, 0.8)',
    font: {
      size: Number.isNaN(fontSize) ? 12 : fontSize,
      weight: annotation.fontWeight || '600',
      family: annotation.fontFamily || 'Inter'
    },
    padding: annotation.padding ?? 6,
    textAlign: annotation.textAlign || 'center',
    display: annotation.display !== false,
    xScaleID,
    yScaleID
  }

  if (annotation.borderRadius !== undefined && annotation.borderRadius !== null) {
    result.borderRadius = Number(annotation.borderRadius) || 0
  }

  if (annotation.xAdjust !== undefined && annotation.xAdjust !== null && annotation.xAdjust !== '') {
    result.xAdjust = Number(annotation.xAdjust) || 0
  }

  if (annotation.yAdjust !== undefined && annotation.yAdjust !== null && annotation.yAdjust !== '') {
    result.yAdjust = Number(annotation.yAdjust) || 0
  }

  return result
}

function buildAnnotationConfig(annotations = [], chartType) {
  if (!Array.isArray(annotations) || annotations.length === 0) {
    return null
  }

  // Check if chart type supports annotations
  const supportedChartTypes = [
    'bar', 'stackedBar', 'groupedBar', 'percentageBar', 'segmentedBar', 'funnel', 'treemap', 'sankey',
    'line', 'area', 'multiLine', 'steppedLine', 'verticalLine', 'smoothLine', 'dashedLine', 'curvedArea',
    'scatter', 'bubble', 'matrix', 'heatmap', 'mixed', 'horizontalBar', 'streamGraph'
  ]

  if (!supportedChartTypes.includes(chartType.id)) {
    return null
  }

  const entries = {}
  const legendEntries = []

  annotations.forEach((annotation, index) => {
    if (!annotation || typeof annotation !== 'object') {
      return
    }

    const id = annotation.id || `annotation_${index + 1}`
    let parsed = null

    switch (annotation.type) {
      case 'box':
        parsed = transformBoxAnnotation(annotation, chartType)
        break
      case 'label':
        parsed = transformLabelAnnotation(annotation, chartType)
        break
      case 'line':
      default:
        parsed = transformLineAnnotation(annotation, chartType)
        break
    }

    if (parsed) {
      entries[id] = parsed
      
      // Handle legend entries for annotations
      if (annotation.legendEntry && annotation.legendEntry.enabled) {
        legendEntries.push({
          text: annotation.legendEntry.label,
          fillStyle: annotation.borderColor || annotation.color || '#F97316',
          strokeStyle: annotation.borderColor || annotation.color || '#F97316',
          lineWidth: annotation.borderWidth || 2,
          lineDash: annotation.borderDash || [5, 5],
          hidden: !annotation.display
        })
      }
      
      // Handle labelDisplay option for line annotations
      if (annotation.type === 'line' && annotation.labelDisplay) {
        if (annotation.labelDisplay === 'legend' || annotation.labelDisplay === 'both') {
          legendEntries.push({
            text: annotation.label?.content || 'Annotation',
            fillStyle: annotation.borderColor || '#F97316',
            strokeStyle: annotation.borderColor || '#F97316',
            lineWidth: annotation.borderWidth || 2,
            lineDash: annotation.borderDash || [5, 5],
            hidden: !annotation.display
          })
        }
      }
    }
  })

  const result = Object.keys(entries).length > 0 ? entries : null
  
  // Add legend entries to the result if any exist
  if (result && legendEntries.length > 0) {
    result._legendEntries = legendEntries
  }

  return result
}

function prepareChartOptions(chartType, config, backgroundImageObj = null) {
  // Chart types that should not use custom aspect ratio (they use radial/polar scales)
  const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'chord']
  const shouldUseAspectRatio = !noAspectRatioCharts.includes(chartType.id) && 
                                 config.options?.aspectRatio !== null && 
                                 config.options?.aspectRatio !== undefined &&
                                 typeof config.options.aspectRatio === 'number'
  
  // Determine if animation should be enabled
  const animationEnabled = config.options?.animation !== false
  const animationDuration = config.options?.animationDuration || 1000
  
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: shouldUseAspectRatio ? true : true,
    aspectRatio: shouldUseAspectRatio ? config.options.aspectRatio : undefined,
    animation: animationEnabled ? {
      duration: animationDuration,
      easing: 'easeOutQuad'
    } : false,
    plugins: {
      backgroundImage: backgroundImageObj && config.backgroundImage ? {
        image: backgroundImageObj,
        settings: config.backgroundImage
      } : {
        image: null,
        settings: null
      },
      legend: {
        display: config.options?.showLegend !== false,
        position: config.options?.legendPosition || 'top',
        labels: {
          color: config.options?.fontStyles?.legend?.color || '#F8FAFC',
          font: { 
            size: 14, 
            family: config.options?.fontStyles?.legend?.family || 'Inter' 
          }
        }
      },
      title: {
        display: !!config.title,
        text: config.title || '',
        color: config.options?.fontStyles?.title?.color || '#F8FAFC',
        font: { 
          size: 20, 
          family: config.options?.fontStyles?.title?.family || 'Inter', 
          weight: 'bold' 
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: '#475569',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: function(context) {
            // Custom label from point data
            if (context[0]?.raw && typeof context[0].raw === 'object' && context[0].raw.label) {
              return context[0].raw.label
            }
            // Standard label from X-axis
            return context[0]?.label || context[0]?.dataset?.label || ''
          },
          label: function(context) {
            const datasetLabel = context.dataset.label || 'Datensatz'
            const raw = context.raw
            
            // For objects (bubble, scatter, heatmap)
            if (typeof raw === 'object' && raw !== null) {
              const parts = []
              
              // Show dataset name if point has custom label
              if (raw.label) {
                parts.push(` ${datasetLabel}`)
              }
              
              // Bubble/Scatter/Matrix coordinates
              if ('x' in raw && 'y' in raw) {
                parts.push(`X: ${raw.x}`)
                parts.push(`Y: ${raw.y}`)
              }
              
              // Bubble size
              if ('r' in raw) {
                parts.push(`Größe: ${raw.r}`)
              }
              
              // Heatmap intensity
              if ('v' in raw) {
                parts.push(`Intensität: ${raw.v}`)
              }
              
              return parts.length > 0 ? parts.join(' | ') : `${datasetLabel}`
            }
            
            // Standard numeric values
            return `${datasetLabel}: ${context.formattedValue}`
          }
        }
      }
    },
    // Explicitly set scales to undefined for charts that don't use them
    scales: undefined
  }

  const annotationConfig = buildAnnotationConfig(config.options?.annotations, chartType)
  baseOptions.plugins.annotation = annotationConfig
    ? { annotations: annotationConfig }
    : { annotations: {} }

  // Handle legend entries from annotations
  if (annotationConfig && annotationConfig._legendEntries) {
    const legendEntries = annotationConfig._legendEntries
    delete annotationConfig._legendEntries // Remove from annotation config
    
    // Extend the legend with annotation entries
    if (!baseOptions.plugins.legend) {
      baseOptions.plugins.legend = {}
    }
    
    // Add custom legend labels for annotations
    baseOptions.plugins.legend.labels = {
      ...baseOptions.plugins.legend.labels,
      generateLabels: function(chart) {
        const original = ChartJS.defaults.plugins.legend.labels.generateLabels
        const labels = original.call(this, chart)
        
        // Add annotation legend entries
        legendEntries.forEach(entry => {
          labels.push({
            text: entry.text,
            fillStyle: entry.fillStyle,
            strokeStyle: entry.strokeStyle,
            lineWidth: entry.lineWidth,
            lineDash: entry.lineDash,
            hidden: entry.hidden,
            datasetIndex: -1, // Mark as annotation
            index: -1
          })
        })
        
        return labels
      }
    }
  }

  // Bar charts
  if (['bar', 'stackedBar', 'groupedBar', 'percentageBar', 'segmentedBar'].includes(chartType.id)) {
    // Handle orientation option
    if (chartType.id === 'bar' && config.options?.orientation === 'horizontal') {
      baseOptions.indexAxis = 'y'
    } else if (chartType.id === 'stackedBar' && config.options?.orientation === 'horizontal') {
      baseOptions.indexAxis = 'y'
    }
    
    baseOptions.scales = {
      y: {
        beginAtZero: config.options?.beginAtZero !== false,
        stacked: ['stackedBar', 'segmentedBar'].includes(chartType.id) || (chartType.id === 'percentageBar' && config.options?.stacked) || (config.options?.stacked),
        min: config.options?.yAxisMin !== undefined && config.options?.yAxisMin !== null ? config.options.yAxisMin : undefined,
        max: config.options?.yAxisMax !== undefined && config.options?.yAxisMax !== null ? config.options.yAxisMax : undefined,
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
          font: { 
            size: 12,
            family: config.options?.fontStyles?.ticks?.family || 'Inter'
          },
          stepSize: config.options?.yAxisStep !== undefined && config.options?.yAxisStep !== null ? config.options.yAxisStep : undefined
        },
        title: {
          display: !!config.options?.yAxisLabel,
          text: config.options?.yAxisLabel || '',
          color: config.options?.fontStyles?.yAxis?.color || '#F8FAFC',
          font: { 
            size: 13, 
            family: config.options?.fontStyles?.yAxis?.family || 'Inter' 
          }
        }
      },
      x: {
        stacked: ['stackedBar', 'segmentedBar'].includes(chartType.id) || (chartType.id === 'percentageBar' && config.options?.stacked) || (config.options?.stacked),
        grid: {
          display: false
        },
        ticks: {
          color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
          font: { 
            size: 12,
            family: config.options?.fontStyles?.ticks?.family || 'Inter'
          }
        },
        title: {
          display: !!config.options?.xAxisLabel,
          text: config.options?.xAxisLabel || '',
          color: config.options?.fontStyles?.xAxis?.color || '#F8FAFC',
          font: { 
            size: 13, 
            family: config.options?.fontStyles?.xAxis?.family || 'Inter' 
          }
        }
      }
    }
    
    // Apply bar-specific options
    if (config.options?.barThickness) {
      baseOptions.barThickness = config.options.barThickness
    }
  }

  // Horizontal bar
  if (chartType.id === 'horizontalBar') {
    baseOptions.indexAxis = 'y'
    baseOptions.scales = {
      x: {
        beginAtZero: config.options?.beginAtZero !== false,
        min: config.options?.yAxisMin !== undefined && config.options?.yAxisMin !== null ? config.options.yAxisMin : undefined,
        max: config.options?.yAxisMax !== undefined && config.options?.yAxisMax !== null ? config.options.yAxisMax : undefined,
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
          font: { 
            size: 12,
            family: config.options?.fontStyles?.ticks?.family || 'Inter'
          },
          stepSize: config.options?.yAxisStep !== undefined && config.options?.yAxisStep !== null ? config.options.yAxisStep : undefined
        },
        title: {
          display: !!config.options?.xAxisLabel,
          text: config.options?.xAxisLabel || '',
          color: config.options?.fontStyles?.xAxis?.color || '#F8FAFC',
          font: { 
            size: 13, 
            family: config.options?.fontStyles?.xAxis?.family || 'Inter' 
          }
        }
      },
      y: {
        stacked: true, // Enable stacking for range bars
        grid: {
          display: false
        },
        ticks: {
          color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
          font: { 
            size: 12,
            family: config.options?.fontStyles?.ticks?.family || 'Inter'
          }
        },
        title: {
          display: !!config.options?.yAxisLabel,
          text: config.options?.yAxisLabel || '',
          color: config.options?.fontStyles?.yAxis?.color || '#F8FAFC',
          font: { 
            size: 13, 
            family: config.options?.fontStyles?.yAxis?.family || 'Inter' 
          }
        }
      }
    }
    
    if (config.options?.barThickness) {
      baseOptions.barThickness = config.options.barThickness
    }
  }

  // Line charts
  if (['line', 'area', 'multiLine', 'steppedLine', 'verticalLine', 'smoothLine', 'dashedLine', 'curvedArea'].includes(chartType.id)) {
    // Handle orientation option for line charts (vertical = swap axes)
    if (chartType.id === 'line' && config.options?.orientation === 'vertical') {
      // For vertical line charts, use scatter-like scales (x/y swapped)
      baseOptions.scales = {
        x: {
          type: 'linear',
          beginAtZero: config.options?.beginAtZero !== false,
          min: config.options?.yAxisMin !== undefined && config.options?.yAxisMin !== null ? config.options.yAxisMin : undefined,
          max: config.options?.yAxisMax !== undefined && config.options?.yAxisMax !== null ? config.options.yAxisMax : undefined,
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            },
            stepSize: config.options?.yAxisStep !== undefined && config.options?.yAxisStep !== null ? config.options.yAxisStep : undefined
          },
          title: {
            display: !!config.options?.yAxisLabel,
            text: config.options?.yAxisLabel || '',
            color: config.options?.fontStyles?.yAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.yAxis?.family || 'Inter' 
            }
          }
        },
        y: {
          type: 'linear',
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            }
          },
          title: {
            display: !!config.options?.xAxisLabel,
            text: config.options?.xAxisLabel || '',
            color: config.options?.fontStyles?.xAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.xAxis?.family || 'Inter' 
            }
          }
        }
      }
    } else {
      // Standard horizontal line chart scales
      baseOptions.scales = {
        y: {
          beginAtZero: config.options?.beginAtZero !== false,
          min: config.options?.yAxisMin !== undefined && config.options?.yAxisMin !== null ? config.options.yAxisMin : undefined,
          max: config.options?.yAxisMax !== undefined && config.options?.yAxisMax !== null ? config.options.yAxisMax : undefined,
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            },
            stepSize: config.options?.yAxisStep !== undefined && config.options?.yAxisStep !== null ? config.options.yAxisStep : undefined
          },
          title: {
            display: !!config.options?.yAxisLabel,
            text: config.options?.yAxisLabel || '',
            color: config.options?.fontStyles?.yAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.yAxis?.family || 'Inter' 
            }
          }
        },
        x: {
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            }
          },
          title: {
            display: !!config.options?.xAxisLabel,
            text: config.options?.xAxisLabel || '',
            color: config.options?.fontStyles?.xAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.xAxis?.family || 'Inter' 
            }
          }
        }
      }
    }
  }

  // Scatter & Bubble charts
  if (['scatter', 'bubble', 'matrix'].includes(chartType.id)) {
    // Handle coordinate format for scatter
    if (chartType.id === 'scatter' && config.options?.dataFormat === 'coordinates') {
      const aspectRatio = config.options?.aspectRatio || 'auto'
      
      baseOptions.scales = {
        y: {
          beginAtZero: false,
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            },
            callback: function(value) {
              return value.toFixed(2) + '°'
            }
          },
          title: {
            display: !!config.options?.yAxisLabel,
            text: config.options?.yAxisLabel || 'Latitude (°)',
            color: config.options?.fontStyles?.yAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.yAxis?.family || 'Inter' 
            }
          }
        },
        x: {
          beginAtZero: false,
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            },
            callback: function(value) {
              return value.toFixed(2) + '°'
            }
          },
          title: {
            display: !!config.options?.xAxisLabel,
            text: config.options?.xAxisLabel || 'Longitude (°)',
            color: config.options?.fontStyles?.xAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.xAxis?.family || 'Inter' 
            }
          }
        }
      }
      
      // Handle aspect ratio
      if (aspectRatio === 'equal') {
        baseOptions.aspectRatio = 1
      } else if (aspectRatio === 'mercator') {
        baseOptions.aspectRatio = 1
      }
      
      // Custom tooltip for coordinates
      baseOptions.plugins.tooltip.callbacks.label = function(context) {
        const datasetLabel = context.dataset.label || 'Standort'
        const raw = context.raw
        
        if (typeof raw === 'object' && raw !== null) {
          const parts = []
          
          if (raw.label) {
            parts.push(` ${raw.label}`)
          } else {
            parts.push(datasetLabel)
          }
          
          parts.push(`Longitude: ${raw.x?.toFixed(4) || 0}°`)
          parts.push(`Latitude: ${raw.y?.toFixed(4) || 0}°`)
          
          return parts.join('\n')
        }
        
        return `${datasetLabel}: (${context.parsed.x}, ${context.parsed.y})`
      }
      
      // Show coordinate labels if enabled
      if (config.options?.showCoordinateLabels !== false) {
        baseOptions.plugins.customValueLabels = {
          display: true,
          layout: 'default',
          offsetY: 10,
          color: config.options?.fontStyles?.valueLabels?.color || '#F8FAFC',
          font: { 
            size: 10, 
            weight: '600',
            family: config.options?.fontStyles?.valueLabels?.family || 'Inter'
          },
          position: config.options?.labelPosition || 'top'
        }
      }
    } else {
      // Standard scatter/bubble scales
      baseOptions.scales = {
        y: {
          beginAtZero: config.options?.beginAtZero !== false,
          min: config.options?.yAxisMin !== undefined && config.options?.yAxisMin !== null ? config.options.yAxisMin : undefined,
          max: config.options?.yAxisMax !== undefined && config.options?.yAxisMax !== null ? config.options.yAxisMax : undefined,
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            },
            stepSize: config.options?.yAxisStep !== undefined && config.options?.yAxisStep !== null ? config.options.yAxisStep : undefined
          },
          title: {
            display: !!config.options?.yAxisLabel,
            text: config.options?.yAxisLabel || '',
            color: config.options?.fontStyles?.yAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.yAxis?.family || 'Inter' 
            }
          }
        },
        x: {
          beginAtZero: config.options?.beginAtZero !== false,
          min: config.options?.xAxisMin !== undefined && config.options?.xAxisMin !== null ? config.options.xAxisMin : undefined,
          max: config.options?.xAxisMax !== undefined && config.options?.xAxisMax !== null ? config.options.xAxisMax : undefined,
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            },
            stepSize: config.options?.xAxisStep !== undefined && config.options?.xAxisStep !== null ? config.options.xAxisStep : undefined
          },
          title: {
            display: !!config.options?.xAxisLabel,
            text: config.options?.xAxisLabel || '',
            color: config.options?.fontStyles?.xAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.xAxis?.family || 'Inter' 
            }
          }
        }
      }
    }
  }
  
  // Heatmap
  if (chartType.id === 'heatmap') {
    const isCalendarType = config.options?.heatmapType === 'calendar'
    
    if (isCalendarType) {
      baseOptions.scales = {
        y: { 
          type: 'linear',
          display: config.options?.showWeekdayLabels !== false,
          grid: { display: false },
          ticks: {
            color: '#CBD5E1',
            font: { size: 10 }
          }
        },
        x: { 
          type: 'linear',
          display: config.options?.showMonthLabels !== false,
          grid: { display: false },
          ticks: {
            color: '#CBD5E1',
            font: { size: 10 }
          }
        }
      }
    } else {
      baseOptions.scales = {
        y: {
          type: 'category',
          labels: config.yLabels || [],
          display: true,
          offset: true,
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            }
          },
          title: {
            display: !!config.options?.yAxisLabel,
            text: config.options?.yAxisLabel || '',
            color: config.options?.fontStyles?.yAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.yAxis?.family || 'Inter' 
            }
          }
        },
        x: {
          type: 'category',
          labels: config.labels || [],
          display: true,
          offset: true,
          grid: {
            display: config.options?.showGrid !== false,
            color: config.options?.gridColor || '#334155'
          },
          ticks: {
            color: config.options?.fontStyles?.ticks?.color || '#CBD5E1',
            font: { 
              size: 12,
              family: config.options?.fontStyles?.ticks?.family || 'Inter'
            }
          },
          title: {
            display: !!config.options?.xAxisLabel,
            text: config.options?.xAxisLabel || '',
            color: config.options?.fontStyles?.xAxis?.color || '#F8FAFC',
            font: { 
              size: 13, 
              family: config.options?.fontStyles?.xAxis?.family || 'Inter' 
            }
          }
        }
      }
    }
  }

  // Mixed chart
  if (chartType.id === 'mixed') {
    baseOptions.scales = {
      y: {
        beginAtZero: true,
        grid: {
          display: config.options?.showGrid !== false,
          color: '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        }
      }
    }
  }

  // Radar
  if (chartType.id === 'radar') {
    // Calculate dynamic max if autoScale is enabled
    let scaleMax = config.options?.scaleMax || 100
    if (config.options?.autoScale !== false) {
      // Find maximum value across all datasets
      const allValues = []
      if (config.datasets && Array.isArray(config.datasets) && config.datasets.length > 0) {
        config.datasets.forEach(ds => {
          if (ds.data && Array.isArray(ds.data)) {
            ds.data.forEach(val => {
              if (typeof val === 'number' && !isNaN(val)) {
                allValues.push(val)
              }
            })
          }
        })
      } else if (config.values && Array.isArray(config.values)) {
        config.values.forEach(val => {
          if (typeof val === 'number' && !isNaN(val)) {
            allValues.push(val)
          }
        })
      }
      
      if (allValues.length > 0) {
        const maxValue = Math.max(...allValues)
        // Round up to next step size, with some padding
        const stepSize = config.options?.scaleStepSize || 20
        scaleMax = Math.ceil((maxValue * 1.1) / stepSize) * stepSize
        // Ensure minimum of stepSize
        if (scaleMax < stepSize) scaleMax = stepSize
      }
    }
    
    baseOptions.scales = {
      r: {
        beginAtZero: true,
        min: config.options?.scaleMin || 0,
        max: scaleMax,
        ticks: {
          stepSize: config.options?.scaleStepSize || 20,
          color: '#CBD5E1',
          backdropColor: 'transparent',
          font: { size: 12 }
        },
        grid: {
          color: config.options?.gridColor || '#334155'
        },
        pointLabels: {
          color: '#F8FAFC',
          font: { size: 13, weight: '500' }
        }
      }
    }
    
    // Add showValues support for radar charts
    if (config.options?.showValues) {
      baseOptions.plugins = {
        ...baseOptions.plugins,
        customValueLabels: {
          display: true,
          layout: 'radar',
          color: config.options?.fontStyles?.valueLabels?.color || '#F8FAFC',
          font: { 
            family: config.options?.fontStyles?.valueLabels?.family || 'Inter', 
            weight: '600', 
            size: 12 
          },
          offsetY: -5
        }
      }
    } else {
      baseOptions.plugins = {
        ...baseOptions.plugins,
        customValueLabels: { display: false }
      }
    }
  }

  // Polar Area
  if (chartType.id === 'polarArea') {
    if (config.options?.startAngle !== undefined) {
      baseOptions.rotation = config.options.startAngle
    }
    baseOptions.scales = {
      r: {
        ticks: {
          backdropColor: 'transparent',
          color: '#CBD5E1'
        },
        grid: {
          color: config.options?.gridColor || '#334155'
        }
      }
    }
  }

  // Pie Chart (now supports all variants: pie, donut, semiCircle, sunburst, chord, gauge)
  if (chartType.id === 'pie') {
    // Handle cutout or innerRadius
    if (config.options?.innerRadius !== undefined && config.options?.innerRadius !== null) {
      baseOptions.cutout = `${config.options.innerRadius}%`
    } else if (config.options?.cutout !== undefined) {
      const cutoutValue = config.options.cutout
      baseOptions.cutout = typeof cutoutValue === 'number' ? `${cutoutValue}%` : cutoutValue
    } else {
      baseOptions.cutout = '0%' // Default: full pie
    }
    
    // Handle rotation
    if (config.options?.rotation !== undefined) {
      baseOptions.rotation = config.options.rotation
    } else if (config.options?.startAngle !== undefined) {
      baseOptions.rotation = config.options.startAngle
    }
    
    // Handle circumference (for semi-circle, etc.)
    if (config.options?.circumference !== undefined) {
      baseOptions.circumference = config.options.circumference
    }
    
    // Handle gauge needle (showNeedle and currentValue)
    if (config.options?.showNeedle && config.currentValue !== null && config.currentValue !== undefined) {
      // Store gauge config for custom rendering
      baseOptions.plugins = {
        ...baseOptions.plugins,
        gaugeNeedle: {
          enabled: true,
          currentValue: config.currentValue,
          maxValue: config.values ? Math.max(...config.values.filter(v => typeof v === 'number')) : 100
        }
      }
    }
  }

  // Radial Bar
  if (chartType.id === 'radialBar') {
    baseOptions.scales = {
      r: {
        beginAtZero: true,
        grid: {
          display: config.options?.gridLines !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          display: false
        }
      }
    }
    baseOptions.startAngle = config.options?.startAngle || 0
  }


  // Stream Graph
  if (chartType.id === 'streamGraph') {
    baseOptions.scales = {
      y: {
        stacked: true,
        beginAtZero: false,
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        }
      },
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        }
      }
    }
  }

  const valueLabelChartTypes = {
    bar: 'verticalBar',
    stackedBar: 'verticalBar',
    groupedBar: 'verticalBar',
    percentageBar: 'verticalBar',
    segmentedBar: 'verticalBar',
    horizontalBar: 'horizontalBar',
    donut: 'doughnut',
    pie: 'doughnut',
    radialBar: 'polar',
    radar: 'radar'
  }

  // Radar charts handle showValues separately above, so skip here
  if (valueLabelChartTypes[chartType.id] && chartType.id !== 'radar') {
    const layout = valueLabelChartTypes[chartType.id]
    const pluginConfig = {
      display: !!config.options?.showValues,
      layout,
      color: config.options?.fontStyles?.valueLabels?.color || '#F8FAFC',
      font: { 
        family: config.options?.fontStyles?.valueLabels?.family || 'Inter', 
        weight: '600', 
        size: 12 
      },
      offsetX: layout === 'horizontalBar' ? 12 : 0,
      offsetY: layout === 'verticalBar' ? 10 : 0,
      showPercentages: config.options?.showPercentages || false
    }

    baseOptions.plugins = {
      ...baseOptions.plugins,
      customValueLabels: pluginConfig
    }
  } else {
    baseOptions.plugins = {
      ...baseOptions.plugins,
      customValueLabels: { display: false }
    }
  }

  return baseOptions
}

const chartTypeShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  category: PropTypes.string,
  icon: PropTypes.string,
  description: PropTypes.string,
  configSchema: PropTypes.object.isRequired
})

ChartPreview.propTypes = {
  chartType: chartTypeShape,
  config: PropTypes.object.isRequired,
  chartRef: PropTypes.shape({ current: PropTypes.any }),
  onDataPointClick: PropTypes.func,
  compact: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string
}

ChartWrapper.propTypes = {
  chartType: chartTypeShape.isRequired,
  data: PropTypes.object,
  options: PropTypes.object,
  chartRef: PropTypes.shape({ current: PropTypes.any }),
  onDataPointClick: PropTypes.func
}

