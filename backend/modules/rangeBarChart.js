export default {
  id: "rangeBar",
  name: "Bereichs-Balkendiagramm",
  category: "bar",
  description: "Stellt Wertebereiche mit Balkenintervallen dar.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Zeitbereich",
          data: [
            [10, 45],
            [25, 70],
            [15, 55],
            [40, 85],
            [5, 60]
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
      beginAtZero: { type: "boolean", default: true, description: "Achse bei 0 beginnen" },
      horizontal: { type: "boolean", default: true, description: "Horizontale Ausrichtung" },
      showValues: { type: "boolean", default: false, description: "Werte auf Balken anzeigen" },
      barThickness: { type: "number", min: 5, max: 100, step: 5, default: 40, description: "Dicke der Balken in Pixeln" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite der Balken" },
      borderRadius: { type: "number", min: 0, max: 50, step: 1, default: 8, description: "Abrundung der Balkenecken" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Zeitbereich", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Tasks", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

