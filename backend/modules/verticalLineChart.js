export default {
  id: "verticalLine",
  name: "Vertikales Liniendiagramm",
  category: "line",
  icon: "📈",
  description: "Vertikale Linien zur Darstellung von Entwicklungen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["0°", "45°", "90°", "135°", "180°", "225°", "270°", "315°"] 
    },
    values: { 
      type: "array", 
      default: [0, 70, 100, 70, 0, -70, -100, -70] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#06B6D4"] 
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

