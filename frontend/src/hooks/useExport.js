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

      // Adjust dimensions based on aspect ratio if set
      let exportWidth = width
      let exportHeight = height
      
      // Chart types that don't support custom aspect ratio
      const noAspectRatioCharts = ['radar', 'polarArea', 'sunburst', 'radialBar', 'semiCircle', 'gauge', 'chord']
      const supportsAspectRatio = !noAspectRatioCharts.includes(chartType.id)
      
      if (supportsAspectRatio && config.options?.aspectRatio && typeof config.options.aspectRatio === 'number') {
        const aspectRatio = config.options.aspectRatio
        // Maintain the specified aspect ratio while keeping within max dimensions
        if (aspectRatio > (width / height)) {
          // Wider - use full width, adjust height
          exportHeight = Math.round(width / aspectRatio)
        } else {
          // Taller - use full height, adjust width
          exportWidth = Math.round(height * aspectRatio)
        }
      }

      // Create a new high-resolution canvas
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = exportWidth
      exportCanvas.height = exportHeight
      exportCanvas.style.width = exportWidth + 'px'
      exportCanvas.style.height = exportHeight + 'px'
      
      // Set device pixel ratio to 2 for even sharper output
      const ctx = exportCanvas.getContext('2d')
      
      // Set background if not transparent
      if (!transparent && (format === 'png' || format === 'jpeg')) {
        ctx.fillStyle = config.backgroundColor || '#0F172A'
        ctx.fillRect(0, 0, exportWidth, exportHeight)
      }

      // Draw background image if present
      if (config.backgroundImage && config.backgroundImage.url) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            img.onload = () => {
              const {
                positionX = 50,
                positionY = 50,
                scale = 100,
                flipHorizontal = false,
                flipVertical = false,
                rotation = 0,
                opacity = 100,
                blur = 0,
                brightness = 100,
                contrast = 100,
                grayscale = 0
              } = config.backgroundImage

              // Save context state
              ctx.save()

              // Apply filters
              const filters = []
              if (opacity < 100) filters.push(`opacity(${opacity}%)`)
              if (blur > 0) filters.push(`blur(${blur}px)`)
              if (brightness !== 100) filters.push(`brightness(${brightness}%)`)
              if (contrast !== 100) filters.push(`contrast(${contrast}%)`)
              if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`)
              
              if (filters.length > 0) {
                ctx.filter = filters.join(' ')
              }

              // Calculate image dimensions and position
              const imgAspectRatio = img.width / img.height
              const canvasAspectRatio = exportWidth / exportHeight
              
              let drawWidth, drawHeight
              if (imgAspectRatio > canvasAspectRatio) {
                drawWidth = exportWidth
                drawHeight = exportWidth / imgAspectRatio
              } else {
                drawHeight = exportHeight
                drawWidth = exportHeight * imgAspectRatio
              }

              // Apply scale
              const scaleValue = scale / 100
              drawWidth *= scaleValue
              drawHeight *= scaleValue

              // Calculate position (center point for transformations)
              const centerX = (exportWidth * positionX) / 100
              const centerY = (exportHeight * positionY) / 100

              // Move to center point for transformation
              ctx.translate(centerX, centerY)

              // Apply rotation
              if (rotation !== 0) {
                ctx.rotate((rotation * Math.PI) / 180)
              }

              // Apply flip
              const flipX = flipHorizontal ? -1 : 1
              const flipY = flipVertical ? -1 : 1
              ctx.scale(flipX, flipY)

              // Draw image centered at transformation point
              ctx.drawImage(
                img,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
              )

              // Restore context state
              ctx.restore()
              
              resolve()
            }
            
            img.onerror = () => {
              console.warn('Failed to load background image for export')
              resolve() // Continue without background image
            }
            
            img.src = config.backgroundImage.url
          })
        } catch (err) {
          console.warn('Error drawing background image:', err)
          // Continue without background image
        }
      }

      // Get the chart configuration from the original chart
      const chartConfig = {
        type: originalChart.config.type,
        data: JSON.parse(JSON.stringify(originalChart.config.data)),
        options: JSON.parse(JSON.stringify(originalChart.config.options))
      }

      // Calculate scaling factor based on export size vs typical preview size (450px height)
      // We use 450 because that's the typical preview chart height
      const scaleFactor = exportHeight / 450

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

