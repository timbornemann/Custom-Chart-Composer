export default {
  id: "bar",
  name: "Balkendiagramm",
  category: "bar",
  description: "Zeigt kategoriale Daten als vertikale Balken.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Januar", "Februar", "März", "April", "Mai"] 
    },
    values: { 
      type: "array", 
      default: [65, 59, 80, 81, 56] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#4ADE80", "#22D3EE", "#F472B6", "#FBBF24", "#A78BFA"] 
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
      horizontal: { type: "boolean", default: false },
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true }
    }
  }
};

