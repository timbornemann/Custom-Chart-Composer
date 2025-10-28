export default {
  id: "matrix",
  name: "Matrix-Diagramm",
  category: "scatter",
  description: "Matrixdiagramm mit gewichteten Punkten.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Preis vs. Qualität"] 
    },
    values: {
      type: "array",
      default: [
        { x: 25, y: 80, r: 15 },
        { x: 45, y: 60, r: 20 },
        { x: 70, y: 90, r: 25 },
        { x: 35, y: 45, r: 10 },
        { x: 85, y: 75, r: 30 }
      ]
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: {
      type: "array",
      default: ["#3B82F6"]
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
      showGrid: { type: "boolean", default: true, description: "Gitterlinien anzeigen" },
      gridColor: { type: "color", default: "#334155", description: "Farbe der Gitterlinien" },
      beginAtZero: { type: "boolean", default: true, description: "Achsen bei 0 beginnen" },
      pointRadius: { type: "number", min: 5, max: 50, step: 5, default: 20, description: "Größe der Punkte" },
      pointStyle: { type: "select", default: "circle", options: [
        { value: "circle", label: "Kreis" }, { value: "rect", label: "Rechteck" },
        { value: "triangle", label: "Dreieck" }, { value: "rectRot", label: "Raute" }
      ], description: "Form der Punkte" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite" },
      xAxisLabel: { type: "string", default: "Preis", placeholder: "z.B. Preis", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "Qualität", placeholder: "z.B. Qualität", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

