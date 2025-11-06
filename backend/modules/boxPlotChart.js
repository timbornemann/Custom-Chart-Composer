export default {
  id: "boxPlot",
  name: "Boxplot",
  category: "special",
  description: "Zeigt Verteilungen mit Minimum, Quartilen und Maximum als Boxplot.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Quartilsanalyse"
    },
    labels: {
      type: "array",
      default: ["Nord", "Süd", "West", "Ost"]
    },
    series: {
      type: "array",
      default: [
        {
          name: "Team A",
          color: "#60A5FA",
          borderColor: "#1D4ED8",
          values: [
            { min: 12, q1: 18, median: 24, q3: 28, max: 34 },
            { min: 10, q1: 16, median: 20, q3: 26, max: 30 },
            { min: 14, q1: 19, median: 23, q3: 29, max: 35 },
            { min: 11, q1: 17, median: 21, q3: 25, max: 29 }
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
      showOutliers: {
        type: "boolean",
        default: true,
        description: "Ausreißerpunkte anzeigen"
      },
      yAxisLabel: {
        type: "string",
        default: "Werte"
      }
    }
  }
}
