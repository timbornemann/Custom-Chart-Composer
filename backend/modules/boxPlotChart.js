export default {
  id: "boxPlot",
  name: "Box-Plot-Diagramm",
  category: "special",
  description: "Statistisches Diagramm zur Darstellung von Quartilen, Median und Ausreißern.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Box-Plot Analyse"
    },
    labels: { 
      type: "array", 
      default: ["Gruppe A", "Gruppe B", "Gruppe C", "Gruppe D"] 
    },
    datasets: {
      type: "datasets",
      default: [
        {
          label: "Minimum",
          data: [10, 15, 12, 18],
          backgroundColor: "#1E3A8A"
        },
        {
          label: "Q1 (25%)",
          data: [20, 25, 22, 28],
          backgroundColor: "#3B82F6"
        },
        {
          label: "Median",
          data: [30, 35, 32, 38],
          backgroundColor: "#60A5FA"
        },
        {
          label: "Q3 (75%)",
          data: [40, 45, 42, 48],
          backgroundColor: "#93C5FD"
        },
        {
          label: "Maximum",
          data: [50, 55, 52, 58],
          backgroundColor: "#DBEAFE"
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
      beginAtZero: { type: "boolean", default: false, description: "Y-Achse bei 0 beginnen" },
      stacked: { type: "boolean", default: true, description: "Balken stapeln" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Gruppen", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};
