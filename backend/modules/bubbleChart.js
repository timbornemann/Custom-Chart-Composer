export default {
  id: "bubble",
  name: "Blasendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Dataset 1"] 
    },
    values: { 
      type: "array", 
      default: [
        { x: 20, y: 30, r: 15 },
        { x: 40, y: 10, r: 10 },
        { x: 30, y: 40, r: 20 },
        { x: 50, y: 25, r: 12 },
        { x: 15, y: 45, r: 18 },
        { x: 45, y: 35, r: 8 }
      ]
    },
    colors: { 
      type: "array", 
      default: ["#EC4899"] 
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

