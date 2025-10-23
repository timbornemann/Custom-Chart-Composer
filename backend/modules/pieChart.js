export default {
  id: "pie",
  name: "Kreisdiagramm",
  category: "pie",
  icon: "🥧",
  description: "Teilt ein Ganzes in proportionale Sektoren.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Rot", "Blau", "Gelb", "Grün", "Lila"] 
    },
    values: { 
      type: "array", 
      default: [300, 50, 100, 80, 120] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
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

