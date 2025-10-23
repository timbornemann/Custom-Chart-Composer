export default {
  id: "heatmap",
  name: "Heatmap-Diagramm",
  category: "scatter",
  description: "Matrixdarstellung mit Farbintensitäten für Dichte.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] 
    },
    yLabels: {
      type: "array",
      default: ["06:00", "12:00", "18:00"]
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Aktivität",
          data: [
            { x: "Mo", y: "06:00", v: 15 },
            { x: "Mo", y: "12:00", v: 45 },
            { x: "Mo", y: "18:00", v: 75 },
            { x: "Di", y: "06:00", v: 20 },
            { x: "Di", y: "12:00", v: 50 },
            { x: "Di", y: "18:00", v: 80 },
            { x: "Mi", y: "06:00", v: 18 },
            { x: "Mi", y: "12:00", v: 55 },
            { x: "Mi", y: "18:00", v: 85 }
          ],
          backgroundColor: "#3B82F6"
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

