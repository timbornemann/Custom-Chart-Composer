import Chart from 'chart.js/auto';

export default {
  id: "line",
  name: "Liniendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"] 
    },
    values: { 
      type: "array", 
      default: [12, 19, 3, 5, 2, 3] 
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6"] 
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
      smooth: { type: "boolean", default: true },
      fill: { type: "boolean", default: true },
      showPoints: { type: "boolean", default: true },
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true }
    }
  },
  render: async (ctx, config, canvas) => {
    const chartConfig = {
      type: 'line',
      data: {
        labels: config.labels,
        datasets: [{
          label: config.datasetLabel || 'Trend',
          data: config.values,
          borderColor: config.colors[0],
          backgroundColor: config.options?.fill 
            ? config.colors[0] + '40' 
            : 'transparent',
          borderWidth: 3,
          fill: config.options?.fill !== false,
          tension: config.options?.smooth !== false ? 0.4 : 0,
          pointRadius: config.options?.showPoints !== false ? 5 : 0,
          pointBackgroundColor: config.colors[0],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7
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
              display: config.options?.showGrid !== false,
              color: '#334155'
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

