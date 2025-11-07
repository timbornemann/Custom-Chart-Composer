export default {
  id: "venn",
  name: "Venn-Diagramm",
  category: "special",
  description: "Zeigt Überlappungen zwischen Mengen.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Interessen-Überschneidungen"
    },
    sets: {
      type: "array",
      default: [
        { sets: ["Newsletter"], value: 120 },
        { sets: ["Webinar"], value: 80 },
        { sets: ["Event"], value: 60 },
        { sets: ["Newsletter", "Webinar"], value: 42 },
        { sets: ["Newsletter", "Event"], value: 25 },
        { sets: ["Webinar", "Event"], value: 18 },
        { sets: ["Newsletter", "Webinar", "Event"], value: 10 }
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
      showLegend: {
        type: "boolean",
        default: true
      },
      legendPosition: {
        type: "select",
        default: "right",
        options: [
          { value: "top", label: "Oben" },
          { value: "bottom", label: "Unten" },
          { value: "left", label: "Links" },
          { value: "right", label: "Rechts" }
        ]
      },
      colorScheme: {
        type: "array",
        default: ["#F472B6", "#60A5FA", "#34D399"],
        description: "Farben für die Mengen"
      }
    }
  }
}
