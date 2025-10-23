export default {
  id: "donut",
  name: "Donutdiagramm",
  category: "pie",
  description: "Ringdiagramm als Variation des Kreisdiagramms.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Desktop", "Mobile", "Tablet", "Andere"] 
    },
    values: { 
      type: "array", 
      default: [450, 320, 150, 80] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#22D3EE", "#3B82F6", "#A78BFA", "#F472B6"] 
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
      showPercentage: { type: "boolean", default: true, description: "Prozentangaben anzeigen" },
      showValues: { type: "boolean", default: false, description: "Werte anzeigen" },
      showLabels: { type: "boolean", default: true, description: "Labels anzeigen" },
      cutout: { type: "number", min: 0, max: 95, step: 5, default: 65, description: "Größe des Lochs im Zentrum (%)" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 3, description: "Rahmenbreite der Segmente" },
      hoverOffset: { type: "number", min: 0, max: 50, step: 5, default: 10, description: "Hover-Abstand in Pixeln" },
      startAngle: { type: "number", min: 0, max: 360, step: 15, default: 0, description: "Startwinkel in Grad" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

