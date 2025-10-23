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
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true },
      stacked: { type: "boolean", default: true },
      horizontal: { type: "boolean", default: false }
    }
  }
};

