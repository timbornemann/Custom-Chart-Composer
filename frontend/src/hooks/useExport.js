import { useState, useRef } from 'react'
import { Chart as ChartJS } from 'chart.js'

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

  const handleExport = async (chartType, config, format = 'png', transparent = false, chartRef = null, width = 1920, height = 1080) => {
    if (!chartType) {
      setError('Kein Diagrammtyp ausgewählt')
      return
    }

    if (!chartRef || !chartRef.current) {
      setError('Bitte warten Sie, bis das Diagramm vollständig geladen ist')
      setTimeout(() => setError(null), 3000)
      return
    }

    setExporting(true)
    setError(null)

    try {
      // Wait a bit to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const originalChart = chartRef.current
      
      if (!originalChart) {
        throw new Error('Chart nicht gefunden. Bitte warten Sie einen Moment und versuchen Sie es erneut.')
      }

      // Create a new high-resolution canvas
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = width
      exportCanvas.height = height
      exportCanvas.style.width = width + 'px'
      exportCanvas.style.height = height + 'px'
      
      // Set device pixel ratio to 2 for even sharper output
      const ctx = exportCanvas.getContext('2d')
      
      // Set background if not transparent
      if (!transparent && (format === 'png' || format === 'jpeg')) {
        ctx.fillStyle = config.backgroundColor || '#0F172A'
        ctx.fillRect(0, 0, width, height)
      }

      // Get the chart configuration from the original chart
      const chartConfig = {
        type: originalChart.config.type,
        data: JSON.parse(JSON.stringify(originalChart.config.data)),
        options: JSON.parse(JSON.stringify(originalChart.config.options))
      }

      // Calculate scaling factor based on export size vs typical preview size (450px height)
      // We use 450 because that's the typical preview chart height
      const scaleFactor = height / 450

      // Scale ALL elements proportionally to maintain exact visual appearance
      const scaleValue = (value) => {
        if (value === undefined || value === null) return undefined
        return Math.max(1, Math.round(value * scaleFactor))
      }
      
      const scaleFont = (fontSize) => Math.round(fontSize * scaleFactor)

      // Update options for high-res rendering
      chartConfig.options = {
        ...chartConfig.options,
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        devicePixelRatio: 2, // High DPI rendering
        plugins: {
          ...chartConfig.options.plugins,
          legend: {
            ...chartConfig.options.plugins?.legend,
            labels: {
              ...chartConfig.options.plugins?.legend?.labels,
              font: {
                ...chartConfig.options.plugins?.legend?.labels?.font,
                size: scaleFont(14)
              },
              padding: scaleValue(10),
              boxWidth: scaleValue(40),
              boxHeight: scaleValue(15)
            }
          },
          title: {
            ...chartConfig.options.plugins?.title,
            font: {
              ...chartConfig.options.plugins?.title?.font,
              size: scaleFont(20)
            },
            padding: scaleValue(20)
          },
          tooltip: {
            ...chartConfig.options.plugins?.tooltip,
            titleFont: {
              size: scaleFont(14)
            },
            bodyFont: {
              size: scaleFont(12)
            },
            padding: scaleValue(12)
          }
        }
      }

      // Scale axis fonts if scales exist, but keep grid lines at original size
      if (chartConfig.options.scales) {
        Object.keys(chartConfig.options.scales).forEach(scaleKey => {
          const scale = chartConfig.options.scales[scaleKey]
          if (scale.ticks) {
            scale.ticks = {
              ...scale.ticks,
              font: {
                ...scale.ticks.font,
                size: scaleFont(12)
              }
            }
          }
          if (scale.pointLabels) {
            scale.pointLabels = {
              ...scale.pointLabels,
              font: {
                ...scale.pointLabels.font,
                size: scaleFont(13)
              }
            }
          }
          if (scale.title) {
            scale.title = {
              ...scale.title,
              font: {
                ...scale.title.font,
                size: scaleFont(13)
              }
            }
          }
          // Scale grid line width proportionally
          if (scale.grid) {
            scale.grid = {
              ...scale.grid,
              lineWidth: Math.max(1, scaleFactor * 1)
            }
          }
        })
      }

      // Scale ALL dataset properties proportionally to maintain visual consistency
      // This ensures the export looks EXACTLY like the preview, just in higher resolution
      chartConfig.data.datasets = chartConfig.data.datasets.map(ds => ({
        ...ds,
        // Scale all visual properties
        borderWidth: scaleValue(ds.borderWidth),
        pointRadius: scaleValue(ds.pointRadius),
        pointHoverRadius: scaleValue(ds.pointHoverRadius),
        pointBorderWidth: scaleValue(ds.pointBorderWidth),
        borderRadius: scaleValue(ds.borderRadius),
        barThickness: scaleValue(ds.barThickness),
        minBarLength: scaleValue(ds.minBarLength),
        hoverOffset: scaleValue(ds.hoverOffset),
        // Scale border dash pattern if it exists
        borderDash: ds.borderDash ? ds.borderDash.map(v => scaleValue(v)) : undefined,
        // Keep non-numeric properties as-is
        pointStyle: ds.pointStyle,
        tension: ds.tension,
        fill: ds.fill,
        stepped: ds.stepped,
        backgroundColor: ds.backgroundColor,
        borderColor: ds.borderColor
      }))
      
      // Apply scaled barThickness at chart level if it exists in options
      if (chartConfig.options.barThickness) {
        chartConfig.options.datasets = {
          bar: {
            barThickness: scaleValue(chartConfig.options.barThickness)
          }
        }
      }

      // Create a temporary high-resolution chart
      const tempChart = new ChartJS(exportCanvas, chartConfig)
      
      // Wait for the chart to render
      await new Promise(resolve => setTimeout(resolve, 300))

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const filename = `chart-${chartType.id}-${timestamp}.${format}`
      
      let dataUrl

      if (format === 'html') {
        // Export as HTML with embedded PNG
        const pngData = exportCanvas.toDataURL('image/png')
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
        dataUrl = exportCanvas.toDataURL('image/png')
        downloadFile(dataUrl, filename.replace('.svg', '.png'), 'png')
        console.warn('SVG export not fully supported, exported as PNG instead')
      } else if (format === 'jpeg' || format === 'jpg') {
        // JPEG doesn't support transparency
        dataUrl = exportCanvas.toDataURL('image/jpeg', 0.95)
        downloadFile(dataUrl, filename, format)
      } else {
        // PNG (default)
        dataUrl = exportCanvas.toDataURL('image/png')
        downloadFile(dataUrl, filename, 'png')
      }

      // Clean up the temporary chart
      tempChart.destroy()

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

