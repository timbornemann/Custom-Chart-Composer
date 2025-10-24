export default {
  id: "violin",
  name: "Violin-Chart",
  category: "special",
  description: "Erweiterte Darstellung statistischer Verteilungen mit Dichtefunktion.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Violin-Plot Analyse"
    },
    labels: { 
      type: "array", 
      default: ["Kategorie A", "Kategorie B", "Kategorie C"] 
    },
    datasets: {
      type: "datasets",
      default: [
        {
          label: "Untere Verteilung",
          data: [15, 20, 12],
          backgroundColor: "#4C1D95"
        },
        {
          label: "Mittlere Dichte",
          data: [30, 35, 25],
          backgroundColor: "#8B5CF6"
        },
        {
          label: "Obere Verteilung",
          data: [40, 45, 38],
          backgroundColor: "#A78BFA"
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
      stacked: { type: "boolean", default: true, description: "Bereiche stapeln" },
      smoothing: { type: "number", min: 0, max: 1, step: 0.1, default: 0.5, description: "Glättung der Linien" },
      fillOpacity: { type: "number", min: 0, max: 100, step: 5, default: 70, description: "Transparenz der Füllung (%)" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Kategorien", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};
