export default {
  id: "verticalLine",
  name: "Vertikales Liniendiagramm",
  category: "line",
  description: "Vertikale Linien zur Darstellung von Entwicklungen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["0°", "45°", "90°", "135°", "180°", "225°", "270°", "315°"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Sinus-Welle",
          data: [0, 70, 100, 70, 0, -70, -100, -70],
          borderColor: "#06B6D4",
          backgroundColor: "#06B6D4"
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
      smooth: { type: "boolean", default: true, description: "Linie glätten" },
      tension: { type: "number", min: 0, max: 1, step: 0.1, default: 0.4, description: "Grad der Linienkurve" },
      fill: { type: "boolean", default: false, description: "Fläche unter der Linie füllen" },
      fillOpacity: { type: "number", min: 0, max: 100, step: 5, default: 40, description: "Transparenz der Füllung (%)" },
      showPoints: { type: "boolean", default: true, description: "Datenpunkte anzeigen" },
      pointRadius: { type: "number", min: 0, max: 20, step: 1, default: 5, description: "Größe der Datenpunkte" },
      pointStyle: { type: "select", default: "circle", options: [
        { value: "circle", label: "Kreis" }, { value: "rect", label: "Rechteck" },
        { value: "triangle", label: "Dreieck" }, { value: "rectRot", label: "Raute" },
        { value: "cross", label: "Kreuz" }, { value: "star", label: "Stern" }
      ], description: "Form der Datenpunkte" },
      lineWidth: { type: "number", min: 1, max: 10, step: 1, default: 3, description: "Breite der Linie" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Winkel", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

