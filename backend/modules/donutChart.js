export default {
  id: "donut",
  name: "Donutdiagramm",
  category: "pie",
  description: "Ringdiagramm als Variation des Kreisdiagramms.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Desktop", "Mobile", "Tablet", "Andere"] 
    },
    values: { 
      type: "array", 
      default: [450, 320, 150, 80] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#22D3EE", "#3B82F6", "#A78BFA", "#F472B6"] 
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
      showPercentage: { type: "boolean", default: true },
      cutout: { type: "number", default: 65 }
    }
  }
};

