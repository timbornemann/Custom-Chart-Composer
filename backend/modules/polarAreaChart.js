export default {
  id: "polarArea",
  name: "Polar-Flächendiagramm",
  category: "pie",
  description: "Radiale Darstellung kategorialer Werte.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Rot", "Grün", "Gelb", "Grau", "Blau"] 
    },
    values: { 
      type: "array", 
      default: [11, 16, 7, 3, 14] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#EF4444", "#10B981", "#FBBF24", "#6B7280", "#3B82F6"] 
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
      gridColor: { type: "color", default: "#334155", description: "Farbe der Gitterlinien" },
      startAngle: { type: "number", min: 0, max: 360, step: 15, default: 0, description: "Startwinkel in Grad" },
      showValues: { type: "boolean", default: false, description: "Werte anzeigen" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite der Segmente" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

