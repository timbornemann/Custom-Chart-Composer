import { useEffect, useState, useRef } from 'react'
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
  valueLabelPlugin()
)

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
          const text = formatted === null || formatted === undefined ? '' : String(formatted)
          if (!text || text.trim().length === 0) {
            return
          }

          const position = element.tooltipPosition()
          let drawX = position.x
          let drawY = position.y
          const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue)
          const isNumeric = Number.isFinite(numericValue)

          if (layout === 'verticalBar') {
            ctx.textAlign = 'center'
            ctx.textBaseline = isNumeric && numericValue < 0 ? 'top' : 'bottom'
            drawY = isNumeric && numericValue < 0 ? position.y + offsetY : position.y - offsetY
          } else if (layout === 'horizontalBar') {
            ctx.textAlign = isNumeric && numericValue < 0 ? 'right' : 'left'
            ctx.textBaseline = 'middle'
            drawX = isNumeric && numericValue < 0 ? position.x - offsetX : position.x + offsetX
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
function ChartWrapper({ chartType, data, options, chartRef }) {
  const ChartComponent = getChartComponent(chartType.id)
  return <ChartComponent ref={chartRef} data={data} options={options} />
}

export default function ChartPreview({ chartType, config, chartRef }) {
  const [chartData, setChartData] = useState(null)
  const [chartOptions, setChartOptions] = useState(null)
  const [mountKey, setMountKey] = useState(0)
  const localChartRef = useRef(null)

  // Sync local ref with parent ref
  useEffect(() => {
    if (localChartRef.current && chartRef) {
      chartRef.current = localChartRef.current
    }
  }, [chartRef, chartData])

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
    const timeoutId = setTimeout(() => {
      setMountKey(prev => prev + 1)
      const data = prepareChartData(chartType, config)
      const options = prepareChartOptions(chartType, config)
      
      setChartData(data)
      setChartOptions(options)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [chartType, config, chartRef])

  if (!chartType || !config || !chartData) {
    return (
      <div className="bg-dark-secondary rounded-2xl shadow-lg p-6 flex items-center justify-center h-[600px]">
        <div className="text-dark-textGray">Wähle einen Diagrammtyp aus...</div>
      </div>
    )
  }

  // Get background color from config, default to dark theme
  const backgroundColor = config.backgroundColor || '#0F172A'
  const isTransparent = backgroundColor === 'transparent'

  return (
    <div className="bg-dark-secondary rounded-2xl shadow-lg p-6 flex flex-col h-[600px]">
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-dark-textLight">Vorschau</h2>
        <p className="text-sm text-dark-textGray">{chartType.name}</p>
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
          <div className="w-full h-full max-w-[600px] max-h-[450px] flex items-center justify-center">
            <ChartErrorBoundary chartType={chartType}>
              <ChartWrapper
                key={`${chartType.id}-${mountKey}`}
                chartType={chartType}
                data={chartData}
                options={chartOptions}
                chartRef={localChartRef}
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
    waterfall: Bar,
    rangeBar: Bar,
    candlestick: Bar,
    // Neue Liniendiagramme
    smoothLine: Line,
    dashedLine: Line,
    curvedArea: Line,
    streamGraph: Line,
    // Neue Kreisdiagramme
    semiCircle: Doughnut,
    nestedDonut: Doughnut,
    sunburst: Doughnut,
    chord: Doughnut,
    radialBar: PolarArea,
    // Neue Streudiagramme
    heatmap: Scatter,
    matrix: Bubble,
    calendarHeatmap: Scatter,
    // Neue spezielle Diagramme
    gauge: Doughnut,
    funnel: Bar,
    treemap: Bar,
    boxPlot: Bar,
    violin: Bar,
    sankey: Bar
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
    case 'verticalLine':
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
      const steppedOpacity = config.options?.fillOpacity !== undefined ? Math.round(config.options.fillOpacity * 2.55).toString(16).padStart(2, '0') : '40'
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values || [],
          backgroundColor: config.options?.fill ? (config.colors?.[0] || '#8B5CF6') + steppedOpacity : 'transparent',
          borderColor: config.colors?.[0] || '#8B5CF6',
          borderWidth: config.options?.lineWidth || 3,
          stepped: true,
          fill: config.options?.fill || false,
          pointRadius: config.options?.showPoints !== false ? (config.options?.pointRadius || 5) : 0,
          pointStyle: config.options?.pointStyle || 'circle',
          pointBackgroundColor: config.colors?.[0] || '#8B5CF6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      }

    case 'scatter':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          datasets: config.datasets.map(ds => ({
            ...ds,
            backgroundColor: ds.backgroundColor || ds.borderColor || '#8B5CF6',
            borderColor: ds.backgroundColor || ds.borderColor || '#8B5CF6',
            pointRadius: config.options?.pointRadius || 8,
            pointStyle: config.options?.pointStyle || 'circle',
            borderWidth: config.options?.borderWidth || 2,
            pointHoverRadius: (config.options?.pointRadius || 8) + 2
          }))
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
            borderWidth: config.options?.borderWidth || 2
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

    // Neue Balkendiagramme
    case 'waterfall':
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Wert',
          data: config.values || [],
          backgroundColor: config.colors || [],
          borderColor: config.colors || [],
          borderWidth: 2,
          borderRadius: 8
        }]
      }

    case 'rangeBar':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => ({
            ...ds,
            borderWidth: 2,
            borderRadius: 8
          }))
        }
      }
      return { labels: [], datasets: [] }

    // Neue Kreisdiagramme
    case 'semiCircle':
    case 'sunburst':
    case 'gauge':
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
        return {
          datasets: config.datasets.map(ds => ({
            ...ds,
            pointRadius: 20,
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
          }))
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

    // Neue spezielle Diagramme
    case 'funnel':
    case 'treemap':
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Wert',
          data: config.values || [],
          backgroundColor: config.colors || [],
          borderColor: config.colors || [],
          borderWidth: 2,
          borderRadius: 8
        }]
      }

    // Neue Diagrammtypen
    case 'boxPlot':
    case 'violin':
    case 'candlestick':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => ({
            label: ds.label || 'Datensatz',
            data: ds.data || [],
            backgroundColor: ds.backgroundColor || '#3B82F6',
            borderColor: ds.borderColor || '#1E3A8A',
            borderWidth: 2,
            borderRadius: 4
          }))
        }
      }
      return { labels: [], datasets: [] }

    case 'radialBar':
    case 'sankey':
    case 'chord':
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values || [],
          backgroundColor: config.colors || [],
          borderWidth: 0
        }]
      }

    case 'calendarHeatmap':
      return {
        datasets: [{
          label: config.datasetLabel || 'Aktivität',
          data: config.values || [],
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

function prepareChartOptions(chartType, config) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: config.options?.animation !== false ? (config.options?.animationDuration || 1000) : 0
    },
    plugins: {
      legend: {
        display: config.options?.showLegend !== false,
        position: config.options?.legendPosition || 'top',
        labels: {
          color: '#F8FAFC',
          font: { size: 14, family: 'Inter' }
        }
      },
      title: {
        display: !!config.title,
        text: config.title || '',
        color: '#F8FAFC',
        font: { size: 20, family: 'Inter', weight: 'bold' }
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
                parts.push(`📊 ${datasetLabel}`)
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

  // Bar charts
  if (['bar', 'stackedBar', 'groupedBar', 'percentageBar', 'segmentedBar', 'waterfall', 'funnel', 'treemap', 'boxPlot', 'violin', 'candlestick', 'sankey'].includes(chartType.id)) {
    baseOptions.scales = {
      y: {
        beginAtZero: config.options?.beginAtZero !== false,
        stacked: ['stackedBar', 'segmentedBar', 'boxPlot', 'violin', 'candlestick'].includes(chartType.id) || (chartType.id === 'percentageBar' && config.options?.stacked) || (config.options?.stacked),
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.yAxisLabel,
          text: config.options?.yAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      },
      x: {
        stacked: ['stackedBar', 'segmentedBar', 'boxPlot', 'violin', 'candlestick'].includes(chartType.id) || (chartType.id === 'percentageBar' && config.options?.stacked) || (config.options?.stacked),
        grid: {
          display: false
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.xAxisLabel,
          text: config.options?.xAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      }
    }
    
    // Apply bar-specific options
    if (config.options?.barThickness) {
      baseOptions.barThickness = config.options.barThickness
    }
  }

  // Range Bar (horizontal with special config)
  if (chartType.id === 'rangeBar') {
    baseOptions.indexAxis = config.options?.horizontal ? 'y' : 'x'
    baseOptions.scales = {
      x: {
        beginAtZero: config.options?.beginAtZero !== false,
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.xAxisLabel,
          text: config.options?.xAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.yAxisLabel,
          text: config.options?.yAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      }
    }
  }

  // Horizontal bar
  if (chartType.id === 'horizontalBar') {
    baseOptions.indexAxis = 'y'
    baseOptions.scales = {
      x: {
        beginAtZero: config.options?.beginAtZero !== false,
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.xAxisLabel,
          text: config.options?.xAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.yAxisLabel,
          text: config.options?.yAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      }
    }
    
    if (config.options?.barThickness) {
      baseOptions.barThickness = config.options.barThickness
    }
  }

  // Line charts
  if (['line', 'area', 'multiLine', 'steppedLine', 'verticalLine', 'smoothLine', 'dashedLine', 'curvedArea'].includes(chartType.id)) {
    baseOptions.scales = {
      y: {
        beginAtZero: config.options?.beginAtZero !== false,
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.yAxisLabel,
          text: config.options?.yAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      },
      x: {
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.xAxisLabel,
          text: config.options?.xAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      }
    }
  }

  // Scatter & Bubble
  if (['scatter', 'bubble', 'matrix', 'calendarHeatmap'].includes(chartType.id)) {
    baseOptions.scales = {
      y: {
        beginAtZero: config.options?.beginAtZero !== false,
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.yAxisLabel,
          text: config.options?.yAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      },
      x: {
        beginAtZero: config.options?.beginAtZero !== false,
        grid: {
          display: config.options?.showGrid !== false,
          color: config.options?.gridColor || '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        },
        title: {
          display: !!config.options?.xAxisLabel,
          text: config.options?.xAxisLabel || '',
          color: '#F8FAFC',
          font: { size: 13, family: 'Inter' }
        }
      }
    }
  }

  // Heatmap (categorical axes)
  if (chartType.id === 'heatmap') {
    baseOptions.scales = {
      y: {
        type: 'category',
        labels: config.yLabels || ['06:00', '12:00', '18:00'],
        offset: true,
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
        type: 'category',
        labels: config.labels || ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
        offset: true,
        grid: {
          display: config.options?.showGrid !== false,
          color: '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
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
    baseOptions.scales = {
      r: {
        beginAtZero: true,
        min: config.options?.scaleMin || 0,
        max: config.options?.scaleMax || 100,
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

  // Donut
  if (chartType.id === 'donut') {
    baseOptions.cutout = `${config.options?.cutout || 65}%`
    if (config.options?.startAngle !== undefined) {
      baseOptions.rotation = config.options.startAngle
    }
  }

  // Nested Donut
  if (chartType.id === 'nestedDonut') {
    const cutoutValue = config.options?.cutout !== undefined ? config.options.cutout : 50
    baseOptions.cutout = typeof cutoutValue === 'number' ? `${cutoutValue}%` : cutoutValue
  }

  // Semi Circle
  if (chartType.id === 'semiCircle') {
    baseOptions.rotation = config.options?.rotation || -90
    baseOptions.circumference = config.options?.circumference || 180
    baseOptions.cutout = config.options?.cutout || '0%'
  }

  // Gauge
  if (chartType.id === 'gauge') {
    baseOptions.rotation = config.options?.rotation || -90
    baseOptions.circumference = config.options?.circumference || 180
    const cutoutValue = config.options?.cutout !== undefined ? config.options.cutout : 75
    baseOptions.cutout = typeof cutoutValue === 'number' ? `${cutoutValue}%` : cutoutValue
  }

  // Sunburst
  if (chartType.id === 'sunburst') {
    const cutoutValue = config.options?.cutout !== undefined ? config.options.cutout : 30
    baseOptions.cutout = typeof cutoutValue === 'number' ? `${cutoutValue}%` : cutoutValue
    baseOptions.rotation = config.options?.rotation || 0
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

  // Chord
  if (chartType.id === 'chord') {
    baseOptions.cutout = config.options?.innerRadius ? `${config.options.innerRadius}%` : '40%'
  }

  // Calendar Heatmap
  if (chartType.id === 'calendarHeatmap') {
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
    waterfall: 'verticalBar',
    funnel: 'verticalBar',
    treemap: 'verticalBar',
    horizontalBar: 'horizontalBar',
    donut: 'doughnut',
    pie: 'doughnut',
    chord: 'doughnut',
    sankey: 'verticalBar',
    radialBar: 'polar'
  }

  if (valueLabelChartTypes[chartType.id]) {
    const layout = valueLabelChartTypes[chartType.id]
    const pluginConfig = {
      display: !!config.options?.showValues,
      layout,
      color: '#F8FAFC',
      font: { family: 'Inter', weight: '600', size: 12 },
      offsetX: layout === 'horizontalBar' ? 12 : 0,
      offsetY: layout === 'verticalBar' ? 10 : 0
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
  chartRef: PropTypes.shape({ current: PropTypes.any })
}

