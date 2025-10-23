export default {
  id: "gauge",
  name: "Tachometer-Diagramm",
  category: "special",
  icon: "✨",
  description: "Tachometer zur Visualisierung eines aktuellen Wertes.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Niedrig", "Mittel", "Hoch"] 
    },
    values: { 
      type: "array", 
      default: [33, 33, 34] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    currentValue: {
      type: "number",
      default: 65
    },
    colors: { 
      type: "array", 
      default: ["#10B981", "#F59E0B", "#EF4444"] 
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
      rotation: { type: "number", default: -90 },
      circumference: { type: "number", default: 180 },
      cutout: { type: "string", default: "75%" },
      showNeedle: { type: "boolean", default: true }
    }
  }
};

