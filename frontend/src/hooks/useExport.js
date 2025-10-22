import { useState } from 'react'
import { exportChart } from '../services/api'

export const useExport = () => {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  const downloadFile = (dataUrl, filename, format) => {
    const link = document.createElement('a')
    link.download = filename
    
    if (format === 'html') {
      const blob = new Blob([dataUrl], { type: 'text/html' })
      link.href = URL.createObjectURL(blob)
    } else {
      link.href = dataUrl
    }
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async (chartType, config, format = 'png', transparent = false) => {
    if (!chartType) {
      setError('Kein Diagrammtyp ausgewählt')
      return
    }

    setExporting(true)
    setError(null)

    try {
      const result = await exportChart(chartType.id, config, format, transparent)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const filename = `chart-${chartType.id}-${timestamp}.${format}`
      
      downloadFile(result.data, filename, format)
    } catch (err) {
      setError('Export fehlgeschlagen: ' + err.message)
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  return {
    handleExport,
    exporting,
    error
  }
}

