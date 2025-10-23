export default {
  id: "scatter",
  name: "Streudiagramm",
  category: "scatter",
  description: "Punkte zur Analyse von Zusammenhängen zweier Variablen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Datenpunkt"] 
    },
    values: { 
      type: "array", 
      default: [
        { x: 10, y: 20 },
        { x: 15, y: 35 },
        { x: 20, y: 30 },
        { x: 25, y: 45 },
        { x: 30, y: 40 },
        { x: 35, y: 55 },
        { x: 40, y: 50 }
      ]
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#8B5CF6"] 
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
      pointSize: { type: "number", default: 8 }
    }
  }
};

