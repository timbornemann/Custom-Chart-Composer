export default {
  id: "chord",
  name: "Chord-Diagramm",
  category: "pie",
  description: "Kreisförmige Darstellung von Beziehungen und Verbindungen zwischen Entitäten.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Beziehungsdiagramm"
    },
    labels: {
      type: "array",
      default: ["Berlin", "München", "Hamburg", "Köln", "Frankfurt"]
    },
    values: {
      type: "array",
      default: [355, 395, 305, 285, 360]
    },
    datasetLabel: {
      type: "string",
      default: "Verbindungen"
    },
    colors: {
      type: "array",
      default: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"]
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
      default: 800
    },
    options: {
      showLegend: { type: "boolean", default: true, description: "Legende ein-/ausblenden" },
      legendPosition: { type: "select", default: "bottom", options: [
        { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
        { value: "left", label: "Links" }, { value: "right", label: "Rechts" }
      ], description: "Position der Legende" },
      innerRadius: { type: "number", min: 50, max: 90, step: 5, default: 70, description: "Innerer Radius (in %)" },
      rotation: { type: "number", min: -180, max: 180, step: 15, default: 0, description: "Drehwinkel (Grad)" },
      showValues: { type: "boolean", default: true, description: "Werte anzeigen" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1500, description: "Animationsdauer in Millisekunden" }
    }
  }
};
