export default {
  id: "coordinate",
  name: "Koordinatendiagramm",
  category: "scatter",
  description: "Darstellung von geografischen Koordinaten (Longitude/Latitude) im Dezimalgrad-Format.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Standorte",
          data: [
            { longitude: 13.4050, latitude: 52.5200, label: "Berlin" },
            { longitude: 9.9937, latitude: 53.5511, label: "Hamburg" },
            { longitude: 11.5820, latitude: 48.1351, label: "München" },
            { longitude: 8.6821, latitude: 50.1109, label: "Frankfurt" },
            { longitude: 6.9603, latitude: 50.9375, label: "Köln" },
            { longitude: 9.1829, latitude: 48.7758, label: "Stuttgart" },
            { longitude: 13.7373, latitude: 51.0504, label: "Dresden" }
          ],
          backgroundColor: "#3B82F6"
        }
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
      showLegend: { type: "boolean", default: true, description: "Legende ein-/ausblenden" },
      legendPosition: { type: "select", default: "top", options: [
        { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
        { value: "left", label: "Links" }, { value: "right", label: "Rechts" }
      ], description: "Position der Legende" },
      showGrid: { type: "boolean", default: true, description: "Gitterlinien anzeigen" },
      gridColor: { type: "color", default: "#334155", description: "Farbe der Gitterlinien" },
      aspectRatio: { type: "select", default: "auto", options: [
        { value: "auto", label: "Automatisch" },
        { value: "equal", label: "1:1 (Gleich)" },
        { value: "mercator", label: "Mercator-Projektion" }
      ], description: "Seitenverhältnis der Achsen" },
      pointRadius: { type: "number", min: 1, max: 30, step: 1, default: 8, description: "Größe der Punkte" },
      pointStyle: { type: "select", default: "circle", options: [
        { value: "circle", label: "Kreis" }, { value: "rect", label: "Rechteck" },
        { value: "triangle", label: "Dreieck" }, { value: "rectRot", label: "Raute" },
        { value: "cross", label: "Kreuz" }, { value: "star", label: "Stern" }
      ], description: "Form der Punkte" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite" },
      xAxisLabel: { type: "string", default: "Longitude (°)", placeholder: "z.B. Longitude", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "Latitude (°)", placeholder: "z.B. Latitude", description: "Beschriftung der Y-Achse" },
      showCoordinateLabels: { type: "boolean", default: true, description: "Koordinaten-Beschriftungen anzeigen" },
      labelPosition: { type: "select", default: "top", options: [
        { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
        { value: "left", label: "Links" }, { value: "right", label: "Rechts" }
      ], description: "Position der Punkt-Labels" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

