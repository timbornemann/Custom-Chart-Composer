export default {
  id: "curvedArea",
  name: "Geschwungenes Flächendiagramm",
  category: "line",
  icon: "📈",
  description: "Weich gefüllte Kurvenfläche für Trends.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Server Last",
          data: [30, 25, 45, 70, 85, 60, 35],
          borderColor: "#8B5CF6",
          backgroundColor: "#8B5CF6",
          borderDash: [],
          borderWidth: 3,
          fill: true,
          tension: 0.5
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
      smoothing: { type: "number", default: 0.5 }
    }
  }
};

