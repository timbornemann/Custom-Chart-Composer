export default {
  id: "dashedLine",
  name: "Gestricheltes Liniendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { 
      type: "array", 
      default: ["Woche 1", "Woche 2", "Woche 3", "Woche 4", "Woche 5", "Woche 6"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Ist-Werte",
          data: [65, 72, 68, 75, 80, 85],
          backgroundColor: "#3B82F6",
          borderColor: "#3B82F6",
          borderDash: [],
          borderWidth: 2,
          tension: 0
        },
        {
          label: "Prognose",
          data: [null, null, null, null, 80, 88, 95, 100],
          backgroundColor: "#F59E0B",
          borderColor: "#F59E0B",
          borderDash: [5, 5],
          borderWidth: 2,
          tension: 0
        },
        {
          label: "Ziel",
          data: [70, 70, 70, 70, 70, 70],
          backgroundColor: "#10B981",
          borderColor: "#10B981",
          borderDash: [10, 5],
          borderWidth: 2,
          tension: 0
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
      showPoints: { type: "boolean", default: true }
    }
  }
};

