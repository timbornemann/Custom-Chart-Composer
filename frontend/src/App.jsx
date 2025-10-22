import { useState, useEffect, useRef } from 'react'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import ChartPreview from './components/ChartPreview'
import ChartConfigPanel from './components/ChartConfigPanel'
import { useChartConfig } from './hooks/useChartConfig'
import { getChartTypes } from './services/api'

function App() {
  const [chartTypes, setChartTypes] = useState([])
  const [selectedChartType, setSelectedChartType] = useState(null)
  const { config, updateConfig, resetConfig } = useChartConfig()
  const [loading, setLoading] = useState(true)
  const chartRef = useRef(null)

  useEffect(() => {
    loadChartTypes()
  }, [])

  const loadChartTypes = async () => {
    try {
      const types = await getChartTypes()
      setChartTypes(types)
      if (types.length > 0) {
        setSelectedChartType(types[0])
        resetConfig(types[0])
      }
    } catch (error) {
      console.error('Failed to load chart types:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChartTypeChange = (chartType) => {
    setSelectedChartType(chartType)
    resetConfig(chartType)
  }

  const handleResetData = () => {
    if (selectedChartType) {
      resetConfig(selectedChartType)
    }
  }

  const handleClearData = () => {
    // Clear all data (empty arrays)
    updateConfig({
      title: '',
      labels: [],
      values: [],
      datasets: [],
      datasetLabel: ''
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-textLight text-xl">Lade Diagrammtypen...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          chartTypes={chartTypes}
          selectedChartType={selectedChartType}
          onSelectChartType={handleChartTypeChange}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-[1800px] mx-auto">
            <div>
              <ChartPreview
                chartType={selectedChartType}
                config={config}
                chartRef={chartRef}
              />
            </div>
            <div>
              <ChartConfigPanel
                chartType={selectedChartType}
                config={config}
                onConfigChange={updateConfig}
                onResetData={handleResetData}
                onClearData={handleClearData}
                chartRef={chartRef}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

