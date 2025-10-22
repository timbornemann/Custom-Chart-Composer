## 1. **Ziel des Projekts**

Custom-Chart-Composer ist ein webbasiertes Tool zur einfachen Erstellung ästhetisch ansprechender Diagramme.
Benutzer sollen Diagrammtypen auswählen, Daten und Farben anpassen und das fertige Ergebnis als **PNG, JPEG, SVG oder HTML** exportieren können.

Das System ist **modular** aufgebaut, um neue Diagrammtypen schnell und nahtlos integrieren zu können.

---

## 2. **Technischer Überblick**

| Komponente        | Technologie                  |
| ----------------- | ---------------------------- |
| Frontend          | React + TailwindCSS          |
| Backend           | Node.js (Express)            |
| Chart-Rendering   | Chart.js oder Apache ECharts |
| Export            | html-to-image / Puppeteer    |
| Containerisierung | Docker (Port 3003)           |
| Datenformat       | JSON (Input/Output)          |

---

## 3. **Funktionale Anforderungen**

### 3.1 Hauptfunktionen

1. **Diagrammauswahl**

   * Benutzer wählt aus einer Liste von Diagrammtypen (z. B. Balken, Linie, Kreis, Donut).
   * Vorschau jedes Diagrammtyps.

2. **Dateneditor**

   * Dynamische Eingabe von:

     * Achsenbeschriftungen
     * Werten
     * Farben
     * Balkenanzahl / Datenpunkte
   * Unterstützt Text- oder numerische Eingaben.
   * Automatische Vorschau-Aktualisierung.

3. **Stylingoptionen**

   * Farbpalette auswählen oder individuelle Farben pro Balken/Slice.
   * Hintergrundfarbe und Schriftart global einstellbar.
   * Option für helle/dunkle Themes.

4. **Diagramm-Export**

   * Export als **PNG, JPEG, SVG oder HTML**.
   * Optional: Transparenter Hintergrund.
   * Export-Button mit Formatwahl.

5. **Modularer Diagramm-Loader**

   * Jeder Diagrammtyp wird als **eigenständiges Modul** mit eigener Konfigurationsbeschreibung geladen.
   * Neue Typen können durch Hinzufügen eines Moduls integriert werden (Plug-in-System).

---

## 4. **Systemarchitektur**

### 4.1 Übersicht

```
Frontend (React + Tailwind)
│
├── ChartSelector     (Diagrammtyp auswählen)
├── ChartConfigPanel  (Daten & Einstellungen)
├── ChartPreview      (Live-Rendering)
└── ExportPanel       (Exportoptionen)
│
↓ REST-API
Backend (Node.js + Express)
├── /charts           (Liste verfügbarer Diagrammtypen)
├── /render           (Diagramm als Bild rendern)
├── /export           (Exportieren in gewünschtes Format)
└── /plugins          (Lädt neue Chart-Module)
│
Docker (Port 3003)
```

---

## 5. **Modulares System für Diagrammtypen**

Jeder Diagrammtyp ist ein **eigenständiges Modul** mit einer Konfigurationsdefinition:

```js
// Beispiel: modules/barChart.js
export default {
  id: "bar",
  name: "Balkendiagramm",
  library: "chartjs",
  configSchema: {
    labels: { type: "array", default: ["A", "B", "C"] },
    values: { type: "array", default: [10, 20, 30] },
    colors: { type: "array", default: ["#4ADE80", "#22D3EE", "#F472B6"] },
    options: {
      stacked: { type: "boolean", default: false },
      showLegend: { type: "boolean", default: true },
    },
  },
  render: async (ctx, config) => {
    // Chart.js rendering logic
  },
};
```

Das Backend lädt automatisch alle Module im Verzeichnis `/modules/`.

### Vorteile:

* Keine Änderung des Kerns bei neuen Diagrammen.
* Jede Datei definiert, wie sie konfiguriert und angezeigt wird.
* UI generiert automatisch die Eingabefelder aus `configSchema`.

---

## 6. **Frontend-Struktur**

```
src/
├── components/
│   ├── ChartSelector.jsx
│   ├── ChartConfigPanel.jsx
│   ├── ChartPreview.jsx
│   ├── ExportPanel.jsx
│   └── Layout/
│       ├── Sidebar.jsx
│       └── Header.jsx
├── hooks/
│   ├── useChartConfig.js
│   └── useExport.js
├── services/
│   ├── api.js
│   └── chartModules.js
├── pages/
│   └── Home.jsx
└── main.jsx
```

---

## 7. **UI-Design & Styleguide**

### 7.1 Farbpalette (Dark Theme)

| Element        | Farbe   |
| -------------- | ------- |
| Hintergrund    | #0F172A |
| Sekundärfläche | #1E293B |
| Akzentfarbe 1  | #3B82F6 |
| Akzentfarbe 2  | #22D3EE |
| Text Hell      | #F8FAFC |
| Text Grau      | #CBD5E1 |

### 7.2 Typografie

* Schriftart: **Inter**, Sans-Serif
* Überschriften: `font-semibold`, `text-xl–2xl`
* Text: `text-sm–base`

### 7.3 Layout

* Sidebar links (Diagrammauswahl)
* Hauptbereich: Vorschau + Konfiguration nebeneinander
* Export-Button prominent rechts unten

### 7.4 Komponenten-Stil

* Karten mit `rounded-2xl`, `shadow-lg`
* Interaktive Elemente mit sanften Hover-Übergängen (`transition-all`, `duration-200`)
* Farbverlauf-Hervorhebungen für aktive Auswahl

---

## 8. **API-Endpunkte**

| Methode | Route                 | Beschreibung                                  |
| ------- | --------------------- | --------------------------------------------- |
| GET     | `/api/charts`         | Liste verfügbarer Diagrammtypen               |
| POST    | `/api/render`         | Rendert ein Diagramm anhand von Konfiguration |
| POST    | `/api/export`         | Exportiert Diagramm in angegebenem Format     |
| GET     | `/api/plugins/reload` | Lädt alle verfügbaren Chart-Module neu        |

---

## 9. **Docker-Konfiguration**

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3003

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: "3.9"
services:
  Custom-Chart-Composer:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
```

---

## 10. **Geplante Grunddiagramme**

| Typ                | Beschreibung                     |
| ------------------ | -------------------------------- |
| **Balkendiagramm** | Klassische Wertevergleiche       |
| **Liniendiagramm** | Zeitreihen oder Trends           |
| **Kreisdiagramm**  | Verhältnisse und Anteile         |
| **Donutdiagramm**  | Alternative zum Kreisdiagramm    |
| **Radar-Chart**    | Vergleich mehrerer Eigenschaften |

---

## 11. **Erweiterbarkeit (Modul-System)**

Neue Diagrammtypen werden einfach als Datei im `modules/`-Ordner hinzugefügt.
Frontend liest `configSchema` automatisch aus und generiert dynamisch passende Eingabefelder.

Optionale Unterstützung später:

* 3D-Diagramme
* Heatmaps
* Kombinierte Diagramme
* Live-Daten-Anbindung
