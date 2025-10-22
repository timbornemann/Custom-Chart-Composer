import Chart from 'chart.js/auto';

export default {
  id: "radar",
  name: "Radar-Chart",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Geschwindigkeit", "Zuverlässigkeit", "Komfort", "Sicherheit", "Design"] 
    },
    values: { 
      type: "array", 
      default: [85, 90, 75, 95, 80] 
    },
    colors: { 
      type: "array", 
      default: ["#22D3EE"] 
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
      showLegend: { type: "boolean", default: true },
      fill: { type: "boolean", default: true }
    }
  },
  render: async (ctx, config, canvas) => {
    const chartConfig = {
      type: 'radar',
      data: {
        labels: config.labels,
        datasets: [{
          label: config.datasetLabel || 'Bewertung',
          data: config.values,
          borderColor: config.colors[0],
          backgroundColor: config.options?.fill !== false 
            ? config.colors[0] + '40' 
            : 'transparent',
          borderWidth: 3,
          pointRadius: 5,
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

