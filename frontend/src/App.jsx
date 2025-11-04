import { useState, useEffect, useRef } from 'react'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import ChartPreview from './components/ChartPreview'
import ChartConfigPanel from './components/ChartConfigPanel'
import ConfirmModal from './components/ConfirmModal'
import { useChartConfig } from './hooks/useChartConfig'
import { getChartTypes } from './services/api'

const STORAGE_KEY = 'ccc:chartState'

function App() {
  const [chartTypes, setChartTypes] = useState([])
  const [selectedChartType, setSelectedChartType] = useState(null)
  const {
    config,
    updateConfig,
    resetConfig,
    setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty
  } = useChartConfig()
  const [loading, setLoading] = useState(true)
  const chartRef = useRef(null)
  const hasRestoredState = useRef(false)
  const [showNewChartModal, setShowNewChartModal] = useState(false)
  const [isConfigFullscreen, setIsConfigFullscreen] = useState(false)

  useEffect(() => {
    loadChartTypes()
  }, [])

  const loadChartTypes = async () => {
    try {
      const types = await getChartTypes()
      setChartTypes(types)

      if (types.length > 0) {
        restoreInitialState(types)
      }
    } catch (error) {
      console.error('Failed to load chart types:', error)
    } finally {
      setLoading(false)
    }
  }

  const restoreInitialState = (types) => {
    if (hasRestoredState.current) return
    hasRestoredState.current = true

    const fallbackType = types[0] || null

    if (typeof window === 'undefined') {
      if (fallbackType) {
        setSelectedChartType(fallbackType)
        resetConfig(fallbackType)
      }
      return
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const storedType = types.find((type) => type.id === parsed.chartTypeId)

        if (storedType) {
          setSelectedChartType(storedType)
          resetConfig(storedType)
          if (parsed && typeof parsed.config === 'object' && parsed.config !== null) {
            setConfig(parsed.config)
          }
          return
        }
      }
    } catch (error) {
      console.warn('Konnte gespeicherte Diagrammkonfiguration nicht laden:', error)
    }

    if (fallbackType) {
      setSelectedChartType(fallbackType)
      resetConfig(fallbackType)
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

  const handleNewChart = () => {
    if (isDirty) {
      setShowNewChartModal(true)
    } else {
      startFreshChart()
    }
  }

  const startFreshChart = () => {
    if (!selectedChartType) return
    resetConfig(selectedChartType)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  useEffect(() => {
    if (!selectedChartType) return
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          chartTypeId: selectedChartType.id,
          config
        })
      )
    } catch (error) {
      console.warn('Konnte Diagrammkonfiguration nicht speichern:', error)
    }
  }, [selectedChartType, config])

  if (loading) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-textLight text-xl">Lade Diagrammtypen...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-dark-bg flex flex-col overflow-hidden">
      <Header onNewChart={handleNewChart} hasUnsavedChanges={isDirty} />
      <ConfirmModal
        isOpen={showNewChartModal}
        onClose={() => setShowNewChartModal(false)}
        onConfirm={startFreshChart}
        title="Neues Diagramm starten?"
        message="Nicht gespeicherte Änderungen gehen verloren. Möchten Sie wirklich ein neues Diagramm beginnen?"
        confirmText="Neues Diagramm"
        cancelText="Abbrechen"
        variant="info"
      />
      <div className="flex flex-1 overflow-hidden">
        {!isConfigFullscreen && (
          <Sidebar
            chartTypes={chartTypes}
            selectedChartType={selectedChartType}
            onSelectChartType={handleChartTypeChange}
          />
        )}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className={`grid grid-cols-1 ${isConfigFullscreen ? '' : 'xl:grid-cols-2'} gap-6 max-w-[1800px] mx-auto`}>
            {!isConfigFullscreen && (
              <div>
                <ChartPreview
                  chartType={selectedChartType}
                  config={config}
                  chartRef={chartRef}
                />
              </div>
            )}
            <div className={isConfigFullscreen ? 'w-full' : ''}>
              <ChartConfigPanel
                chartType={selectedChartType}
                config={config}
                onConfigChange={updateConfig}
                onResetData={handleResetData}
                onClearData={handleClearData}
                chartRef={chartRef}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                isFullscreen={isConfigFullscreen}
                onToggleFullscreen={() => setIsConfigFullscreen(!isConfigFullscreen)}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

