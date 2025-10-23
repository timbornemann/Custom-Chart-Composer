export default {
  id: "sunburst",
  name: "Sunburst-Diagramm",
  category: "pie",
  icon: "🥧",
  description: "Hierarchische Daten als konzentrische Ringe.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Kategorie A", "Kategorie B", "Kategorie C", "Kategorie D"] 
    },
    values: { 
      type: "array", 
      default: [30, 25, 25, 20] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"] 
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
      rotation: { type: "number", default: 0 },
      cutout: { type: "string", default: "30%" }
    }
  }
};

