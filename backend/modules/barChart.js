export default {
  id: "bar",
  name: "Balkendiagramm",
  category: "bar",
  description: "Zeigt kategoriale Daten als vertikale Balken.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Januar", "Februar", "März", "April", "Mai"] 
    },
    values: { 
      type: "array", 
      default: [65, 59, 80, 81, 56] 
    },
    datasetLabel: {
      type: "string",
      default: "Datensatz"
    },
    colors: { 
      type: "array", 
      default: ["#4ADE80", "#22D3EE", "#F472B6", "#FBBF24", "#A78BFA"] 
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
        ],
        description: "Position der Legende"
      },
      showGrid: { 
        type: "boolean", 
        default: true,
        description: "Gitterlinien anzeigen"
      },
      gridColor: {
        type: "color",
        default: "#334155",
        description: "Farbe der Gitterlinien"
      },
      beginAtZero: {
        type: "boolean",
        default: true,
        description: "Y-Achse bei 0 beginnen"
      },
      showValues: {
        type: "boolean",
        default: false,
        description: "Werte auf Balken anzeigen"
      },
      showPercentages: {
        type: "boolean",
        default: false,
        description: "Prozentangaben anzeigen (für Trichter-Diagramme)"
      },
      barThickness: {
        type: "number",
        min: 5,
        max: 100,
        step: 5,
        default: 40,
        description: "Dicke der Balken in Pixeln"
      },
      borderWidth: {
        type: "number",
        min: 0,
        max: 10,
        step: 1,
        default: 2,
        description: "Rahmenbreite der Balken"
      },
      borderRadius: {
        type: "number",
        min: 0,
        max: 50,
        step: 1,
        default: 8,
        description: "Abrundung der Balkenecken"
      },
      xAxisLabel: {
        type: "string",
        default: "",
        placeholder: "z.B. Monate",
        description: "Beschriftung der X-Achse"
      },
      yAxisLabel: {
        type: "string",
        default: "",
        placeholder: "z.B. Verkäufe",
        description: "Beschriftung der Y-Achse"
      },
      yAxisMin: {
        type: "number",
        default: null,
        description: "Minimalwert der Y-Achse (leer = automatisch)"
      },
      yAxisMax: {
        type: "number",
        default: null,
        description: "Maximalwert der Y-Achse (leer = automatisch)"
      },
      yAxisStep: {
        type: "number",
        min: 0.1,
        step: 0.1,
        default: null,
        description: "Schrittweite der Y-Achse (leer = automatisch)"
      },
      minBarLength: {
        type: "number",
        min: 0,
        max: 50,
        default: 0,
        description: "Minimale Balkenlänge für kleine Werte"
      },
      orientation: {
        type: "select",
        default: "vertical",
        options: [
          { value: "vertical", label: "Vertikal (Standard)" },
          { value: "horizontal", label: "Horizontal" }
        ],
        description: "Ausrichtung der Balken"
      },
      animation: {
        type: "boolean",
        default: true,
        description: "Animationen aktivieren"
      },
      animationDuration: {
        type: "number",
        min: 0,
        max: 3000,
        step: 100,
        default: 1000,
        description: "Animationsdauer in Millisekunden"
      }
    }
  }
};

