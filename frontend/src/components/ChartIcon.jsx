import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement
} from 'chart.js'
import { Bar, Line, Pie, Doughnut, Radar, PolarArea, Scatter, Bubble } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement
)

// Icon color palettes matching the design system
const ICON_COLOR_PALETTES = {
  bar: ['#06B6D4', '#0EA5E9', '#3B82F6', '#2563EB'],
  line: ['#10B981', '#34D399', '#6EE7B7'],
  pie: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'],
  scatter: ['#8B5CF6', '#A78BFA', '#C084FC'],
  special: ['#EC4899', '#F472B6', '#FB7185', '#FDA4AF'],
  gradient: ['#06B6D4', '#8B5CF6', '#EC4899']
}

function getColorPalette(chartType) {
  const category = chartType.category || 'special'
  
  // Map specific chart types to color palettes
  const typeMapping = {
    bar: 'bar',
    horizontalBar: 'bar',
    stackedBar: 'bar',
    groupedBar: 'bar',
    percentageBar: 'bar',
    segmentedBar: 'bar',
    waterfall: 'bar',
    rangeBar: 'bar',
    funnel: 'special',
    treemap: 'special',
    
    line: 'line',
    area: 'line',
    multiLine: 'line',
    verticalLine: 'line',
    steppedLine: 'line',
    smoothLine: 'line',
    dashedLine: 'line',
    curvedArea: 'line',
    
    pie: 'pie',
    donut: 'pie',
    polarArea: 'pie',
    semiCircle: 'pie',
    nestedDonut: 'pie',
    sunburst: 'gradient',
    
    scatter: 'scatter',
    bubble: 'scatter',
    heatmap: 'scatter',
    matrix: 'scatter',
    
    radar: 'special',
    gauge: 'special'
  }
  
  const paletteKey = typeMapping[chartType.id] || category
  return ICON_COLOR_PALETTES[paletteKey] || ICON_COLOR_PALETTES.bar
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
    segmentedBar: Bar,
    waterfall: Bar,
    rangeBar: Bar,
    smoothLine: Line,
    dashedLine: Line,
    curvedArea: Line,
    semiCircle: Doughnut,
    nestedDonut: Doughnut,
    sunburst: Doughnut,
    heatmap: Scatter,
    matrix: Bubble,
    gauge: Doughnut,
    funnel: Bar,
    treemap: Bar
  }
  return components[type] || Bar
}

function getDefaultConfig(chartType) {
  if (!chartType?.configSchema) return null
  
  const config = {}
  const schema = chartType.configSchema
  
  Object.keys(schema).forEach(key => {
    if (key === 'options' && schema[key]) {
      config.options = {}
      Object.keys(schema[key]).forEach(optKey => {
        config.options[optKey] = schema[key][optKey].default
      })
    } else if (key === 'datasets') {
      config[key] = JSON.parse(JSON.stringify(schema[key].default || []))
    } else if (key === 'values' && Array.isArray(schema[key].default)) {
      config[key] = JSON.parse(JSON.stringify(schema[key].default))
    } else {
      config[key] = Array.isArray(schema[key].default) 
        ? [...schema[key].default] 
        : schema[key].default
    }
  })
  
  return config
}

function prepareIconData(chartType, config) {
  const colorPalette = getColorPalette(chartType)
  
  switch (chartType.id) {
    case 'bar':
    case 'horizontalBar':
    case 'waterfall':
    case 'funnel':
    case 'treemap':
      return {
        labels: (config.labels || []).slice(0, 4),
        datasets: [{
          data: (config.values || []).slice(0, 4),
          backgroundColor: colorPalette,
          borderWidth: 0,
          borderRadius: 2
        }]
      }

    case 'line':
    case 'area':
    case 'verticalLine':
    case 'steppedLine':
      return {
        labels: (config.labels || []).slice(0, 5),
        datasets: [{
          data: (config.values || []).slice(0, 5),
          backgroundColor: chartType.id === 'area' ? colorPalette[0] + '60' : 'transparent',
          borderColor: colorPalette[0],
          borderWidth: 2,
          tension: chartType.id === 'area' ? 0.3 : 0,
          fill: chartType.id === 'area',
          pointRadius: 0,
          stepped: chartType.id === 'steppedLine'
        }]
      }

    case 'pie':
    case 'donut':
    case 'polarArea':
    case 'semiCircle':
    case 'gauge':
      return {
        labels: (config.labels || []).slice(0, 3),
        datasets: [{
          data: (config.values || []).slice(0, 3),
          backgroundColor: colorPalette,
          borderWidth: 0
        }]
      }

    case 'radar':
      return {
        labels: (config.labels || []).slice(0, 5),
        datasets: [{
          data: (config.values || []).slice(0, 5),
          backgroundColor: colorPalette[0] + '40',
          borderColor: colorPalette[0],
          borderWidth: 1.5,
          pointRadius: 0
        }]
      }

    case 'scatter':
      return {
        datasets: [{
          data: (config.values || []).slice(0, 8),
          backgroundColor: colorPalette[0],
          borderColor: colorPalette[0],
          pointRadius: 2
        }]
      }

    case 'bubble':
    case 'matrix':
      return {
        datasets: [{
          data: (config.values || []).slice(0, 6),
          backgroundColor: colorPalette[0] + '80',
          borderColor: colorPalette[0],
          borderWidth: 1
        }]
      }

    case 'stackedBar':
    case 'groupedBar':
    case 'percentageBar':
    case 'segmentedBar':
    case 'rangeBar':
    case 'multiLine':
    case 'mixed':
    case 'smoothLine':
    case 'dashedLine':
    case 'curvedArea':
    case 'nestedDonut':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          labels: (config.labels || []).slice(0, 4),
          datasets: config.datasets.slice(0, 2).map((ds, idx) => ({
            ...ds,
            data: (ds.data || []).slice(0, 4),
            backgroundColor: ds.backgroundColor || colorPalette[idx],
            borderColor: ds.borderColor || colorPalette[idx],
            borderWidth: chartType.id.includes('Line') ? 2 : 0,
            borderRadius: chartType.id.includes('Bar') ? 2 : 0,
            tension: chartType.id === 'curvedArea' || chartType.id === 'smoothLine' ? 0.3 : 0,
            pointRadius: 0,
            fill: chartType.id === 'curvedArea'
          }))
        }
      }
      return { labels: [], datasets: [] }

    case 'heatmap':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          datasets: config.datasets.slice(0, 1).map(ds => ({
            ...ds,
            data: (ds.data || []).slice(0, 12),
            pointRadius: 3,
            pointStyle: 'rect'
          }))
        }
      }
      return { datasets: [] }

    case 'sunburst':
      return {
        labels: (config.labels || []).slice(0, 4),
        datasets: [{
          data: (config.values || []).slice(0, 4),
          backgroundColor: colorPalette.slice(0, 4),
          borderWidth: 0
        }]
      }

    default:
      return { labels: [], datasets: [] }
  }
}

