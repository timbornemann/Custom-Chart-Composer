export default {
  id: "horizontalBar",
  name: "Horizontales Balkendiagramm",
  category: "bar",
  description: "Horizontale Balken zur Darstellung von Kategorien.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Produkt A", "Produkt B", "Produkt C", "Produkt D"] 
    },
    values: { 
      type: "array", 
      default: [85, 92, 78, 95] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B"] 
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
      beginAtZero: { type: "boolean", default: true, description: "Achse bei 0 beginnen" },
      showValues: { type: "boolean", default: false, description: "Werte auf Balken anzeigen" },
      barThickness: { type: "number", min: 5, max: 100, step: 5, default: 40, description: "Dicke der Balken in Pixeln" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite der Balken" },
      borderRadius: { type: "number", min: 0, max: 50, step: 1, default: 8, description: "Abrundung der Balkenecken" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Werte", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Produkte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

