export default {
  id: "rangeBar",
  name: "Bereichs-Balkendiagramm",
  category: "bar",
  description: "Stellt Wertebereiche mit Balkenintervallen dar.",
  library: "chartjs",
  configSchema: {
    title: {
      type: "string",
      default: ""
    },
    labels: { 
      type: "array", 
      default: ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"] 
    },
    datasets: {
      type: "array",
      default: [
        {
          label: "Zeitbereich",
          data: [
            [10, 45],
            [25, 70],
            [15, 55],
            [40, 85],
            [5, 60]
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
      showLegend: { type: "boolean", default: true },
      showGrid: { type: "boolean", default: true },
      horizontal: { type: "boolean", default: true }
    }
  }
};

