export default {
  id: "sankey",
  name: "Sankey-Diagramm",
  category: "special",
  description: "Flussdiagramm zur Visualisierung von Material-, Energie- oder Datenflüssen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Flussdiagramm"
    },
    labels: { 
      type: "array", 
      default: ["Quelle A", "Quelle B", "Prozess C", "Prozess D", "Ziel E", "Ziel F"] 
    },
    values: { 
      type: "array", 
      default: [50, 40, 55, 35, 50, 40] 
    },
    datasetLabel: {
      type: "string",
      default: "Fluss"
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#EF4444"] 
    },
    backgroundColor: {
      type: "string",
      default: "#0F172A"
    },
    width: {
      type: "number",
      default: 1000
    },
    height: {
      type: "number",
      default: 600
    },
    options: {
      showLegend: { type: "boolean", default: false, description: "Legende ein-/ausblenden" },
      showGrid: { type: "boolean", default: true, description: "Gitterlinien anzeigen" },
      gridColor: { type: "color", default: "#334155", description: "Farbe der Gitterlinien" },
      flowWidth: { type: "number", min: 20, max: 90, step: 5, default: 60, description: "Breite der Flussbalken (%)" },
      showValues: { type: "boolean", default: true, description: "Werte anzeigen" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Knoten", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Durchfluss", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1200, description: "Animationsdauer in Millisekunden" }
    }
  }
};
