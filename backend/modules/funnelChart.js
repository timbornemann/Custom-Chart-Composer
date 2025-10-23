export default {
  id: "funnel",
  name: "Trichter-Diagramm",
  category: "special",
  icon: "✨",
  description: "Trichterdiagramm zur Darstellung von Prozessphasen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Besucher", "Interessenten", "Angebote", "Verhandlungen", "Abschlüsse"] 
    },
    values: { 
      type: "array", 
      default: [10000, 5000, 2500, 1000, 500] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"] 
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
      showLabels: { type: "boolean", default: true },
      showPercentages: { type: "boolean", default: true }
    }
  }
};

