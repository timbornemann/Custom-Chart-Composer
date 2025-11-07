export default {
  id: "candlestick",
  name: "Candlestick (Finanzdiagramm)",
  category: "special",
  description: "Zeigt Kursverläufe mit Open-, High-, Low- und Close-Werten als Candlestick.",
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
          name: "Aktie A",
          color: "#38BDF8",
          borderColor: "#0EA5E9",
          values: [
            { label: "KW 1", open: 112, high: 125, low: 108, close: 121 },
            { label: "KW 2", open: 121, high: 130, low: 118, close: 126 },
            { label: "KW 3", open: 126, high: 134, low: 120, close: 128 },
            { label: "KW 4", open: 128, high: 140, low: 125, close: 136 }
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
        default: true,
        description: "Legende ein-/ausblenden"
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
      risingColor: {
        type: "color",
        default: "#22C55E",
        description: "Farbe für steigende Kurse"
      },
      fallingColor: {
        type: "color",
        default: "#EF4444",
        description: "Farbe für fallende Kurse"
      },
      showValues: {
        type: "boolean",
        default: false,
        description: "Kurswerte direkt im Chart anzeigen"
      },
      yAxisLabel: {
        type: "string",
        default: "Preis",
        description: "Beschriftung der Preis-Achse"
      }
    }
  }
}
