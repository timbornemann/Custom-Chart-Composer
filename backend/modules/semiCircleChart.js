export default {
  id: "semiCircle",
  name: "Halbkreis-Diagramm",
  category: "pie",
  description: "Halbkreis-Donut für begrenzte Winkelansicht.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Erreicht", "Verbleibend"] 
    },
    values: { 
      type: "array", 
      default: [75, 25] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#10B981", "#1F2937"] 
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
      rotation: { type: "number", min: -180, max: 180, step: 15, default: -90, description: "Rotation in Grad" },
      circumference: { type: "number", min: 90, max: 360, step: 15, default: 180, description: "Winkelbereich in Grad" },
      cutout: { type: "string", default: "0%", description: "Größe des Lochs im Zentrum" },
      showPercentage: { type: "boolean", default: true, description: "Prozentangaben anzeigen" },
      showValues: { type: "boolean", default: false, description: "Werte anzeigen" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 3, description: "Rahmenbreite der Segmente" },
      hoverOffset: { type: "number", min: 0, max: 50, step: 5, default: 10, description: "Hover-Abstand in Pixeln" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

