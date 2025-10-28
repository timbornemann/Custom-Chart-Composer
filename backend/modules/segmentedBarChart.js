export default {
  id: "segmentedBar",
  name: "Segmentiertes Balkendiagramm",
  category: "bar",
  description: "Segmentierte Balken mit mehreren Abschnitten pro Kategorie.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Projekt A", "Projekt B", "Projekt C", "Projekt D"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Phase 1",
          data: [450, 820, 350, 670],
          backgroundColor: "#10B981"
        },
        {
          label: "Phase 2",
          data: [320, 540, 280, 410],
          backgroundColor: "#3B82F6"
        },
        {
          label: "Phase 3",
          data: [180, 230, 420, 290],
          backgroundColor: "#F59E0B"
        },
        {
          label: "Phase 4",
          data: [90, 110, 160, 80],
          backgroundColor: "#EF4444"
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
      stacked: { type: "boolean", default: true, description: "Balken stapeln" },
      horizontal: { type: "boolean", default: false, description: "Horizontale Ausrichtung" },
      showValues: { type: "boolean", default: false, description: "Werte auf Balken anzeigen" },
      barThickness: { type: "number", min: 5, max: 100, step: 5, default: 40, description: "Dicke der Balken in Pixeln" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite der Balken" },
      borderRadius: { type: "number", min: 0, max: 50, step: 1, default: 8, description: "Abrundung der Balkenecken" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Projekte", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

