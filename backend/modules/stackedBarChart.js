export default {
  id: "stackedBar",
  name: "Gestapeltes Balkendiagramm",
  category: "bar",
  description: "Gestapelte Balken zum Vergleichen von Summen und Anteilen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Q1", "Q2", "Q3", "Q4"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Produkt A",
          data: [40, 50, 45, 60],
          backgroundColor: "#3B82F6"
        },
        {
          label: "Produkt B",
          data: [30, 35, 40, 45],
          backgroundColor: "#8B5CF6"
        },
        {
          label: "Produkt C",
          data: [20, 25, 30, 35],
          backgroundColor: "#EC4899"
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
      showPercentage: { type: "boolean", default: false, description: "Prozentangaben anzeigen" },
      orientation: { type: "select", default: "vertical", options: [
        { value: "vertical", label: "Vertikal (Standard)" },
        { value: "horizontal", label: "Horizontal" }
      ], description: "Ausrichtung der Balken" },
      barThickness: { type: "number", min: 5, max: 100, step: 5, default: 40, description: "Dicke der Balken in Pixeln" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite der Balken" },
      borderRadius: { type: "number", min: 0, max: 50, step: 1, default: 8, description: "Abrundung der Balkenecken" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Quartale", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Summe", description: "Beschriftung der Y-Achse" },
      yAxisMin: { type: "number", default: null, description: "Minimalwert der Y-Achse (leer = automatisch)" },
      yAxisMax: { type: "number", default: null, description: "Maximalwert der Y-Achse (leer = automatisch)" },
      yAxisStep: { type: "number", min: 0.1, step: 0.1, default: null, description: "Schrittweite der Y-Achse (leer = automatisch)" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

