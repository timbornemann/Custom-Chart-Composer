export default {
  id: "smoothLine",
  name: "Geglättetes Liniendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Verkäufe 2024",
          data: [30, 45, 60, 55, 70, 85, 90, 95, 80, 75, 85, 100],
          borderColor: "#3B82F6",
          backgroundColor: "#3B82F6",
          borderDash: [],
          borderWidth: 3,
          tension: 0.4
        },
        {
          label: "Verkäufe 2023",
          data: [25, 35, 50, 45, 60, 70, 75, 80, 70, 65, 75, 85],
          borderColor: "#10B981",
          backgroundColor: "#10B981",
          borderDash: [],
          borderWidth: 3,
          tension: 0.4
        }
      ]
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
      showGrid: { type: "boolean", default: true },
      fill: { type: "boolean", default: true },
      smoothing: { type: "number", default: 0.4 }
    }
  }
};

