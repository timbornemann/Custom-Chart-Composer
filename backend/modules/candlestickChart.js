export default {
  id: "candlestick",
  name: "Candlestick-Chart",
  category: "special",
  description: "Kerzendiagramm für Finanz- und Börsenanalysen mit OHLC-Daten (Open, High, Low, Close).",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Finanzdaten"
    },
    labels: { 
      type: "array", 
      default: ["Tag 1", "Tag 2", "Tag 3", "Tag 4", "Tag 5", "Tag 6"] 
    },
    datasets: {
      type: "datasets",
      default: [
        {
          label: "Low",
          data: [95, 105, 115, 112, 120, 125],
          backgroundColor: "#64748B"
        },
        {
          label: "Open",
          data: [100, 110, 120, 118, 125, 130],
          backgroundColor: "#94A3B8"
        },
        {
          label: "Close",
          data: [110, 120, 118, 125, 130, 135],
          backgroundColor: "#3B82F6"
        },
        {
          label: "High",
          data: [115, 125, 130, 128, 135, 140],
          backgroundColor: "#60A5FA"
        }
      ]
    },
    backgroundColor: {
      type: "string",
      default: "#0F172A"
    },
    width: {
      type: "number",
      default: 900
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
      stacked: { type: "boolean", default: true, description: "Werte stapeln" },
      candleWidth: { type: "number", min: 20, max: 90, step: 5, default: 60, description: "Breite der Kerzen (in %)" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. Zeitraum", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Preis", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 800, description: "Animationsdauer in Millisekunden" }
    }
  }
};
