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
  Filler
)

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

  return (
    <div className="bg-dark-secondary rounded-2xl shadow-lg p-6 flex flex-col h-[600px]">
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-dark-textLight">Vorschau</h2>
        <p className="text-sm text-dark-textGray">{chartType.name}</p>
      </div>
      <div className="bg-dark-bg rounded-xl p-6 flex items-center justify-center flex-1">
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
    // Neue Liniendiagramme
    smoothLine: Line,
    dashedLine: Line,
    curvedArea: Line,
    // Neue Kreisdiagramme
    semiCircle: Doughnut,
    nestedDonut: Doughnut,
    sunburst: Doughnut,
    // Neue Streudiagramme
    heatmap: Scatter,
    matrix: Bubble,
    // Neue spezielle Diagramme
    gauge: Doughnut,
    funnel: Bar,
    treemap: Bar
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
          borderWidth: 2,
          borderRadius: 8
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
          borderWidth: 3,
          tension: config.options?.smooth ? 0.4 : 0,
          fill: config.options?.fill || false,
          pointRadius: config.options?.showPoints !== false ? 5 : 0,
          pointBackgroundColor: config.colors?.[0] || '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      }

    case 'area':
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values || [],
          backgroundColor: (config.colors?.[0] || '#06B6D4') + '60',
          borderColor: config.colors?.[0] || '#06B6D4',
          borderWidth: 3,
          tension: config.options?.smooth ? 0.4 : 0,
          fill: true,
          pointRadius: config.options?.showPoints !== false ? 5 : 0,
          pointBackgroundColor: config.colors?.[0] || '#06B6D4',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      }

    case 'steppedLine':
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values || [],
          backgroundColor: config.options?.fill ? (config.colors?.[0] || '#8B5CF6') + '40' : 'transparent',
          borderColor: config.colors?.[0] || '#8B5CF6',
          borderWidth: 3,
          stepped: true,
          fill: config.options?.fill || false,
          pointRadius: config.options?.showPoints !== false ? 5 : 0,
          pointBackgroundColor: config.colors?.[0] || '#8B5CF6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      }

    case 'scatter':
      return {
        datasets: [{
          label: config.labels?.[0] || 'Datenpunkt',
          data: config.values || [],
          backgroundColor: config.colors?.[0] || '#8B5CF6',
          borderColor: config.colors?.[0] || '#8B5CF6',
          pointRadius: config.options?.pointSize || 8,
          pointHoverRadius: (config.options?.pointSize || 8) + 2
        }]
      }

    case 'bubble':
      return {
        datasets: [{
          label: config.labels?.[0] || 'Dataset 1',
          data: config.values || [],
          backgroundColor: (config.colors?.[0] || '#EC4899') + '80',
          borderColor: config.colors?.[0] || '#EC4899',
          borderWidth: 2
        }]
      }
    
    case 'pie':
    case 'donut':
    case 'polarArea':
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
    
    case 'radar':
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Bewertung',
          data: config.values || [],
          backgroundColor: (config.colors?.[0] || '#22D3EE') + '40',
          borderColor: config.colors?.[0] || '#22D3EE',
          borderWidth: 3,
          pointRadius: 5,
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
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => ({
            ...ds,
            borderWidth: ds.borderWidth || 3,
            tension: ds.tension !== undefined ? ds.tension : 0.4,
            fill: chartType.id === 'curvedArea' ? (ds.fill !== undefined ? ds.fill : true) : false,
            pointRadius: 5,
            pointBackgroundColor: ds.borderColor || ds.backgroundColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }))
        }
      }
      return { labels: [], datasets: [] }

    case 'dashedLine':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          labels: config.labels || [],
          datasets: config.datasets.map(ds => ({
            ...ds,
            borderWidth: ds.borderWidth || 2,
            borderDash: ds.borderDash || [],
            tension: ds.tension || 0,
            fill: false,
            pointRadius: config.options?.showPoints !== false ? 5 : 0,
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
            pointStyle: 'rect'
          }))
        }
      }
      return { datasets: [] }

    case 'matrix':
      return {
        datasets: [{
          label: config.labels?.[0] || 'Dataset 1',
          data: config.values || [],
          backgroundColor: (config.colors?.[0] || '#3B82F6') + '80',
          borderColor: config.colors?.[0] || '#3B82F6',
          borderWidth: 2
        }]
      }

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
    
    default:
      return { labels: [], datasets: [] }
  }
}

function prepareChartOptions(chartType, config) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: config.options?.showLegend !== false,
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
      }
    },
    // Explicitly set scales to undefined for charts that don't use them
    scales: undefined
  }

  // Bar charts
  if (['bar', 'stackedBar', 'groupedBar', 'percentageBar', 'segmentedBar', 'waterfall', 'funnel', 'treemap'].includes(chartType.id)) {
    baseOptions.scales = {
      y: {
        beginAtZero: true,
        stacked: ['stackedBar', 'segmentedBar'].includes(chartType.id) || (chartType.id === 'percentageBar' && config.options?.stacked),
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
        stacked: ['stackedBar', 'segmentedBar'].includes(chartType.id) || (chartType.id === 'percentageBar' && config.options?.stacked),
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

  // Range Bar (horizontal with special config)
  if (chartType.id === 'rangeBar') {
    baseOptions.indexAxis = config.options?.horizontal ? 'y' : 'x'
    baseOptions.scales = {
      x: {
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
      y: {
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

  // Horizontal bar
  if (chartType.id === 'horizontalBar') {
    baseOptions.indexAxis = 'y'
    baseOptions.scales = {
      x: {
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
      y: {
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

  // Line charts
  if (['line', 'area', 'multiLine', 'steppedLine', 'verticalLine', 'smoothLine', 'dashedLine', 'curvedArea'].includes(chartType.id)) {
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

  // Scatter & Bubble
  if (['scatter', 'bubble', 'heatmap', 'matrix'].includes(chartType.id)) {
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
        beginAtZero: true,
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
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#CBD5E1',
          backdropColor: 'transparent',
          font: { size: 12 }
        },
        grid: {
          color: '#334155'
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
    baseOptions.scales = {
      r: {
        ticks: {
          backdropColor: 'transparent',
          color: '#CBD5E1'
        },
        grid: {
          color: '#334155'
        }
      }
    }
  }

  // Donut
  if (chartType.id === 'donut') {
    baseOptions.cutout = `${config.options?.cutout || 65}%`
  }

  // Nested Donut
  if (chartType.id === 'nestedDonut') {
    baseOptions.cutout = `${config.options?.cutout || 50}%`
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
    baseOptions.cutout = config.options?.cutout || '75%'
  }

  // Sunburst
  if (chartType.id === 'sunburst') {
    baseOptions.cutout = config.options?.cutout || '30%'
    baseOptions.rotation = config.options?.rotation || 0
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

