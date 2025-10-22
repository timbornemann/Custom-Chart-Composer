export default {
  id: "waterfall",
  name: "Wasserfalldiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Start", "Einnahmen", "Kosten", "Gewinn", "Steuern", "Ende"] 
    },
    values: { 
      type: "array", 
      default: [1000, 500, -300, 400, -200, 1400] 
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6", "#10B981", "#EF4444", "#10B981", "#EF4444", "#8B5CF6"] 
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
      showConnectors: { type: "boolean", default: true }
    }
  }
};

