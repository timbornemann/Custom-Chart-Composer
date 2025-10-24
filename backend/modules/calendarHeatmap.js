export default {
  id: "calendarHeatmap",
  name: "Kalender-Heatmap",
  category: "scatter",
  description: "Jahresübersicht mit farbkodierten Werten für jeden Tag (GitHub-Style).",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Aktivitätskalender"
    },
    labels: {
      type: "array",
      default: ["Woche 1", "Woche 2", "Woche 3", "Woche 4", "Woche 5", "Woche 6", "Woche 7", "Woche 8"]
    },
    values: {
      type: "array",
      default: [
        { x: 0, y: 0, v: 5 }, { x: 1, y: 0, v: 8 }, { x: 2, y: 0, v: 12 },
        { x: 0, y: 1, v: 3 }, { x: 1, y: 1, v: 15 }, { x: 2, y: 1, v: 7 },
        { x: 0, y: 2, v: 20 }, { x: 1, y: 2, v: 10 }, { x: 2, y: 2, v: 18 },
        { x: 0, y: 3, v: 14 }, { x: 1, y: 3, v: 9 }, { x: 2, y: 3, v: 22 }
      ]
    },
    datasetLabel: {
      type: "string",
      default: "Aktivität"
    },
    colors: {
      type: "array",
      default: ["#0F172A", "#1E3A5F", "#2563EB", "#3B82F6", "#60A5FA"]
    },
    backgroundColor: {
      type: "string",
      default: "#0F172A"
    },
    width: {
      type: "number",
      default: 1000
    },
    height: {
      type: "number",
      default: 400
    },
    options: {
      showLegend: { type: "boolean", default: true, description: "Legende mit Farbskala anzeigen" },
      showGrid: { type: "boolean", default: false, description: "Gitterlinien anzeigen" },
      cellSize: { type: "number", min: 8, max: 20, step: 2, default: 12, description: "Größe der Zellen" },
      cellSpacing: { type: "number", min: 1, max: 5, step: 1, default: 2, description: "Abstand zwischen Zellen" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 800, description: "Animationsdauer in Millisekunden" }
    }
  }
};
