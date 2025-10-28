export default {
  id: "sunburst",
  name: "Sunburst-Diagramm",
  category: "pie",
  description: "Hierarchische Daten als konzentrische Ringe.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Kategorie A", "Kategorie B", "Kategorie C", "Kategorie D"] 
    },
    values: { 
      type: "array", 
      default: [30, 25, 25, 20] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"] 
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
      rotation: { type: "number", min: -180, max: 180, step: 15, default: 0, description: "Rotation in Grad" },
      cutout: { type: "number", min: 0, max: 95, step: 5, default: 30, description: "Größe des Lochs im Zentrum (%)" },
      showPercentage: { type: "boolean", default: true, description: "Prozentangaben anzeigen" },
      showValues: { type: "boolean", default: false, description: "Werte anzeigen" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 3, description: "Rahmenbreite der Segmente" },
      hoverOffset: { type: "number", min: 0, max: 50, step: 5, default: 10, description: "Hover-Abstand in Pixeln" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

