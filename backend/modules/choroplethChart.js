export default {
  id: "choropleth",
  name: "Choropleth-Karte",
  category: "special",
  description: "Färbt Regionen basierend auf einer Kennzahl ein.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: "Kennzahlen nach Region"
    },
    regions: {
      type: "array",
      default: []
    },
    features: {
      type: "array",
      default: []
    },
    backgroundColor: {
      type: "string",
      default: "#0F172A"
    },
    width: {
      type: "number",
      default: 960
    },
    height: {
      type: "number",
      default: 640
    },
    options: {
      colorPalette: {
        type: "array",
        default: ["#1E3A8A", "#2563EB", "#3B82F6", "#60A5FA", "#BFDBFE"],
        description: "Farbverlauf für die Werte"
      },
      showLegend: {
        type: "boolean",
        default: true
      },
      legendTitle: {
        type: "string",
        default: "Wert",
        description: "Titel der Legende/Skala"
      },
      legendPosition: {
        type: "select",
        default: "bottom-right",
        options: [
          { value: "top-left", label: "Oben links" },
          { value: "top-right", label: "Oben rechts" },
          { value: "bottom-left", label: "Unten links" },
          { value: "bottom-right", label: "Unten rechts" }
        ],
        description: "Position der Skala"
      },
      legendHeight: {
        type: "number",
        default: 200,
        description: "Höhe der Skala in Pixeln"
      },
      // Note: Font size is automatically scaled based on chart dimensions, no manual setting needed
      outlineColor: {
        type: "color",
        default: "#0F172A",
        description: "Farbe der Umrisse"
      },
      outlineWidth: {
        type: "number",
        default: 0.5,
        description: "Breite der Umrisse"
      },
      projection: {
        type: "select",
        default: "geoEqualEarth",
        options: [
          { value: "geoEqualEarth", label: "Equal Earth" },
          { value: "geoMercator", label: "Mercator" },
          { value: "geoNaturalEarth1", label: "Natural Earth" }
        ]
      }
    }
  }
}
