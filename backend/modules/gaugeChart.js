export default {
  id: "gauge",
  name: "Tachometer-Diagramm",
  category: "special",
  description: "Tachometer zur Visualisierung eines aktuellen Wertes.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Niedrig", "Mittel", "Hoch"] 
    },
    values: { 
      type: "array", 
      default: [33, 33, 34] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    currentValue: {
      type: "number",
      default: 65
    },
    colors: { 
      type: "array", 
      default: ["#10B981", "#F59E0B", "#EF4444"] 
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
      legendPosition: { type: "select", default: "bottom", options: [
        { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
        { value: "left", label: "Links" }, { value: "right", label: "Rechts" }
      ], description: "Position der Legende" },
      rotation: { type: "number", min: -180, max: 180, step: 15, default: -90, description: "Rotation in Grad" },
      circumference: { type: "number", min: 90, max: 360, step: 15, default: 180, description: "Winkelbereich in Grad" },
      cutout: { type: "number", min: 50, max: 90, step: 5, default: 75, description: "Größe des Lochs im Zentrum (%)" },
      showNeedle: { type: "boolean", default: true, description: "Zeiger anzeigen" },
      showPercentage: { type: "boolean", default: true, description: "Prozentangaben anzeigen" },
      showValues: { type: "boolean", default: true, description: "Werte anzeigen" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite der Segmente" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

