export default {
  id: "radar",
  name: "Radar-Chart",
  category: "special",
  description: "Mehrdimensionale Daten auf polaren Achsen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Geschwindigkeit", "Zuverlässigkeit", "Komfort", "Sicherheit", "Design"] 
    },
    values: { 
      type: "array", 
      default: [85, 90, 75, 95, 80] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#22D3EE"] 
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
      fill: { type: "boolean", default: true, description: "Fläche füllen" },
      fillOpacity: { type: "number", min: 0, max: 100, step: 5, default: 40, description: "Transparenz der Füllung (%)" },
      pointRadius: { type: "number", min: 0, max: 20, step: 1, default: 5, description: "Größe der Datenpunkte" },
      lineWidth: { type: "number", min: 1, max: 10, step: 1, default: 3, description: "Breite der Linie" },
      scaleMin: { type: "number", min: 0, max: 100, default: 0, description: "Minimaler Skalenwert" },
      scaleMax: { type: "number", min: 1, max: 200, default: 100, description: "Maximaler Skalenwert" },
      scaleStepSize: { type: "number", min: 1, max: 50, default: 20, description: "Schrittweite der Skala" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

