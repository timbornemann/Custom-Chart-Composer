export default {
  id: "funnel",
  name: "Trichterdiagramm",
  category: "special",
  description: "Visualisiert Conversion-Stufen in einem Trichter.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Marketing-Funnel"
    },
    labels: {
      type: "array",
      default: ["Besucher", "Signup", "Test", "Kauf"]
    },
    values: {
      type: "array",
      default: [1200, 650, 320, 140]
    },
    colors: {
      type: "array",
      default: ["#38BDF8", "#34D399", "#FBBF24", "#F472B6"]
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
        default: false
      },
      legendPosition: {
        type: "select",
        default: "bottom",
        options: [
          { value: "top", label: "Oben" },
          { value: "bottom", label: "Unten" },
          { value: "left", label: "Links" },
          { value: "right", label: "Rechts" }
        ]
      },
      showValues: {
        type: "boolean",
        default: true,
        description: "Prozentuale Werte im Trichter anzeigen"
      },
      align: {
        type: "select",
        default: "center",
        options: [
          { value: "center", label: "Zentriert" },
          { value: "left", label: "Links" },
          { value: "right", label: "Rechts" }
        ]
      }
    }
  }
}
