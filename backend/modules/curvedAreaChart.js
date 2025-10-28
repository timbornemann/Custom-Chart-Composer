export default {
  id: "curvedArea",
  name: "Geschwungenes Flächendiagramm",
  category: "line",
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
      showLegend: { type: "boolean", default: true, description: "Legende ein-/ausblenden" },
      legendPosition: { type: "select", default: "top", options: [
        { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
        { value: "left", label: "Links" }, { value: "right", label: "Rechts" }
      ], description: "Position der Legende" },
      showGrid: { type: "boolean", default: true, description: "Gitterlinien anzeigen" },
      gridColor: { type: "color", default: "#334155", description: "Farbe der Gitterlinien" },
      beginAtZero: { type: "boolean", default: true, description: "Y-Achse bei 0 beginnen" },
      smoothing: { type: "number", min: 0, max: 1, step: 0.1, default: 0.5, description: "Grad der Kurvenkrümmung" },
      fillOpacity: { type: "number", min: 0, max: 100, step: 5, default: 60, description: "Transparenz der Füllung (%)" },
      showPoints: { type: "boolean", default: true, description: "Datenpunkte anzeigen" },
      pointRadius: { type: "number", min: 0, max: 20, step: 1, default: 5, description: "Größe der Datenpunkte" },
      lineWidth: { type: "number", min: 1, max: 10, step: 1, default: 3, description: "Breite der Linie" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Uhrzeit", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Last", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

