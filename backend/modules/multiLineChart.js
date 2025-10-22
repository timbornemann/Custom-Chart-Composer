export default {
  id: "multiLine",
  name: "Multi-Liniendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Serie 1",
          data: [12, 19, 15, 25, 22, 30],
          borderColor: "#3B82F6",
          backgroundColor: "#3B82F640"
        },
        {
          label: "Serie 2",
          data: [8, 15, 12, 18, 16, 22],
          borderColor: "#10B981",
          backgroundColor: "#10B98140"
        },
        {
          label: "Serie 3",
          data: [5, 10, 8, 14, 12, 18],
          borderColor: "#F59E0B",
          backgroundColor: "#F59E0B40"
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
      smooth: { type: "boolean", default: true },
      fill: { type: "boolean", default: false },
      showPoints: { type: "boolean", default: true },
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true }
    }
  }
};

