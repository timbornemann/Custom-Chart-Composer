export default {
  id: "treemap",
  name: "Treemap-Diagramm",
  category: "special",
  description: "Hierarchische Daten als verschachtelte Rechtecke.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Marketing", "Entwicklung", "Vertrieb", "Support", "HR", "Verwaltung"] 
    },
    values: { 
      type: "array", 
      default: [150000, 250000, 180000, 120000, 90000, 110000] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"] 
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
      showValues: { type: "boolean", default: true }
    }
  }
};

