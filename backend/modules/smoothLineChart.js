export default {
  id: "smoothLine",
  name: "Geglättetes Liniendiagramm",
  category: "line",
  description: "Geglättete Linie mit weichen Kurven.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Verkäufe 2024",
          data: [30, 45, 60, 55, 70, 85, 90, 95, 80, 75, 85, 100],
          borderColor: "#3B82F6",
          backgroundColor: "#3B82F6",
          borderDash: [],
          borderWidth: 3,
          tension: 0.4
        },
        {
          label: "Verkäufe 2023",
          data: [25, 35, 50, 45, 60, 70, 75, 80, 70, 65, 75, 85],
          borderColor: "#10B981",
          backgroundColor: "#10B981",
          borderDash: [],
          borderWidth: 3,
          tension: 0.4
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
      smoothing: { type: "number", min: 0, max: 1, step: 0.1, default: 0.4, description: "Grad der Linienkurve" },
      fill: { type: "boolean", default: false, description: "Flächen füllen" },
      fillOpacity: { type: "number", min: 0, max: 100, step: 5, default: 40, description: "Transparenz der Füllung (%)" },
      showPoints: { type: "boolean", default: true, description: "Datenpunkte anzeigen" },
      pointRadius: { type: "number", min: 0, max: 20, step: 1, default: 5, description: "Größe der Datenpunkte" },
      pointStyle: { type: "select", default: "circle", options: [
        { value: "circle", label: "Kreis" }, { value: "rect", label: "Rechteck" },
        { value: "triangle", label: "Dreieck" }, { value: "rectRot", label: "Raute" },
        { value: "cross", label: "Kreuz" }, { value: "star", label: "Stern" }
      ], description: "Form der Datenpunkte" },
      lineWidth: { type: "number", min: 1, max: 10, step: 1, default: 3, description: "Breite der Linien" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Monate", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Verkäufe", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

