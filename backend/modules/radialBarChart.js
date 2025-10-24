export default {
  id: "radialBar",
  name: "Radiales Balkendiagramm",
  category: "pie",
  description: "Balkendiagramm in kreisförmiger Anordnung für kompakte Darstellung.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Radiales Balkendiagramm"
    },
    labels: { 
      type: "array", 
      default: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] 
    },
    values: { 
      type: "array", 
      default: [85, 72, 90, 68, 95, 45, 38] 
    },
    datasetLabel: {
      type: "string",
      default: "Wochenwerte"
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#EF4444", "#06B6D4"] 
    },
    backgroundColor: {
      type: "string",
      default: "#0F172A"
    },
    width: {
      type: "number",
      default: 700
    },
    height: {
      type: "number",
      default: 700
    },
    options: {
      showLegend: { type: "boolean", default: true, description: "Legende ein-/ausblenden" },
      legendPosition: { type: "select", default: "bottom", options: [
        { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
        { value: "left", label: "Links" }, { value: "right", label: "Rechts" }
      ], description: "Position der Legende" },
      innerRadius: { type: "number", min: 0, max: 80, step: 5, default: 30, description: "Innerer Radius (in %)" },
      barWidth: { type: "number", min: 10, max: 50, step: 5, default: 25, description: "Breite der Balken" },
      startAngle: { type: "number", min: -180, max: 180, step: 15, default: 0, description: "Start-Winkel (Grad)" },
      showValues: { type: "boolean", default: true, description: "Werte anzeigen" },
      showLabels: { type: "boolean", default: true, description: "Beschriftungen anzeigen" },
      labelDistance: { type: "number", min: 0, max: 50, step: 5, default: 15, description: "Abstand der Labels" },
      gridLines: { type: "boolean", default: true, description: "Kreisförmige Gitterlinien" },
      gridColor: { type: "color", default: "#334155", description: "Farbe der Gitterlinien" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

