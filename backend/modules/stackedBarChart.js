export default {
  id: "stackedBar",
  name: "Gestapeltes Balkendiagramm",
  library: "chartjs",
  configSchema: {
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
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true }
    }
  }
};

