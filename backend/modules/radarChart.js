export default {
  id: "radar",
  name: "Radar-Chart",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Geschwindigkeit", "Zuverlässigkeit", "Komfort", "Sicherheit", "Design"] 
    },
    values: { 
      type: "array", 
      default: [85, 90, 75, 95, 80] 
    },
    colors: { 
      type: "array", 
      default: ["#22D3EE"] 
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
      fill: { type: "boolean", default: true }
    }
  }
};

