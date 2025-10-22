export default {
  id: "steppedLine",
  name: "Treppenstufen-Liniendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"] 
    },
    values: { 
      type: "array", 
      default: [20, 20, 35, 35, 50] 
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
      fill: { type: "boolean", default: true },
      showPoints: { type: "boolean", default: true },
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true }
    }
  }
};

