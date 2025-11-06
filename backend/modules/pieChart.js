export default {
  id: "pie",
  name: "Kreisdiagramm",
  category: "pie",
  description: "Teilt ein Ganzes in proportionale Sektoren.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Rot", "Blau", "Gelb", "Grün", "Lila"] 
    },
    values: { 
      type: "array", 
      default: [300, 50, 100, 80, 120] 
    },
    currentValue: {
      type: "number",
      default: null,
      description: "Aktueller Wert für Zeiger (nur bei Tachometer)"
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#EF4444", "#3B82F6", "#FBBF24", "#10B981", "#A78BFA"] 
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
      cutout: { type: "number", min: 0, max: 95, step: 5, default: 0, description: "Größe des Lochs im Zentrum (%) - 0 = Pie, >0 = Donut" },
      innerRadius: { type: "number", min: 0, max: 95, step: 5, default: null, description: "Innerer Radius (in %) - Alternative zu cutout (leer = cutout verwenden)" },
      rotation: { type: "number", min: -180, max: 180, step: 15, default: 0, description: "Start-Rotation in Grad" },
      circumference: { type: "number", min: 90, max: 360, step: 15, default: 360, description: "Winkelbereich in Grad (360 = voller Kreis, 180 = Halbkreis)" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 3, description: "Rahmenbreite der Segmente" },
      hoverOffset: { type: "number", min: 0, max: 50, step: 5, default: 10, description: "Hover-Abstand in Pixeln" },
      startAngle: { type: "number", min: 0, max: 360, step: 15, default: 0, description: "Startwinkel in Grad" },
      showNeedle: { type: "boolean", default: false, description: "Zeiger anzeigen (für Tachometer-Diagramme)" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

