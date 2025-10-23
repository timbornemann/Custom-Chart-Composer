export default {
  id: "multiLine",
  name: "Multi-Liniendiagramm",
  category: "line",
  description: "Mehrere Linien zum Vergleich verschiedener Serien.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Serie 1",
          data: [12, 19, 15, 25, 22, 30],
          borderColor: "#3B82F6",
          backgroundColor: "#3B82F640"
        },
        {
          label: "Serie 2",
          data: [8, 15, 12, 18, 16, 22],
          borderColor: "#10B981",
          backgroundColor: "#10B98140"
        },
        {
          label: "Serie 3",
          data: [5, 10, 8, 14, 12, 18],
          borderColor: "#F59E0B",
          backgroundColor: "#F59E0B40"
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
      smooth: { type: "boolean", default: true, description: "Linien glätten" },
      tension: { type: "number", min: 0, max: 1, step: 0.1, default: 0.4, description: "Grad der Linienkurve" },
      fill: { type: "boolean", default: false, description: "Flächen füllen" },
      fillOpacity: { type: "number", min: 0, max: 100, step: 5, default: 40, description: "Transparenz der Füllung (%)" },
      showPoints: { type: "boolean", default: true, description: "Datenpunkte anzeigen" },
      pointRadius: { type: "number", min: 0, max: 20, step: 1, default: 5, description: "Größe der Datenpunkte" },
      lineWidth: { type: "number", min: 1, max: 10, step: 1, default: 3, description: "Breite der Linien" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Monate", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

