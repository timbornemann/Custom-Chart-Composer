export default {
  id: "area",
  name: "Flächendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul"] 
    },
    values: { 
      type: "array", 
      default: [30, 45, 35, 50, 45, 60, 55] 
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
      showPoints: { type: "boolean", default: true },
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true }
    }
  }
};

