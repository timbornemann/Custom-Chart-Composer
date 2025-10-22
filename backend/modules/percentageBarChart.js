export default {
  id: "percentageBar",
  name: "Prozent-Balkendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Projekt A", "Projekt B", "Projekt C", "Projekt D"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Abgeschlossen",
          data: [60, 80, 45, 90],
          backgroundColor: "#10B981"
        },
        {
          label: "In Arbeit",
          data: [25, 15, 35, 8],
          backgroundColor: "#F59E0B"
        },
        {
          label: "Offen",
          data: [15, 5, 20, 2],
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
      stacked: { type: "boolean", default: true }
    }
  }
};

