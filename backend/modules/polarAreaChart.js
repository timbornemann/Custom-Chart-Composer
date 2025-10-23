export default {
  id: "polarArea",
  name: "Polar-Flächendiagramm",
  category: "pie",
  description: "Radiale Darstellung kategorialer Werte.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Rot", "Grün", "Gelb", "Grau", "Blau"] 
    },
    values: { 
      type: "array", 
      default: [11, 16, 7, 3, 14] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#EF4444", "#10B981", "#FBBF24", "#6B7280", "#3B82F6"] 
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
      showLegend: { type: "boolean", default: true }
    }
  }
};

