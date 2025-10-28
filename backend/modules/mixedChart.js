export default {
  id: "mixed",
  name: "Kombiniertes Diagramm",
  category: "special",
  description: "Kombiniert verschiedene Charttypen in einem Diagramm.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Jan", "Feb", "Mär", "Apr", "Mai"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          type: "bar",
          label: "Verkäufe",
          data: [65, 59, 80, 81, 56],
          backgroundColor: "#3B82F6",
          borderColor: "#3B82F6"
        },
        {
          type: "line",
          label: "Trend",
          data: [50, 55, 70, 75, 65],
          borderColor: "#EF4444",
          backgroundColor: "transparent",
          borderWidth: 3
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
      showPoints: { type: "boolean", default: true, description: "Datenpunkte anzeigen" },
      pointRadius: { type: "number", min: 0, max: 20, step: 1, default: 5, description: "Größe der Datenpunkte" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Monate", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

