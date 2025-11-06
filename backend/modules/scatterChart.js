export default {
  id: "scatter",
  name: "Streudiagramm",
  category: "scatter",
  description: "Punkte zur Analyse von Zusammenhängen zweier Variablen. Unterstützt auch geografische Koordinaten (Longitude/Latitude).",
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
          label: "Datenpunkte",
          data: [
            { x: 10, y: 20, label: "Punkt A" },
            { x: 15, y: 35, label: "Punkt B" },
            { x: 20, y: 30, label: "Punkt C" },
            { x: 25, y: 45, label: "Punkt D" },
            { x: 30, y: 40, label: "Punkt E" },
            { x: 35, y: 55, label: "Punkt F" },
            { x: 40, y: 50, label: "Punkt G" }
          ],
          backgroundColor: "#8B5CF6"
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
      beginAtZero: { type: "boolean", default: true, description: "Achsen bei 0 beginnen" },
      pointRadius: { type: "number", min: 1, max: 30, step: 1, default: 8, description: "Größe der Punkte" },
      pointStyle: { type: "select", default: "circle", options: [
        { value: "circle", label: "Kreis" }, { value: "rect", label: "Rechteck" },
        { value: "triangle", label: "Dreieck" }, { value: "rectRot", label: "Raute" },
        { value: "cross", label: "Kreuz" }, { value: "star", label: "Stern" }
      ], description: "Form der Punkte" },
      borderWidth: { type: "number", min: 0, max: 10, step: 1, default: 2, description: "Rahmenbreite" },
      dataFormat: { type: "select", default: "xy", options: [
        { value: "xy", label: "X/Y-Koordinaten (Standard)" },
        { value: "coordinates", label: "Geografische Koordinaten (Longitude/Latitude)" }
      ], description: "Datenformat für Eingabe" },
      aspectRatio: { type: "select", default: "auto", options: [
        { value: "auto", label: "Automatisch" },
        { value: "equal", label: "1:1 (Gleich)" },
        { value: "mercator", label: "Mercator-Projektion" }
      ], description: "Seitenverhältnis der Achsen (nur bei geografischen Koordinaten)" },
      showCoordinateLabels: { type: "boolean", default: true, description: "Koordinaten-Beschriftungen anzeigen (nur bei geografischen Koordinaten)" },
      labelPosition: { type: "select", default: "top", options: [
        { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
        { value: "left", label: "Links" }, { value: "right", label: "Rechts" }
      ], description: "Position der Punkt-Labels (nur bei geografischen Koordinaten)" },
      xAxisLabel: { type: "string", default: "", placeholder: "z.B. X-Werte", description: "Beschriftung der X-Achse" },
      yAxisLabel: { type: "string", default: "", placeholder: "z.B. Y-Werte", description: "Beschriftung der Y-Achse" },
      animation: { type: "boolean", default: true, description: "Animationen aktivieren" },
      animationDuration: { type: "number", min: 0, max: 3000, step: 100, default: 1000, description: "Animationsdauer in Millisekunden" }
    }
  }
};