function prepareIconOptions(chartType) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: true,
    animation: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: false }
    },
    scales: undefined,
    events: [] // Disable all interactions
  }

  // Bar charts
  if (['bar', 'stackedBar', 'groupedBar', 'percentageBar', 'segmentedBar', 'waterfall', 'funnel', 'treemap', 'rangeBar'].includes(chartType.id)) {
    baseOptions.scales = {
      y: {
        display: false,
        beginAtZero: true,
        stacked: ['stackedBar', 'segmentedBar'].includes(chartType.id)
      },
      x: {
        display: false,
        stacked: ['stackedBar', 'segmentedBar'].includes(chartType.id)
      }
    }
  }

  if (chartType.id === 'horizontalBar' || (chartType.id === 'rangeBar')) {
    baseOptions.indexAxis = 'y'
  }

  // Line charts
  if (['line', 'area', 'multiLine', 'steppedLine', 'verticalLine', 'smoothLine', 'dashedLine', 'curvedArea'].includes(chartType.id)) {
    baseOptions.scales = {
      y: { display: false, beginAtZero: true },
      x: { display: false }
    }
  }

  // Scatter & Bubble
  if (['scatter', 'bubble', 'heatmap', 'matrix'].includes(chartType.id)) {
    baseOptions.scales = {
      y: { display: false, beginAtZero: true },
      x: { display: false, beginAtZero: true }
    }
  }

  // Mixed
  if (chartType.id === 'mixed') {
    baseOptions.scales = {
      y: { display: false, beginAtZero: true },
      x: { display: false }
    }
  }

  // Radar
  if (chartType.id === 'radar') {
    baseOptions.scales = {
      r: {
        display: false,
        beginAtZero: true
      }
    }
  }

  // Polar Area
  if (chartType.id === 'polarArea') {
    baseOptions.scales = {
      r: { display: false }
    }
  }

  // Donut variants
  if (chartType.id === 'donut') {
    baseOptions.cutout = '60%'
  }

  if (chartType.id === 'nestedDonut') {
    baseOptions.cutout = '50%'
  }

  if (chartType.id === 'semiCircle') {
    baseOptions.rotation = -90
    baseOptions.circumference = 180
  }

  if (chartType.id === 'gauge') {
    baseOptions.rotation = -90
    baseOptions.circumference = 180
    baseOptions.cutout = '70%'
  }

  if (chartType.id === 'sunburst') {
    baseOptions.cutout = '30%'
  }

  return baseOptions
}

export default function ChartIcon({ chartType }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const [iconKey, setIconKey] = useState(0)

  useEffect(() => {
    // Cleanup any existing chart
    if (chartRef.current) {
      try {
        chartRef.current.destroy()
      } catch (e) {
        // Ignore
      }
      chartRef.current = null
    }

    // Force re-render
    setIconKey(prev => prev + 1)
  }, [chartType])

  if (!chartType) return null

  const config = getDefaultConfig(chartType)
  if (!config) return null

  const data = prepareIconData(chartType, config)
  const options = prepareIconOptions(chartType)
  const ChartComponent = getChartComponent(chartType.id)

  return (
    <div 
      ref={containerRef}
      className="w-12 h-12 flex items-center justify-center rounded-lg p-1.5"
      style={{ 
        background: 'rgba(6, 182, 212, 0.1)',
        pointerEvents: 'none'
      }}
    >
      <div className="w-full h-full">
        <ChartComponent
          key={`${chartType.id}-${iconKey}`}
          ref={chartRef}
          data={data}
          options={options}
        />
      </div>
    </div>
  )
}

ChartIcon.propTypes = {
  chartType: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    configSchema: PropTypes.object.isRequired
  }).isRequired
}

