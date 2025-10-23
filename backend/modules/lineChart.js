export default {
  id: "line",
  name: "Liniendiagramm",
  category: "line",
  icon: "📈",
  description: "Standard Liniendiagramm für zeitliche Verläufe.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"] 
    },
    values: { 
      type: "array", 
      default: [12, 19, 3, 5, 2, 3] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
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
  }
};

