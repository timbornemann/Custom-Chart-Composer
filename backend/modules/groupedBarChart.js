export default {
  id: "groupedBar",
  name: "Gruppiertes Balkendiagramm",
  category: "bar",
  description: "Gruppierte Balken zum Vergleich mehrerer Serien je Kategorie.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["2021", "2022", "2023", "2024"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Desktop",
          data: [45, 52, 48, 61],
          backgroundColor: "#3B82F6"
        },
        {
          label: "Mobile",
          data: [38, 42, 55, 58],
          backgroundColor: "#10B981"
        },
        {
          label: "Tablet",
          data: [12, 18, 20, 25],
          backgroundColor: "#F59E0B"
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
      showValues: { type: "boolean", default: false, description: "Werte auf Balken anzeigen" },
      barThickness: { type: "number", min: 5, max: 100, step: 5, default: 40, description: "Dicke der Balken in Pixeln" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite der Balken" },
      borderRadius: { type: "number", min: 0, max: 50, step: 1, default: 8, description: "Abrundung der Balkenecken" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Jahre", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Verkäufe", description: "Beschriftung der Y-Achse" },
      yAxisMin: { type: "number", default: null, description: "Minimalwert der Y-Achse (leer = automatisch)" },
      yAxisMax: { type: "number", default: null, description: "Maximalwert der Y-Achse (leer = automatisch)" },
      yAxisStep: { type: "number", min: 0.1, step: 0.1, default: null, description: "Schrittweite der Y-Achse (leer = automatisch)" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

