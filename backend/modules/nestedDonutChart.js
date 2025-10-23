export default {
  id: "nestedDonut",
  name: "Verschachteltes Donut-Diagramm",
  category: "pie",
  icon: "🥧",
  description: "Mehrere Donuts zur Darstellung hierarchischer Daten.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Desktop", "Mobile", "Tablet"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Zugriffe",
          data: [60, 30, 10],
          backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
          borderWidth: 2,
          borderColor: "#0F172A"
        },
        {
          label: "Conversions",
          data: [45, 35, 20],
          backgroundColor: ["#60A5FA", "#34D399", "#FBBF24"],
          borderWidth: 2,
          borderColor: "#0F172A"
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
      cutout: { type: "string", default: "50%" }
    }
  }
};

