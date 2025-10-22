import Chart from 'chart.js/auto';

export default {
  id: "donut",
  name: "Donutdiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Desktop", "Mobile", "Tablet", "Andere"] 
    },
    values: { 
      type: "array", 
      default: [450, 320, 150, 80] 
    },
    colors: { 
      type: "array", 
      default: ["#22D3EE", "#3B82F6", "#A78BFA", "#F472B6"] 
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
      showPercentage: { type: "boolean", default: true },
      cutout: { type: "number", default: 65 }
    }
  },
  render: async (ctx, config, canvas) => {
    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: config.labels,
        datasets: [{
          data: config.values,
          backgroundColor: config.colors,
          borderColor: '#1E293B',
          borderWidth: 3,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: false,
        animation: false,
        cutout: `${config.options?.cutout || 65}%`,
        plugins: {
          legend: {
            display: config.options?.showLegend !== false,
            position: 'right',
            labels: {
              color: '#F8FAFC',
              font: { size: 14, family: 'Inter' },
              padding: 15,
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  const dataset = data.datasets[0];
                  const total = dataset.data.reduce((a, b) => a + b, 0);
                  
                  return data.labels.map((label, i) => {
                    const value = dataset.data[i];
                    const percentage = ((value / total) * 100).toFixed(1);
                    const text = config.options?.showPercentage !== false
                      ? `${label} (${percentage}%)`
                      : label;
                    
                    return {
                      text,
                      fillStyle: dataset.backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          title: {
            display: !!config.title,
            text: config.title || '',
            color: '#F8FAFC',
            font: { size: 20, family: 'Inter', weight: 'bold' }
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

