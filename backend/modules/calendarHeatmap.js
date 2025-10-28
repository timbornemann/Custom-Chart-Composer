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
    datasets: {
      type: "array",
      default: [
        {
          label: "Aktivität",
          data: [
            { x: 0, y: 0, v: 5, label: "Woche 1 - Tag 1" }, { x: 1, y: 0, v: 8, label: "Woche 2 - Tag 1" }, { x: 2, y: 0, v: 12, label: "Woche 3 - Tag 1" },
            { x: 0, y: 1, v: 3, label: "Woche 1 - Tag 2" }, { x: 1, y: 1, v: 15, label: "Woche 2 - Tag 2" }, { x: 2, y: 1, v: 7, label: "Woche 3 - Tag 2" },
            { x: 0, y: 2, v: 20, label: "Woche 1 - Tag 3" }, { x: 1, y: 2, v: 10, label: "Woche 2 - Tag 3" }, { x: 2, y: 2, v: 18, label: "Woche 3 - Tag 3" },
            { x: 0, y: 3, v: 14, label: "Woche 1 - Tag 4" }, { x: 1, y: 3, v: 9, label: "Woche 2 - Tag 4" }, { x: 2, y: 3, v: 22, label: "Woche 3 - Tag 4" }
          ],
          backgroundColor: "#3B82F6"
        }
      ]
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
