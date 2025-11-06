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
    radialBar: 'bar',
    
    line: 'line',
    area: 'line',
    multiLine: 'line',
    verticalLine: 'line',
    steppedLine: 'line',
    smoothLine: 'line',
    dashedLine: 'line',
    curvedArea: 'line',
    streamGraph: 'line',
    
    pie: 'pie',
    donut: 'pie',
    polarArea: 'pie',
    nestedDonut: 'pie',
    
    scatter: 'scatter',
    bubble: 'scatter',
    heatmap: 'scatter',
    matrix: 'scatter',
    coordinate: 'scatter',
    
    radar: 'special',
    boxPlot: 'special',
    violin: 'special',
    candlestick: 'gradient',
    calendarHeatmap: 'scatter'
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
    nestedDonut: Doughnut,
    heatmap: Scatter,
    matrix: Bubble,
    coordinate: Scatter,
    boxPlot: Bar,
    violin: Bar,
    candlestick: Bar,
    radialBar: PolarArea,
    calendarHeatmap: Scatter,
    streamGraph: Line
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
          pointRadius: 3.5,
          pointStyle: 'circle'
        }]
      }

    case 'coordinate':
      return {
        datasets: [{
          data: [
            { x: 10, y: 50 },
            { x: 30, y: 70 },
            { x: 50, y: 30 },
            { x: 70, y: 60 },
            { x: 40, y: 40 },
            { x: 60, y: 75 },
            { x: 25, y: 20 }
          ],
          backgroundColor: colorPalette[0],
          borderColor: colorPalette[0],
          pointRadius: 3.5,
          pointStyle: 'circle'
        }]
      }

    case 'bubble':
      return {
        labels: [],
        datasets: [{
          label: 'Bubbles',
          data: [
            { x: 20, y: 75, r: 4 },
            { x: 50, y: 30, r: 3 },
            { x: 75, y: 60, r: 5 },
            { x: 35, y: 15, r: 3.5 }
          ],
          backgroundColor: 'rgba(236, 72, 153, 0.85)',
          borderColor: '#EC4899',
          borderWidth: 1.5
        }]
      }

    case 'matrix':
      return {
        labels: [],
        datasets: [{
          label: 'Matrix',
          data: [
            { x: 25, y: 80, r: 4.5 },
            { x: 55, y: 45, r: 5.5 },
            { x: 75, y: 65, r: 4 },
            { x: 35, y: 20, r: 5 }
          ],
          backgroundColor: 'rgba(139, 92, 246, 0.85)',
          borderColor: '#8B5CF6',
          borderWidth: 1.5
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
            data: (ds.data || []).slice(0, 9),
            pointRadius: 4,
            pointStyle: 'rect',
            backgroundColor: function(context) {
              const value = context.raw?.v || 0;
              const alpha = Math.max(0.3, value / 100); // Minimum 30% opacity for visibility
              return `rgba(139, 92, 246, ${alpha})`; // Purple color for scatter category
            }
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

    case 'boxPlot':
    case 'violin':
      return {
        labels: (config.labels || []).slice(0, 3),
        datasets: [{
          data: (config.labels || []).slice(0, 3).map(() => [20, 40, 60, 80]),
          backgroundColor: colorPalette[0],
          borderWidth: 0,
          borderRadius: 2
        }]
      }

    case 'candlestick':
      return {
        labels: (config.labels || []).slice(0, 4),
        datasets: [{
          data: [30, 50, 40, 60],
          backgroundColor: colorPalette.slice(0, 4),
          borderWidth: 0
        }]
      }

    case 'radialBar':
      return {
        labels: (config.labels || []).slice(0, 5),
        datasets: [{
          data: (config.values || []).slice(0, 5),
          backgroundColor: colorPalette,
          borderWidth: 0
        }]
      }

    case 'radialBar':
      return {
        labels: (config.labels || []).slice(0, 5),
        datasets: [{
          data: (config.values || []).slice(0, 5),
          backgroundColor: colorPalette,
          borderWidth: 0
        }]
      }

    case 'calendarHeatmap':
      return {
        datasets: [{
          data: Array.from({ length: 20 }, (_, i) => ({
            x: i % 5,
            y: Math.floor(i / 5),
            v: Math.random() * 100
          })),
          pointRadius: 3,
          pointStyle: 'rect',
          backgroundColor: function(context) {
            const value = context.raw?.v || 0;
            const alpha = Math.max(0.3, value / 100);
            return `rgba(59, 130, 246, ${alpha})`;
          }
        }]
      }

    case 'streamGraph':
      if (config.datasets && Array.isArray(config.datasets)) {
        return {
          labels: (config.labels || []).slice(0, 4),
          datasets: config.datasets.slice(0, 3).map((ds, idx) => ({
            ...ds,
            data: (ds.data || []).slice(0, 4),
            backgroundColor: ds.backgroundColor || colorPalette[idx],
            borderColor: ds.borderColor || colorPalette[idx],
            borderWidth: 0,
            tension: 0.4,
            fill: true,
            pointRadius: 0
          }))
        }
      }
      return { labels: [], datasets: [] }

    default:
      return { labels: [], datasets: [] }
  }
}

function prepareIconOptions(chartType, config = null) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
  if (['bar', 'horizontalBar', 'stackedBar', 'groupedBar', 'percentageBar', 'segmentedBar', 'waterfall', 'rangeBar', 'boxPlot', 'violin', 'candlestick'].includes(chartType.id)) {
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

  if (chartType.id === 'horizontalBar' || chartType.id === 'rangeBar') {
    baseOptions.indexAxis = 'y'
  }

  // Line charts
  if (['line', 'area', 'multiLine', 'steppedLine', 'verticalLine', 'smoothLine', 'dashedLine', 'curvedArea', 'streamGraph'].includes(chartType.id)) {
    baseOptions.scales = {
      y: { display: false, beginAtZero: true },
      x: { display: false }
    }
  }

  // Scatter & Bubble & Coordinate
  if (['scatter', 'bubble', 'matrix', 'coordinate'].includes(chartType.id)) {
    baseOptions.scales = {
      y: { 
        display: false, 
        min: 0, 
        max: 100,
        grid: { display: false }
      },
      x: { 
        display: false, 
        min: 0, 
        max: 100,
        grid: { display: false }
      }
    }
    // Add padding around the chart area for bubbles
    baseOptions.layout = {
      padding: 10
    }
  }

  // Heatmap (categorical axes)
  if (chartType.id === 'heatmap') {
    const defaultConfig = config || getDefaultConfig(chartType)
    baseOptions.scales = {
      y: { 
        type: 'category',
        labels: defaultConfig?.yLabels || ['06:00', '12:00', '18:00'],
        display: false,
        offset: true
      },
      x: { 
        type: 'category',
        labels: defaultConfig?.labels || ['Mo', 'Di', 'Mi'],
        display: false,
        offset: true
      }
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

  // Pie Chart (supports all variants via options)
  if (chartType.id === 'pie' && config) {
    if (config.options?.innerRadius !== undefined && config.options?.innerRadius !== null) {
      baseOptions.cutout = `${config.options.innerRadius}%`
    } else if (config.options?.cutout !== undefined) {
      const cutoutValue = config.options.cutout
      baseOptions.cutout = typeof cutoutValue === 'number' ? `${cutoutValue}%` : cutoutValue
    }
    if (config.options?.rotation !== undefined) {
      baseOptions.rotation = config.options.rotation
    }
    if (config.options?.circumference !== undefined) {
      baseOptions.circumference = config.options.circumference
    }
  }

  // Radial Bar
  if (chartType.id === 'radialBar') {
    baseOptions.scales = {
      r: {
        display: false,
        beginAtZero: true
      }
    }
  }

  // Calendar Heatmap
  if (chartType.id === 'calendarHeatmap') {
    baseOptions.scales = {
      y: { 
        type: 'linear',
        display: false,
        min: 0,
        max: 4
      },
      x: { 
        type: 'linear',
        display: false,
        min: 0,
        max: 5
      }
    }
  }

  // Stream Graph stacking
  if (chartType.id === 'streamGraph') {
    baseOptions.scales = {
      y: { 
        display: false, 
        stacked: true,
        beginAtZero: false
      },
      x: { 
        display: false,
        stacked: true
      }
    }
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
  const options = prepareIconOptions(chartType, config)
  const ChartComponent = getChartComponent(chartType.id)

  // Debug für Bubble und Matrix
  if (chartType.id === 'bubble' || chartType.id === 'matrix') {
    console.log(`${chartType.id} Icon Data:`, data)
    console.log(`${chartType.id} Icon Options:`, options)
  }

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center rounded-lg"
      style={{ 
        width: '64px',
        height: '64px',
        padding: '8px',
        background: 'rgba(6, 182, 212, 0.1)',
        pointerEvents: 'none'
      }}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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

