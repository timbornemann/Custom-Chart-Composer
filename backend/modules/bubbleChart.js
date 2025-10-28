export default {
  id: "bubble",
  name: "Blasendiagramm",
  category: "scatter",
  description: "Blasen zeigen zusätzliche Dimension über den Radius.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Dataset 1",
          data: [
            { x: 20, y: 30, r: 15, label: "Produkt A" },
            { x: 40, y: 10, r: 10, label: "Produkt B" },
            { x: 30, y: 40, r: 20, label: "Produkt C" },
            { x: 50, y: 25, r: 12, label: "Produkt D" },
            { x: 15, y: 45, r: 18, label: "Produkt E" },
            { x: 45, y: 35, r: 8, label: "Produkt F" }
          ],
          backgroundColor: "#EC4899"
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
      showGrid: { type: "boolean", default: true, description: "Gitterlinien anzeigen" },
      gridColor: { type: "color", default: "#334155", description: "Farbe der Gitterlinien" },
      beginAtZero: { type: "boolean", default: true, description: "Achsen bei 0 beginnen" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite der Blasen" },
      minBubbleRadius: { type: "number", min: 1, max: 20, default: 3, description: "Minimaler Blasenradius" },
      maxBubbleRadius: { type: "number", min: 10, max: 100, default: 40, description: "Maximaler Blasenradius" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. X-Werte", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Y-Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

