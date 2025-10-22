import { useEffect, useRef, useState } from 'react'
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
import { Bar, Line, Pie, Doughnut, Radar } from 'react-chartjs-2'

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

export default function ChartPreview({ chartType, config }) {
  const chartRef = useRef(null)
  const [chartData, setChartData] = useState(null)
  const [chartOptions, setChartOptions] = useState(null)

  useEffect(() => {
    if (!chartType || !config) return

    const data = prepareChartData(chartType, config)
    const options = prepareChartOptions(chartType, config)
    
    setChartData(data)
    setChartOptions(options)
  }, [chartType, config])

  if (!chartType || !config || !chartData) {
    return (
      <div className="bg-dark-secondary rounded-2xl shadow-lg p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-dark-textGray">Wähle einen Diagrammtyp aus...</div>
      </div>
    )
  }

  const ChartComponent = getChartComponent(chartType.id)

  return (
    <div className="bg-dark-secondary rounded-2xl shadow-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-dark-textLight">Vorschau</h2>
        <p className="text-sm text-dark-textGray">{chartType.name}</p>
      </div>
      <div className="bg-dark-bg rounded-xl p-6 flex items-center justify-center" style={{ minHeight: '500px' }}>
        <div style={{ width: '100%', maxWidth: '700px', height: '450px' }}>
          <ChartComponent ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}

function getChartComponent(type) {
  const components = {
    bar: Bar,
    line: Line,
    pie: Pie,
    donut: Doughnut,
    radar: Radar
  }
  return components[type] || Bar
}

function prepareChartData(chartType, config) {
  switch (chartType.id) {
    case 'bar':
    case 'line':
      return {
        labels: config.labels || [],
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values || [],
          backgroundColor: config.colors || [],
          borderColor: config.colors || [],
          borderWidth: 2,
          borderRadius: chartType.id === 'bar' ? 8 : 0,
          tension: config.options?.smooth ? 0.4 : 0,
          fill: config.options?.fill || false,
          pointRadius: config.options?.showPoints !== false ? 5 : 0,
          pointBackgroundColor: config.colors?.[0] || '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      }
    
    case 'pie':
    case 'donut':
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
    }
  }

  if (chartType.id === 'bar' || chartType.id === 'line') {
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
          display: chartType.id === 'line' && config.options?.showGrid !== false,
          color: '#334155'
        },
        ticks: {
          color: '#CBD5E1',
          font: { size: 12 }
        }
      }
    }
  }

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

  if (chartType.id === 'donut') {
    baseOptions.cutout = `${config.options?.cutout || 65}%`
  }

  return baseOptions
}

