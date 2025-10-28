export default {
  id: "funnel",
  name: "Trichter-Diagramm",
  category: "special",
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
      showLegend: { type: "boolean", default: true, description: "Legende ein-/ausblenden" },
      legendPosition: { type: "select", default: "top", options: [
        { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
        { value: "left", label: "Links" }, { value: "right", label: "Rechts" }
      ], description: "Position der Legende" },
      showLabels: { type: "boolean", default: true, description: "Labels anzeigen" },
      showValues: { type: "boolean", default: true, description: "Werte anzeigen" },
      showPercentages: { type: "boolean", default: true, description: "Prozentangaben anzeigen" },
      showGrid: { type: "boolean", default: false, description: "Gitterlinien anzeigen" },
      gridColor: { type: "color", default: "#334155", description: "Farbe der Gitterlinien" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite" },
      borderRadius: { type: "number", min: 0, max: 50, step: 1, default: 0, description: "Abrundung der Ecken" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Phasen", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Anzahl", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

