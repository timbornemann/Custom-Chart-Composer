export default {
  id: "horizontalBar",
  name: "Horizontales Balkendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Produkt A", "Produkt B", "Produkt C", "Produkt D"] 
    },
    values: { 
      type: "array", 
      default: [85, 92, 78, 95] 
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

