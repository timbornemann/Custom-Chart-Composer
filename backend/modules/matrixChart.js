export default {
  id: "matrix",
  name: "Matrix-Diagramm",
  category: "scatter",
  icon: "🔘",
  description: "Matrixdiagramm mit gewichteten Punkten.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Preis vs. Qualität"] 
    },
    values: {
      type: "array",
      default: [
        { x: 25, y: 80, r: 15 },
        { x: 45, y: 60, r: 20 },
        { x: 70, y: 90, r: 25 },
        { x: 35, y: 45, r: 10 },
        { x: 85, y: 75, r: 30 }
      ]
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
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true },
      xAxisLabel: { type: "string", default: "Preis" },
      yAxisLabel: { type: "string", default: "Qualität" }
    }
  }
};

