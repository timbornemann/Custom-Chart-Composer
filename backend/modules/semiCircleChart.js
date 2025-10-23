export default {
  id: "semiCircle",
  name: "Halbkreis-Diagramm",
  category: "pie",
  description: "Halbkreis-Donut für begrenzte Winkelansicht.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Erreicht", "Verbleibend"] 
    },
    values: { 
      type: "array", 
      default: [75, 25] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#10B981", "#1F2937"] 
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
      cutout: { type: "string", default: "0%" }
    }
  }
};

