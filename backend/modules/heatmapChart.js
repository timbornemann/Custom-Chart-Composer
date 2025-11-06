export default {
  id: "heatmap",
  name: "Heatmap-Diagramm",
  category: "scatter",
  description: "Matrixdarstellung mit Farbintensitäten für Dichte. Unterstützt Standard-Heatmap und Kalender-Heatmap (GitHub-Style).",
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
            { x: "Mo", y: "06:00", v: 15, label: "Morgen Montag" },
            { x: "Mo", y: "12:00", v: 45, label: "Mittag Montag" },
            { x: "Mo", y: "18:00", v: 75, label: "Abend Montag" },
            { x: "Di", y: "06:00", v: 20, label: "Morgen Dienstag" },
            { x: "Di", y: "12:00", v: 50, label: "Mittag Dienstag" },
            { x: "Di", y: "18:00", v: 80, label: "Abend Dienstag" },
            { x: "Mi", y: "06:00", v: 18, label: "Morgen Mittwoch" },
            { x: "Mi", y: "12:00", v: 55, label: "Mittag Mittwoch" },
            { x: "Mi", y: "18:00", v: 85, label: "Abend Mittwoch" }
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
      showLegend: { type: "boolean", default: true, description: "Legende ein-/ausblenden" },
      legendPosition: { type: "select", default: "top", options: [
        { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
        { value: "left", label: "Links" }, { value: "right", label: "Rechts" }
      ], description: "Position der Legende" },
      showGrid: { type: "boolean", default: true, description: "Gitterlinien anzeigen" },
      gridColor: { type: "color", default: "#334155", description: "Farbe der Gitterlinien" },
      heatmapType: { type: "select", default: "standard", options: [
        { value: "standard", label: "Standard-Heatmap" },
        { value: "calendar", label: "Kalender-Heatmap (GitHub-Style)" }
      ], description: "Typ der Heatmap" },
      cellSize: { type: "number", min: 10, max: 50, step: 5, default: 20, description: "Größe der Zellen" },
      cellSpacing: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Abstand zwischen Zellen" },
      showValues: { type: "boolean", default: true, description: "Werte in Zellen anzeigen" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Wochentage", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Uhrzeiten", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

