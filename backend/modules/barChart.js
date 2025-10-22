import Chart from 'chart.js/auto';

export default {
  id: "bar",
  name: "Balkendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Januar", "Februar", "März", "April", "Mai"] 
    },
    values: { 
      type: "array", 
      default: [65, 59, 80, 81, 56] 
    },
    colors: { 
      type: "array", 
      default: ["#4ADE80", "#22D3EE", "#F472B6", "#FBBF24", "#A78BFA"] 
    },
    backgroundColor: {
      type: "string",
      default: "#0F172A"
    },
    width: {
      type: "number",
      default: 800
    },
    height: {
      type: "number",
      default: 600
    },
    options: {
      horizontal: { type: "boolean", default: false },
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true }
    }
  },
  render: async (ctx, config, canvas) => {
    const chartConfig = {
      type: config.options?.horizontal ? 'horizontalBar' : 'bar',
      data: {
        labels: config.labels,
        datasets: [{
          label: config.datasetLabel || 'Datensatz',
          data: config.values,
          backgroundColor: config.colors,
          borderColor: config.colors.map(c => c),
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: false,
        animation: false,
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
        },
        scales: {
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
              display: false
            },
            ticks: {
              color: '#CBD5E1',
              font: { size: 12 }
            }
          }
        }
      },
      plugins: [{
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart) => {
          const {ctx} = chart;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = config.backgroundColor || '#0F172A';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      }]
    };

    new Chart(ctx, chartConfig);
  }
};

