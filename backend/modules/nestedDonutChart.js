export default {
  id: "nestedDonut",
  name: "Verschachteltes Donut-Diagramm",
  category: "pie",
  description: "Mehrere Donuts zur Darstellung hierarchischer Daten.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Desktop", "Mobile", "Tablet"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Zugriffe",
          data: [60, 30, 10],
          backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
          borderWidth: 2,
          borderColor: "#0F172A"
        },
        {
          label: "Conversions",
          data: [45, 35, 20],
          backgroundColor: ["#60A5FA", "#34D399", "#FBBF24"],
          borderWidth: 2,
          borderColor: "#0F172A"
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
      cutout: { type: "number", min: 0, max: 95, step: 5, default: 50, description: "Größe des Lochs im Zentrum (%)" },
      showPercentage: { type: "boolean", default: true, description: "Prozentangaben anzeigen" },
      showValues: { type: "boolean", default: false, description: "Werte anzeigen" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite der Segmente" },
      hoverOffset: { type: "number", min: 0, max: 50, step: 5, default: 10, description: "Hover-Abstand in Pixeln" },
      startAngle: { type: "number", min: 0, max: 360, step: 15, default: 0, description: "Startwinkel in Grad" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

