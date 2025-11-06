const sampleFeatures = [
  {
    type: "Feature",
    id: "DEU",
    properties: { name: "Deutschland" },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [5.9, 54.9],
          [14.6, 54.9],
          [14.6, 47.3],
          [5.9, 47.3],
          [5.9, 54.9]
        ]
      ]
    }
  },
  {
    type: "Feature",
    id: "FRA",
    properties: { name: "Frankreich" },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-5.2, 51.1],
          [8.2, 51.1],
          [8.2, 42.1],
          [-5.2, 42.1],
          [-5.2, 51.1]
        ]
      ]
    }
  },
  {
    type: "Feature",
    id: "ITA",
    properties: { name: "Italien" },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [6.5, 47.1],
          [18.8, 47.1],
          [18.8, 36.6],
          [6.5, 36.6],
          [6.5, 47.1]
        ]
      ]
    }
  }
]

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
      default: [
        { id: "DEU", label: "Deutschland", value: 82 },
        { id: "FRA", label: "Frankreich", value: 68 },
        { id: "ITA", label: "Italien", value: 60 }
      ]
    },
    features: {
      type: "array",
      default: sampleFeatures
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
