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
      
      // Note: Background color and image will be drawn AFTER chart rendering
      // to ensure they appear correctly (Chart.js clears the canvas during render)

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
              color: config.options?.fontStyles?.legend?.color || chartConfig.options.plugins?.legend?.labels?.color,
              font: {
                ...chartConfig.options.plugins?.legend?.labels?.font,
                family: config.options?.fontStyles?.legend?.family || chartConfig.options.plugins?.legend?.labels?.font?.family || 'Inter',
                size: scaleFont(chartConfig.options.plugins?.legend?.labels?.font?.size || 14)
              },
              padding: scaleValue(10),
              boxWidth: scaleValue(40),
              boxHeight: scaleValue(15)
            }
          },
          title: {
            ...chartConfig.options.plugins?.title,
            color: config.options?.fontStyles?.title?.color || chartConfig.options.plugins?.title?.color,
            font: {
              ...chartConfig.options.plugins?.title?.font,
              family: config.options?.fontStyles?.title?.family || chartConfig.options.plugins?.title?.font?.family || 'Inter',
              size: scaleFont(chartConfig.options.plugins?.title?.font?.size || 20)
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
          },
          // Scale customValueLabels font size for better readability in exports
          customValueLabels: chartConfig.options.plugins?.customValueLabels ? {
            ...chartConfig.options.plugins.customValueLabels,
            color: config.options?.fontStyles?.valueLabels?.color || chartConfig.options.plugins.customValueLabels.color,
            font: {
              ...chartConfig.options.plugins.customValueLabels.font,
              family: config.options?.fontStyles?.valueLabels?.family || chartConfig.options.plugins.customValueLabels.font?.family || 'Inter',
              size: scaleFont(chartConfig.options.plugins.customValueLabels.font?.size || 12)
            },
            offsetX: scaleValue(chartConfig.options.plugins.customValueLabels.offsetX || 0),
            offsetY: scaleValue(chartConfig.options.plugins.customValueLabels.offsetY || 0)
          } : undefined
        }
      }

      // Scale annotation fonts if annotations exist
      if (chartConfig.options.plugins?.annotation?.annotations) {
        const annotations = chartConfig.options.plugins.annotation.annotations
        Object.keys(annotations).forEach(key => {
          const annotation = annotations[key]
          // Scale label fonts for line annotations
          if (annotation.label?.font) {
            annotation.label.font.size = scaleFont(annotation.label.font.size || 12)
            annotation.label.padding = scaleValue(annotation.label.padding || 6)
          }
          // Scale font for label annotations
          if (annotation.font) {
            annotation.font.size = scaleFont(annotation.font.size || 12)
            annotation.padding = scaleValue(annotation.padding || 6)
          }
          // Scale border widths
          if (annotation.borderWidth) {
            annotation.borderWidth = scaleValue(annotation.borderWidth)
          }
        })
      }

      // Scale axis fonts if scales exist, but keep grid lines at original size
      if (chartConfig.options.scales) {
        Object.keys(chartConfig.options.scales).forEach(scaleKey => {
          const scale = chartConfig.options.scales[scaleKey]
          if (scale.ticks) {
            scale.ticks = {
              ...scale.ticks,
              color: scaleKey === 'x' 
                ? (config.options?.fontStyles?.ticks?.color || config.options?.fontStyles?.xAxis?.color || scale.ticks.color)
                : (config.options?.fontStyles?.ticks?.color || config.options?.fontStyles?.yAxis?.color || scale.ticks.color),
              font: {
                ...scale.ticks.font,
                family: config.options?.fontStyles?.ticks?.family || scale.ticks.font?.family || 'Inter',
                size: scaleFont(scale.ticks.font?.size || 12)
              }
            }
          }
          if (scale.pointLabels) {
            scale.pointLabels = {
              ...scale.pointLabels,
              color: config.options?.fontStyles?.ticks?.color || scale.pointLabels.color,
              font: {
                ...scale.pointLabels.font,
                family: config.options?.fontStyles?.ticks?.family || scale.pointLabels.font?.family || 'Inter',
                size: scaleFont(scale.pointLabels.font?.size || 13)
              }
            }
          }
          if (scale.title) {
            scale.title = {
              ...scale.title,
              color: scaleKey === 'x'
                ? (config.options?.fontStyles?.xAxis?.color || scale.title.color)
                : (config.options?.fontStyles?.yAxis?.color || scale.title.color),
              font: {
                ...scale.title.font,
                family: scaleKey === 'x'
                  ? (config.options?.fontStyles?.xAxis?.family || scale.title.font?.family || 'Inter')
                  : (config.options?.fontStyles?.yAxis?.family || scale.title.font?.family || 'Inter'),
                size: scaleFont(scale.title.font?.size || 13)
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

      // Special handling for heatmap charts - recreate backgroundColor functions
      if (chartType.id === 'heatmap' && chartConfig.data.datasets && Array.isArray(chartConfig.data.datasets)) {
        const isCalendarType = config.options?.heatmapType === 'calendar'
        
        chartConfig.data.datasets = chartConfig.data.datasets.map(ds => {
          if (isCalendarType) {
            // Calendar heatmap uses color scale
            return {
              ...ds,
              label: ds.label || 'Aktivität',
              data: ds.data || [],
              backgroundColor: function(context) {
                const value = context.raw?.v || 0
                const colorScale = config.colors || ['#0F172A', '#1E3A5F', '#2563EB', '#3B82F6', '#60A5FA']
                const index = Math.min(Math.floor((value / 5) * (colorScale.length - 1)), colorScale.length - 1)
                return colorScale[index]
              },
              borderWidth: scaleValue(2),
              borderColor: '#0F172A',
              pointRadius: scaleValue(config.options?.cellSize || 12),
              pointStyle: 'rect'
            }
          } else {
            // Standard heatmap uses alpha-based coloring
            return {
              ...ds,
              pointRadius: scaleValue(config.options?.cellSize || 20),
              pointStyle: 'rect',
              backgroundColor: function(context) {
                const value = context.raw?.v || 0;
                const alpha = value / 100;
                // Use dataset backgroundColor, or first color from config.colors, or default
                const color = ds.backgroundColor || 
                             (Array.isArray(config.colors) && config.colors.length > 0 ? config.colors[0] : null) ||
                             '#3B82F6';
                // Extract RGB from hex color
                const hex = color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              }
            }
          }
        })
      } else {
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
      }
      
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
      
      // Wait for the chart to render completely
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Composite background BEHIND the drawn chart so it isn't cleared by Chart.js
      // This ensures background color and image appear correctly in the export
      if (!transparent && (format === 'png' || format === 'jpeg')) {
        ctx.save()
        ctx.globalCompositeOperation = 'destination-over'
        ctx.fillStyle = config.backgroundColor || '#0F172A'
        ctx.fillRect(0, 0, exportWidth, exportHeight)
        ctx.restore()
      }

      // Draw background image if present (also behind chart)
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
              ctx.globalCompositeOperation = 'destination-over'

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

