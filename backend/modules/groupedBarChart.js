export default {
  id: "groupedBar",
  name: "Gruppiertes Balkendiagramm",
  library: "chartjs",
  configSchema: {
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
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true }
    }
  }
};

