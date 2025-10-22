export default {
  id: "mixed",
  name: "Kombiniertes Diagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Jan", "Feb", "Mär", "Apr", "Mai"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          type: "bar",
          label: "Verkäufe",
          data: [65, 59, 80, 81, 56],
          backgroundColor: "#3B82F6",
          borderColor: "#3B82F6"
        },
        {
          type: "line",
          label: "Trend",
          data: [50, 55, 70, 75, 65],
          borderColor: "#EF4444",
          backgroundColor: "transparent",
          borderWidth: 3
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
      showGrid: { type: "boolean", default: true }
    }
  }
};

