export default {
  id: "horizontalBar",
  name: "Horizontales Balkendiagramm",
  category: "bar",
  description: "Horizontale Balken zur Darstellung von Kategorien.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Produkt A", "Produkt B", "Produkt C", "Produkt D"] 
    },
    values: { 
      type: "array", 
      default: [85, 92, 78, 95] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B"] 
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

