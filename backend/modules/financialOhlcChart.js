export default {
  id: "ohlc",
  name: "OHLC (Finanzdiagramm)",
  category: "special",
  description: "Stellt Kursverläufe als OHLC-Balken mit Open-, High-, Low- und Close-Werten dar.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Kursverlauf"
    },
    financialSeries: {
      type: "array",
      default: [
        {
          name: "Index X",
          color: "#F472B6",
          borderColor: "#EC4899",
          values: [
            { label: "Tag 1", open: 9800, high: 9950, low: 9700, close: 9900 },
            { label: "Tag 2", open: 9900, high: 10020, low: 9820, close: 9980 },
            { label: "Tag 3", open: 9980, high: 10110, low: 9900, close: 10040 },
            { label: "Tag 4", open: 10040, high: 10180, low: 9950, close: 10010 }
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
      upColor: {
        type: "color",
        default: "#16A34A",
        description: "Farbe für steigende Kurse"
      },
      downColor: {
        type: "color",
        default: "#DC2626",
        description: "Farbe für fallende Kurse"
      },
      yAxisLabel: {
        type: "string",
        default: "Punkte"
      }
    }
  }
}
