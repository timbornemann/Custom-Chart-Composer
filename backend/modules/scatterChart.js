export default {
  id: "scatter",
  name: "Streudiagramm",
  category: "scatter",
  description: "Punkte zur Analyse von Zusammenhängen zweier Variablen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Datenpunkt"] 
    },
    values: { 
      type: "array", 
      default: [
        { x: 10, y: 20 },
        { x: 15, y: 35 },
        { x: 20, y: 30 },
        { x: 25, y: 45 },
        { x: 30, y: 40 },
        { x: 35, y: 55 },
        { x: 40, y: 50 }
      ]
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#8B5CF6"] 
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
      pointRadius: { type: "number", min: 1, max: 30, step: 1, default: 8, description: "Größe der Punkte" },
      pointStyle: { type: "select", default: "circle", options: [
        { value: "circle", label: "Kreis" }, { value: "rect", label: "Rechteck" },
        { value: "triangle", label: "Dreieck" }, { value: "rectRot", label: "Raute" },
        { value: "cross", label: "Kreuz" }, { value: "star", label: "Stern" }
      ], description: "Form der Punkte" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. X-Werte", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Y-Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

