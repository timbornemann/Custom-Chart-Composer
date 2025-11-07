export default {
  id: "violinPlot",
  name: "Violin-Plot",
  category: "special",
  description: "Visualisiert Verteilungen als Violin-Plots inklusive Dichteverlauf.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Verteilungsvergleich"
    },
    labels: {
      type: "array",
      default: ["Q1", "Q2", "Q3", "Q4"]
    },
    series: {
      type: "array",
      default: [
        {
          name: "Produktlinie A",
          color: "#A855F7",
          borderColor: "#7C3AED",
          values: [
            [12, 14, 18, 21, 22, 24, 26, 28],
            [10, 13, 17, 19, 20, 22, 24, 27],
            [14, 16, 19, 22, 23, 25, 27, 30],
            [11, 15, 18, 21, 24, 26, 28, 29]
          ]
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
      showLegend: {
        type: "boolean",
        default: true
      },
      legendPosition: {
        type: "select",
        default: "top",
        options: [
          { value: "top", label: "Oben" },
          { value: "bottom", label: "Unten" },
          { value: "left", label: "Links" },
          { value: "right", label: "Rechts" }
        ]
      },
      smoothing: {
        type: "number",
        default: 32,
        min: 12,
        max: 128,
        step: 4,
        description: "Anzahl der Stützpunkte für die Dichtekurve"
      },
      yAxisLabel: {
        type: "string",
        default: "Werte"
      }
    }
  }
}
