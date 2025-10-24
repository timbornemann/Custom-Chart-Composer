export default {
  id: "streamGraph",
  name: "Stream-Graph",
  category: "line",
  description: "Gestapeltes Flächendiagramm mit zentrierter Basislinie für Verlaufsanalysen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Stream-Graph Analyse"
    },
    labels: { 
      type: "array", 
      default: ["2019", "2020", "2021", "2022", "2023", "2024"] 
    },
    datasets: {
      type: "datasets",
      default: [
        {
          label: "Kategorie A",
          data: [30, 45, 60, 55, 70, 85],
          backgroundColor: "#3B82F6"
        },
        {
          label: "Kategorie B",
          data: [25, 35, 40, 50, 45, 55],
          backgroundColor: "#10B981"
        },
        {
          label: "Kategorie C",
          data: [20, 30, 35, 40, 50, 45],
          backgroundColor: "#F59E0B"
        },
        {
          label: "Kategorie D",
          data: [15, 25, 30, 35, 40, 50],
          backgroundColor: "#8B5CF6"
        }
      ]
    },
    backgroundColor: {
      type: "string",
      default: "#0F172A"
    },
    width: {
      type: "number",
      default: 1000
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
      smoothing: { type: "number", min: 0, max: 1, step: 0.1, default: 0.4, description: "Grad der Kurvenkrümmung" },
      fillOpacity: { type: "number", min: 0, max: 100, step: 5, default: 80, description: "Transparenz der Füllung (%)" },
      centerBaseline: { type: "boolean", default: true, description: "Basislinie zentrieren (Wiggle)" },
      showPoints: { type: "boolean", default: false, description: "Datenpunkte anzeigen" },
      pointRadius: { type: "number", min: 2, max: 10, step: 1, default: 4, description: "Größe der Datenpunkte" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Jahre", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1200, description: "Animationsdauer in Millisekunden" }
    }
  }
};

