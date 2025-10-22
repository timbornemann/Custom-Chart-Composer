export default {
  id: "pie",
  name: "Kreisdiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Rot", "Blau", "Gelb", "Grün", "Lila"] 
    },
    values: { 
      type: "array", 
      default: [300, 50, 100, 80, 120] 
    },
    colors: { 
      type: "array", 
      default: ["#EF4444", "#3B82F6", "#FBBF24", "#10B981", "#A78BFA"] 
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
      showPercentage: { type: "boolean", default: true }
    }
  }
};

