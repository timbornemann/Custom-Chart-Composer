export default {
  id: "dashedLine",
  name: "Gestricheltes Liniendiagramm",
  category: "line",
  description: "Linie mit gestrichelter Darstellung.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Woche 1", "Woche 2", "Woche 3", "Woche 4", "Woche 5", "Woche 6"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Ist-Werte",
          data: [65, 72, 68, 75, 80, 85],
          backgroundColor: "#3B82F6",
          borderColor: "#3B82F6",
          borderDash: [],
          borderWidth: 2,
          tension: 0
        },
        {
          label: "Prognose",
          data: [null, null, null, null, 80, 88, 95, 100],
          backgroundColor: "#F59E0B",
          borderColor: "#F59E0B",
          borderDash: [5, 5],
          borderWidth: 2,
          tension: 0
        },
        {
          label: "Ziel",
          data: [70, 70, 70, 70, 70, 70],
          backgroundColor: "#10B981",
          borderColor: "#10B981",
          borderDash: [10, 5],
          borderWidth: 2,
          tension: 0
        }
      ]
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
      beginAtZero: { type: "boolean", default: true, description: "Y-Achse bei 0 beginnen" },
      showPoints: { type: "boolean", default: true, description: "Datenpunkte anzeigen" },
      pointRadius: { type: "number", min: 0, max: 20, step: 1, default: 5, description: "Größe der Datenpunkte" },
      pointStyle: { type: "select", default: "circle", options: [
        { value: "circle", label: "Kreis" }, { value: "rect", label: "Rechteck" },
        { value: "triangle", label: "Dreieck" }, { value: "rectRot", label: "Raute" },
        { value: "cross", label: "Kreuz" }, { value: "star", label: "Stern" }
      ], description: "Form der Datenpunkte" },
      lineWidth: { type: "number", min: 1, max: 10, step: 1, default: 2, description: "Breite der Linien" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Wochen", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

