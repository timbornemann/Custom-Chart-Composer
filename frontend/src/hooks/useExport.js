import { useState, useRef } from 'react'

export const useExport = () => {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

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
    
    // Cleanup
    if (format !== 'html') {
      setTimeout(() => URL.revokeObjectURL(link.href), 100)
    }
  }

  const getCanvasFromChart = (chartInstance) => {
    // Get the canvas element from the Chart.js instance
    return chartInstance?.canvas
  }

  const handleExport = async (chartType, config, format = 'png', transparent = false, chartRef = null) => {
    if (!chartType) {
      setError('Kein Diagrammtyp ausgewählt')
      return
    }

    if (!chartRef || !chartRef.current) {
      setError('Chart-Referenz nicht verfügbar')
      return
    }

    setExporting(true)
    setError(null)

    try {
      const canvas = getCanvasFromChart(chartRef.current)
      
      if (!canvas) {
        throw new Error('Canvas nicht gefunden')
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const filename = `chart-${chartType.id}-${timestamp}.${format}`
      
      let dataUrl

      if (format === 'html') {
        // Export as HTML with embedded PNG
        const pngData = canvas.toDataURL('image/png')
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.title || 'Chart Export'}</title>
  <style>
    body { 
      margin: 0; 
      padding: 20px; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      min-height: 100vh; 
      background: #f3f4f6;
      font-family: 'Inter', sans-serif;
    }
    .container {
      max-width: 100%;
      text-align: center;
    }
    h1 {
      color: #1f2937;
      margin-bottom: 20px;
    }
    img { 
      max-width: 100%; 
      height: auto; 
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    ${config.title ? `<h1>${config.title}</h1>` : ''}
    <img src="${pngData}" alt="Chart" />
  </div>
</body>
</html>`
        downloadFile(html, filename, 'html')
      } else if (format === 'svg') {
        // SVG export: fallback to PNG
        // True SVG export would require a different library
        dataUrl = canvas.toDataURL('image/png')
        downloadFile(dataUrl, filename.replace('.svg', '.png'), 'png')
        console.warn('SVG export not fully supported, exported as PNG instead')
      } else if (format === 'jpeg' || format === 'jpg') {
        // JPEG doesn't support transparency
        dataUrl = canvas.toDataURL('image/jpeg', 0.95)
        downloadFile(dataUrl, filename, format)
      } else {
        // PNG (default)
        dataUrl = canvas.toDataURL('image/png')
        downloadFile(dataUrl, filename, 'png')
      }

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
    error,
    canvasRef
  }
}

