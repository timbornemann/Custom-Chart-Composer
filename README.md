# Custom Chart Composer

Ein modernes, webbasiertes Tool zur einfachen Erstellung ästhetisch ansprechender Diagramme. Mit einer intuitiven Benutzeroberfläche können Sie verschiedene Diagrammtypen auswählen, Daten und Farben anpassen und das fertige Ergebnis in verschiedenen Formaten exportieren.

![Custom Chart Composer - Hauptansicht](screenshots/Program/Startseite-Nach-Programm-oeffen.png)
*Die Hauptansicht der Custom Chart Composer Anwendung mit Sidebar für Diagrammtypen, Vorschau-Bereich und Konfigurationspanel. Hier sehen Sie die Übersicht aller verfügbaren Diagrammtypen, die Sie per Klick auswählen können.*

## Inhaltsverzeichnis

- [🚀 Installation](#-installation)
  - [Windows-Installer (Empfohlen)](#windows-installer-empfohlen)
  - [Docker Image](#docker-image)
- [✨ Features](#-features)
- [🎯 Verwendung](#-verwendung)
- [📊 Diagrammtypen im Detail](#-diagrammtypen-im-detail)
- [🔄 Automatische Updates](#-automatische-updates-mit-watchtower)
- [🏗️ Technologie-Stack](#️-technologie-stack)
- [🖥️ Lokale Entwicklung](#️-lokale-entwicklung)
- [📁 Projektstruktur](#-projektstruktur)
- [🔧 Eigene Chart-Module erstellen](#-eigene-chart-module-erstellen)
- [🎨 Design-System](#-design-system)
- [📝 Umgebungsvariablen](#-umgebungsvariablen)
- [🧪 Testing](#-testing)
- [📄 Lizenz](#-lizenz)

## 🚀 Installation

### Windows-Installer (Empfohlen)

Die einfachste Möglichkeit, Custom Chart Composer zu nutzen – keine Docker oder Node.js erforderlich!

**Downloads:**
- Alle Releases: [GitHub Releases](https://github.com/timbornemann/Custom-Chart-Composer/releases)
- Neueste Version: [v1.0.6](https://github.com/timbornemann/Custom-Chart-Composer/releases/tag/v1.0.6)

**Installation:**
1. Laden Sie die neueste `Custom Chart Composer Setup <version>.exe` herunter
2. Führen Sie die Setup-Datei aus
3. Die Anwendung wird installiert und steht im Startmenü zur Verfügung

**Hinweise:**
- Der Installer enthält Frontend und Backend – keine zusätzliche Runtime nötig
- Die App-Version in der Kopfzeile entspricht der Release-Version
- Keine Installation von Node.js, Docker oder anderen Abhängigkeiten erforderlich

### Docker Image

Für Server-Bereitstellung oder Container-Umgebungen.

**Image herunterladen:**
```bash
docker pull ghcr.io/timbornemann/custom-chart-composer:latest
```

**Container starten:**
```bash
docker run -d --name custom-chart-composer -p 3003:3003 ghcr.io/timbornemann/custom-chart-composer:latest
```

**Zugriff:**
- Web UI: http://localhost:3003
- API: http://localhost:3003/api

**Bestimmte Version verwenden:**
```bash
docker run -d --name custom-chart-composer -p 3003:3003 ghcr.io/timbornemann/custom-chart-composer:1.0.2
```

**Eigene Chart-Module hinzufügen:**

**Linux/Mac:**
```bash
docker run -d --name custom-chart-composer -p 3003:3003 -v $(pwd)/modules:/app/backend/modules ghcr.io/timbornemann/custom-chart-composer:latest
```

**Windows (PowerShell/CMD):**
```bash
docker run -d --name custom-chart-composer -p 3003:3003 -v %cd%\modules:/app/backend/modules ghcr.io/timbornemann/custom-chart-composer:latest
```

**Weitere Informationen:**
- [Container Packages](https://github.com/timbornemann/Custom-Chart-Composer/pkgs/container/custom-chart-composer)
- [Alle Releases](https://github.com/timbornemann/Custom-Chart-Composer/releases)

## ✨ Features

- 🎨 **25 Diagrammtypen**: Balken, Linie, Fläche, Kreis, Radar, Streudiagramm, Blasen, Polar-Fläche, Gestapelt, Multi-Line, Kombiniert, Gruppiert, Treppenstufen, Heatmap, Radiales Balkendiagramm, Candlestick, OHLC, Box-Plot, Violin-Plot, Funnel, Choropleth, Venn-Diagramm und viele mehr
- 🎯 **Modulares Plugin-System**: Neue Diagrammtypen einfach hinzufügen
- 🖌️ **Umfangreiche Anpassungen**: Farben, Beschriftungen, Optionen
- 📦 **Multiple Export-Formate**: PNG, JPEG, HTML
- 🌙 **Modernes Dark Theme**: Professionelles UI-Design
- ↩️ **Undo & Redo inklusive Shortcuts**: Änderungen bequem per Toolbar oder mit Strg+Z / Strg+Shift+Z rückgängig machen bzw. wiederholen
- 💾 **Automatische Zwischenspeicherung**: Deine Diagrammdaten werden lokal gepuffert, sodass beim Neuladen nichts verloren geht
- 📊 **CSV/Excel-Import**: Importieren Sie Daten aus CSV-, TSV- und Excel-Dateien mit automatischer Typ-Erkennung und Spaltenzuordnung
- ✏️ **Annotationen**: Fügen Sie Text, Pfeile, Formen und Markierungen zu Ihren Diagrammen hinzu
- 🐳 **Docker-Support**: Einfache Bereitstellung
- ⚡ **Live-Vorschau**: Echtzeit-Aktualisierung bei Änderungen

## 🎯 Verwendung

### 1. Diagrammtyp auswählen

![Custom Chart Composer - Hauptansicht](screenshots/Program/Startseite-Nach-Programm-oeffen.png)
*Die Hauptansicht zeigt alle verfügbaren Diagrammtypen in der linken Sidebar. Sie können durch die Liste scrollen oder die Suchfunktion verwenden, um schnell den gewünschten Diagrammtyp zu finden. Jeder Typ zeigt eine Vorschau-Ikone für schnelle Orientierung.*

Wählen Sie in der Sidebar den gewünschten Diagrammtyp. Die Anwendung bietet **25 verschiedene Diagrammtypen** in folgenden Kategorien:

**Balkendiagramme (3 Typen):**
- **Balkendiagramm**: Klassische Wertevergleiche (mit Orientierungsoption: horizontal/vertikal)
- **Gestapeltes Balkendiagramm**: Mehrere Datensätze übereinander (mit Orientierung und Prozentanzeige)
- **Gruppiertes Balkendiagramm**: Mehrere Datensätze nebeneinander

**Liniendiagramme (6 Typen):**
- **Liniendiagramm**: Trends und Zeitreihen (mit Orientierungsoption: horizontal/vertikal)
- **Flächendiagramm**: Gefüllte Linie für Volumen
- **Multi-Liniendiagramm**: Mehrere Linien vergleichen
- **Treppenstufen-Liniendiagramm**: Gestufte Verläufe
- **Gestricheltes Liniendiagramm**: Gestrichelte Linien
- **Stream-Graph**: Gestapeltes Flächendiagramm mit zentrierter Basislinie

**Kreisdiagramme (4 Typen):**
- **Kreisdiagramm**: Anteile und Verhältnisse (mit Optionen für Donut, Halbkreis, Rotation, Zeiger/Tachometer)
- **Polar-Flächendiagramm**: Kreisförmige Flächendarstellung
- **Verschachteltes Donut**: Mehrere Donuts übereinander
- **Radiales Balkendiagramm**: Kreisförmige Anordnung von Balken

**Punktdiagramme (3 Typen):**
- **Streudiagramm**: Korrelationen zwischen zwei Variablen (unterstützt auch geografische Koordinaten)
- **Blasendiagramm**: 3-dimensionale Daten mit Radius (mit Optionen für feste Größe und Punktform)
- **Heatmap-Diagramm**: Matrix mit Farbintensitäten (Standard-Heatmap und Kalender-Heatmap GitHub-Style)

**Spezialdiagramme (9 Typen):**
- **Radar-Chart**: Mehrdimensionale Daten auf polaren Achsen
- **Kombiniertes Diagramm**: Verschiedene Charttypen kombiniert
- **Funnel-Diagramm**: Trichterdarstellung für Prozess-Visualisierung
- **Choropleth-Karte**: Geografische Datenvisualisierung auf Karten
- **Venn-Diagramm**: Mengendiagramm zur Darstellung von Überschneidungen
- **Candlestick-Diagramm**: Finanzdaten-Visualisierung mit Open/High/Low/Close
- **OHLC-Diagramm**: Open-High-Low-Close Darstellung für Finanzdaten
- **Box-Plot**: Statistische Verteilungsanalyse mit Quartilen
- **Violin-Plot**: Kombination aus Box-Plot und Dichteverteilung

### 2. Daten konfigurieren

![Daten-Tab](screenshots/Program/Daten-Tab.png)
*Der Daten-Tab bietet umfangreiche Möglichkeiten zur Dateneingabe: Manuelle Eingabe von Labels und Werten, CSV-Import mit Spaltenzuordnung, sowie die Möglichkeit, mehrere Datensätze zu definieren. Hier können Sie auch Titel und Beschriftungen für Ihr Diagramm festlegen.*

Im Tab **"Daten"**:
- Titel eingeben (optional)
- Beschriftungen (Labels) kommagetrennt eingeben oder per CSV importieren
- Werte kommagetrennt eingeben oder aus CSV-Dateien importieren
- CSV-Import mit Spaltenzuordnung für komplexe Datenstrukturen
- Mehrere Datensätze für Multi-Line, Gruppierte oder Gestapelte Diagramme definieren
- Datensatz-Label definieren

### 3. Styling anpassen

Im Tab **"Styling"**:
- **Farbpalette**: Benutzerdefinierte Farbzuweisung für jeden Datenpunkt
- **Hintergrundfarbe**: Vordefinierte Optionen oder eigene Farbauswahl
- **Hintergrundbild**: Upload-Funktion für PNG, JPG, GIF bis 5MB
- **Transparente Hintergründe**: Für Overlay-Darstellungen

### 4. Optionen einstellen

Im Tab **"Optionen"**:
- Legende ein/ausschalten
- Gitter anzeigen/verbergen
- Diagrammspezifische Optionen anpassen
- Exportgröße festlegen (Breite/Höhe)

### 5. Exportieren

![Export Tab](screenshots/Program/Export Tab.png)
*Der Export-Tab bietet umfangreiche Export-Optionen: Wählen Sie zwischen PNG, JPEG oder HTML-Format, stellen Sie die Auflösung ein (HD, Full HD, 4K, Quadrat oder benutzerdefiniert), aktivieren Sie transparente Hintergründe oder passen Sie die Skalierung an. Zusätzlich können Sie Ihre Diagrammkonfiguration als JSON exportieren.*

**Export-Formate:**
- **PNG**: Hochqualitative Rasterbilder
- **JPEG**: Komprimierte Bilder für Web
- **HTML**: Interaktive Diagramme für Webseiten

**Auflösungen:**
- **HD**: 1280×720 Pixel
- **Full HD**: 1920×1080 Pixel  
- **4K**: 3840×2160 Pixel
- **Quadrat**: 1080×1080 Pixel
- **Benutzerdefiniert**: Eigene Dimensionen

**Zusätzliche Optionen:**
- **Skalierung**: Prozentuale Größenanpassung
- **Transparenter Hintergrund**: Für Overlay-Darstellungen
- **JSON-Export**: Konfiguration speichern und teilen

## 📊 Diagrammtypen im Detail

Die Custom Chart Composer bietet eine beeindruckende Vielfalt von **25 Diagrammtypen** für alle Datenvisualisierungs-Anforderungen:

### Übersicht aller Diagrammtypen

| Diagrammtyp | Beschreibung | Screenshot |
|-------------|--------------|------------|
| **Balkendiagramm** | Klassische Wertevergleiche mit horizontaler/vertikaler Orientierung | <img src="screenshots/Diagrams/chart-bar-2025-11-11.png" width="150" alt="Bar Chart"> |
| **Gestapeltes Balkendiagramm** | Mehrere Datensätze übereinander mit Prozentanzeige-Option | <img src="screenshots/Diagrams/chart-stackedBar-2025-11-11.png" width="150" alt="Stacked Bar"> |
| **Gruppiertes Balkendiagramm** | Mehrere Datensätze nebeneinander für direkten Vergleich | <img src="screenshots/Diagrams/chart-groupedBar-2025-11-11.png" width="150" alt="Grouped Bar"> |
| **Radiales Balkendiagramm** | Kreisförmige Anordnung von Balken | <img src="screenshots/Diagrams/chart-radialBar-2025-11-11.png" width="150" alt="Radial Bar"> |
| **Liniendiagramm** | Trends und Zeitreihen mit horizontaler/vertikaler Orientierung | <img src="screenshots/Diagrams/chart-line-2025-11-11.png" width="150" alt="Line Chart"> |
| **Flächendiagramm** | Gefüllte Linie für Volumen-Darstellung | <img src="screenshots/Diagrams/chart-area-2025-11-11.png" width="150" alt="Area Chart"> |
| **Multi-Liniendiagramm** | Mehrere Linien zum Vergleich verschiedener Datensätze | <img src="screenshots/Diagrams/chart-multiLine-2025-11-11.png" width="150" alt="Multi-Line"> |
| **Treppenstufen-Liniendiagramm** | Gestufte Verläufe für diskrete Änderungen | <img src="screenshots/Diagrams/chart-steppedLine-2025-11-11.png" width="150" alt="Stepped Line"> |
| **Gestricheltes Liniendiagramm** | Gestrichelte Linien für alternative Darstellung | <img src="screenshots/Diagrams/chart-dashedLine-2025-11-11.png" width="150" alt="Dashed Line"> |
| **Stream-Graph** | Gestapeltes Flächendiagramm mit zentrierter Basislinie | <img src="screenshots/Diagrams/chart-streamGraph-2025-11-11.png" width="150" alt="Stream Graph"> |
| **Kreisdiagramm** | Anteile und Verhältnisse mit Donut/Halbkreis-Optionen | <img src="screenshots/Diagrams/chart-pie-2025-11-11.png" width="150" alt="Pie Chart"> |
| **Polar-Flächendiagramm** | Kreisförmige Flächendarstellung kategorialer Werte | <img src="screenshots/Diagrams/chart-polarArea-2025-11-11.png" width="150" alt="Polar Area"> |
| **Verschachteltes Donut** | Mehrere Donuts übereinander für hierarchische Daten | <img src="screenshots/Diagrams/chart-nestedDonut-2025-11-11.png" width="150" alt="Nested Donut"> |
| **Streudiagramm** | Korrelationen zwischen zwei Variablen, unterstützt geografische Koordinaten | <img src="screenshots/Diagrams/chart-scatter-2025-11-11.png" width="150" alt="Scatter"> |
| **Blasendiagramm** | 3-dimensionale Daten mit Radius, Optionen für feste Größe | <img src="screenshots/Diagrams/chart-bubble-2025-11-11.png" width="150" alt="Bubble"> |
| **Heatmap-Diagramm** | Matrix mit Farbintensitäten, Standard- und Kalender-Heatmap | <img src="screenshots/Diagrams/chart-heatmap-2025-11-11.png" width="150" alt="Heatmap"> |
| **Radar-Chart** | Mehrdimensionale Daten auf polaren Achsen | <img src="screenshots/Diagrams/chart-radar-2025-11-11.png" width="150" alt="Radar"> |
| **Kombiniertes Diagramm** | Verschiedene Charttypen kombiniert in einem Diagramm | <img src="screenshots/Diagrams/chart-mixed-2025-11-11.png" width="150" alt="Mixed"> |
| **Candlestick-Diagramm** | Finanzdaten-Visualisierung mit Open/High/Low/Close | <img src="screenshots/Diagrams/chart-candlestick-2025-11-11.png" width="150" alt="Candlestick"> |
| **OHLC-Diagramm** | Open-High-Low-Close Darstellung für Finanzdaten | <img src="screenshots/Diagrams/chart-ohlc-2025-11-11.png" width="150" alt="OHLC"> |
| **Box-Plot** | Statistische Verteilungsanalyse mit Quartilen | <img src="screenshots/Diagrams/chart-boxPlot-2025-11-11.png" width="150" alt="Box Plot"> |
| **Violin-Plot** | Kombination aus Box-Plot und Dichteverteilung | <img src="screenshots/Diagrams/chart-violinPlot-2025-11-11.png" width="150" alt="Violin Plot"> |
| **Funnel-Diagramm** | Trichterdarstellung für Prozess-Visualisierung | <img src="screenshots/Diagrams/chart-funnel-2025-11-11.png" width="150" alt="Funnel"> |
| **Choropleth-Karte** | Geografische Datenvisualisierung auf Karten | <img src="screenshots/Diagrams/chart-choropleth-2025-11-11.png" width="150" alt="Choropleth"> |
| **Venn-Diagramm** | Mengendiagramm zur Darstellung von Überschneidungen | <img src="screenshots/Diagrams/chart-venn-2025-11-11.png" width="150" alt="Venn"> |

### Beispiel-Diagramme aus der Anwendung

![Kreisdiagramm Beispiel](screenshots/Program/Kreisdiagramm.png)
*Beispiel eines Kreisdiagramms mit benutzerdefinierten Farben und Beschriftungen*

![Flächendiagramm Beispiel](screenshots/Program/Flächendiagramm.png)
*Beispiel eines Flächendiagramms mit mehreren Datensätzen*

![Candlestick-Diagramm Beispiel](screenshots/Program/Candelstickdiagramm.png)
*Beispiel eines Candlestick-Diagramms für Finanzdaten-Visualisierung*

### Annotationen

![Annotationen](screenshots/Program/Annotationen.png)
*Mit der Annotationen-Funktion können Sie Text, Pfeile, Formen und Markierungen zu Ihren Diagrammen hinzufügen, um wichtige Informationen hervorzuheben oder Erklärungen zu ergänzen.*

## 🔄 Automatische Updates mit Watchtower

Damit dein Container automatisch aktualisiert wird, kannst du Watchtower verwenden. Watchtower prüft in Intervallen auf neue Images und aktualisiert betroffene Container.

**Alle Container überwachen:**
```bash
docker run -d --name watchtower --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --interval 3600
```

**Nur diesen Container aktualisieren:**
```bash
docker run -d --name watchtower --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower custom-chart-composer --interval 3600
```

**Einmalige Prüfung (danach endet der Watchtower-Container):**
```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower custom-chart-composer --run-once
```

> Tipp: Benenne deinen Container genau `custom-chart-composer`, damit die obigen Befehle 1:1 funktionieren.

## 🏗️ Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Charts | Chart.js |
| Export | Canvas (Node) |
| Container | Docker |

## 🖥️ Lokale Entwicklung

### Option 1: Automatisch (Empfohlen)

**Windows:**
```cmd
# Doppelklick auf start-dev.bat
# oder im Terminal:
start-dev.bat
```

**Linux/Mac:**
```bash
# Ausführbar machen
chmod +x start-dev.sh

# Starten
./start-dev.sh
```

### Option 2: Manuell - Schritt für Schritt

**Schritt 1: Backend starten**
```powershell
cd backend
npm install
npm run dev
```
*Warten Sie bis "Server running on port 3003" angezeigt wird*

**Schritt 2: Frontend starten (neues Terminal)**
```powershell
cd frontend
npm install
npm run dev
```
*Warten Sie bis "Local: http://localhost:5173" angezeigt wird*

**Schritt 3: Anwendung öffnen**
- Öffnen Sie http://localhost:5173 in Ihrem Browser
- Die Anwendung ist jetzt bereit!

### Option 3: Docker Compose (Lokale Entwicklung)

```bash
# Repository klonen
git clone https://github.com/timbornemann/Custom-Chart-Composer.git
cd Custom-Chart-Composer

# Mit Docker Compose starten
docker-compose up --build

# App öffnen unter http://localhost:3003
```

**Voraussetzungen:**
- Node.js 20+ (für lokale Entwicklung)
- Docker & Docker Compose (für Container-Deployment)
- npm oder yarn

### Electron Desktop (Windows)

Die Desktop-Variante nutzt denselben Express-Server und das gebaute Vite-Frontend wie die Docker- bzw. Web-Version. Alle Änderungen an Backend, Frontend oder den Modulen wirken sich somit automatisch auch auf die Electron-App aus.

**Vorbereitung:**
```powershell
# Abhängigkeiten installieren
cd backend
npm install
cd ../frontend
npm install
cd ../desktop/electron
npm install
```

**Windows-Build erstellen:**
```powershell
cd desktop/electron
npm run build:win
```

Der fertige Installer befindet sich im Verzeichnis `desktop/electron/dist`.

**Entwicklung im Desktop-Kontext:**
```powershell
# Frontend-Dev-Server starten
cd frontend
npm run dev

# In einem zweiten Terminal das Electron-Fenster öffnen
cd ../desktop/electron
npm run dev
```

> **Hinweis:** Die Electron-App startet automatisch den Express-Server auf einem freien lokalen Port und übergibt diesen intern an das Frontend. Anpassungen am Backend (z. B. neue Module im Ordner `backend/modules`) stehen sowohl in Docker als auch in der Desktop-App direkt zur Verfügung.

## 📁 Projektstruktur

```
Custom-Chart-Composer/
├── backend/
│   ├── controllers/          # API-Controller
│   ├── routes/              # API-Routes
│   ├── services/            # Business Logic
│   ├── modules/             # Chart-Module (25 Diagrammtypen)
│   │   ├── areaChart.js
│   │   ├── barChart.js
│   │   ├── boxPlotChart.js
│   │   ├── bubbleChart.js
│   │   ├── choroplethChart.js
│   │   ├── dashedLineChart.js
│   │   ├── financialCandlestickChart.js
│   │   ├── financialOhlcChart.js
│   │   ├── funnelChart.js
│   │   ├── groupedBarChart.js
│   │   ├── heatmapChart.js
│   │   ├── lineChart.js
│   │   ├── mixedChart.js
│   │   ├── multiLineChart.js
│   │   ├── nestedDonutChart.js
│   │   ├── pieChart.js
│   │   ├── polarAreaChart.js
│   │   ├── radarChart.js
│   │   ├── radialBarChart.js
│   │   ├── scatterChart.js
│   │   ├── stackedBarChart.js
│   │   ├── steppedLineChart.js
│   │   ├── streamGraph.js
│   │   ├── vennDiagramChart.js
│   │   └── violinPlotChart.js
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React-Komponenten
│   │   │   ├── Layout/
│   │   │   ├── ChartPreview.jsx
│   │   │   ├── ChartConfigPanel.jsx
│   │   │   ├── ExportPanel.jsx
│   │   │   ├── CsvWorkbench.jsx
│   │   │   └── ...
│   │   ├── hooks/           # Custom React Hooks
│   │   ├── services/        # API-Services
│   │   ├── utils/           # Utility-Funktionen
│   │   │   ├── GeoJSONs/   # GeoJSON-Dateien für Choropleth-Karten
│   │   │   │   ├── Baden-Württemberg.geojson
│   │   │   │   ├── Bayern.geojson
│   │   │   │   ├── Berlin.geojson
│   │   │   │   ├── Brandenburg.geojson
│   │   │   │   ├── Bremen.geojson
│   │   │   │   ├── Hamburg.geojson
│   │   │   │   ├── Hessen.geojson
│   │   │   │   ├── Mecklenburg-Vorpommern.geojson
│   │   │   │   ├── Niedersachsen.geojson
│   │   │   │   ├── Nordrhein-Westfalen.geojson
│   │   │   │   ├── Rheinland-Pfalz.geojson
│   │   │   │   ├── Saarland.geojson
│   │   │   │   ├── Sachsen-Anhalt.geojson
│   │   │   │   ├── Sachsen.geojson
│   │   │   │   ├── Schleswig-Holstein.geojson
│   │   │   │   ├── Thüringen.geojson
│   │   │   │   ├── europe.geojson.geojson
│   │   │   │   ├── germany-states.geojson.geojson
│   │   │   │   └── World.geojason.geojson
│   │   │   ├── csv/         # CSV-Verarbeitungs-Utilities
│   │   │   ├── choroplethUtils.js
│   │   │   ├── geoJsonLoader.js
│   │   │   └── geoPresets.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── Dockerfile
├── screenshots/            # Screenshots der Anwendung
│   ├── Program/           # Screenshots der Programmoberfläche
│   │   ├── Startseite-Nach-Programm-oeffen.png
│   │   ├── Daten-Tab.png
│   │   ├── Export Tab.png
│   │   ├── Annotationen.png
│   │   └── *.png          # Weitere Programm-Screenshots
│   └── Diagrams/          # Screenshots aller Diagrammtypen
│       └── chart-*.png     # 25 Diagrammtypen-Screenshots
├── Guideline.md            # Technische Spezifikation
└── README.md
```

## 🔧 Eigene Chart-Module erstellen

Neue Diagrammtypen können durch Hinzufügen eines Moduls in `backend/modules/` erstellt werden:

```javascript
// backend/modules/customChart.js
import Chart from 'chart.js/auto';

export default {
  id: "custom",
  name: "Mein Custom Chart",
  library: "chartjs",
  configSchema: {
    labels: { type: "array", default: ["A", "B", "C"] },
    values: { type: "array", default: [10, 20, 30] },
    colors: { type: "array", default: ["#FF0000", "#00FF00", "#0000FF"] },
    backgroundColor: { type: "string", default: "#0F172A" },
    width: { type: "number", default: 800 },
    height: { type: "number", default: 600 },
    options: {
      showLegend: { type: "boolean", default: true }
    }
  },
  render: async (ctx, config, canvas) => {
    // Chart.js Rendering-Logik
    const chartConfig = {
      type: 'bar', // oder 'line', 'pie', etc.
      data: { /* ... */ },
      options: { /* ... */ }
    };
    new Chart(ctx, chartConfig);
  }
};
```

Nach dem Hinzufügen wird das Modul automatisch geladen und in der UI verfügbar sein.

### API-Dokumentation

| Methode | Route | Beschreibung |
|---------|-------|--------------|
| GET | `/api/charts` | Liste aller verfügbaren Diagrammtypen |
| POST | `/api/render` | Rendert ein Diagramm |
| POST | `/api/export` | Exportiert Diagramm in gewähltem Format |
| GET | `/api/plugins/reload` | Lädt Chart-Module neu |
| GET | `/health` | Health-Check |

**Beispiel: Export Request**
```javascript
POST /api/export
Content-Type: application/json

{
  "chartType": "bar",
  "config": {
    "labels": ["Jan", "Feb", "Mär"],
    "values": [10, 20, 30],
    "colors": ["#4ADE80", "#22D3EE", "#F472B6"],
    "backgroundColor": "#0F172A",
    "width": 800,
    "height": 600
  },
  "format": "png",
  "transparent": false
}
```

## 🎨 Design-System

### Farbpalette

| Element | Farbe | Hex |
|---------|-------|-----|
| Hintergrund | Dunkel | #0F172A |
| Sekundärfläche | Dunkelgrau | #1E293B |
| Akzentfarbe 1 | Blau | #3B82F6 |
| Akzentfarbe 2 | Cyan | #22D3EE |
| Text Hell | Weiß | #F8FAFC |
| Text Grau | Hellgrau | #CBD5E1 |

### Typografie

- **Schriftart**: Inter (Google Fonts)
- **Überschriften**: 600 Gewicht, 1.5-2rem
- **Fließtext**: 400 Gewicht, 0.875-1rem

## 📝 Umgebungsvariablen

### Backend (.env)

```env
PORT=3003
NODE_ENV=development
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3003/api
```

## 📥 Beispieldaten (CSV)

Für schnelle Tests ist eine Beispieldatei im Projekt-Root verfügbar:

- Datei: `sample_data.csv`
- Inhalt: Kategorische Spalten (`category`, `subcategory`, `group`), Zeitspalte (`date`), numerische Spalten (`value`, `value2`, `size`) sowie Labels und Notizen. Enthält bewusste Ausreißer, fehlende Werte, negative und Null-Werte, um Import- und Chart-Funktionen (z. B. Box-Plot, Balken, Linie, Scatter, Bubble) realistisch zu prüfen.

Verwendung in der App:
- Über den CSV-Import im Tab „Daten“ die Datei `sample_data.csv` auswählen.
- Je nach Diagrammtyp passende Spalten zuordnen (z. B. `value` als Wert, `category` als Label, `group` für Gruppierungen, `date` für Zeitachsen, `size` für Bubble-Größen).

## 🧪 Testing

```bash
# Backend Tests (wenn implementiert)
cd backend
npm test

# Frontend Tests (wenn implementiert)
cd frontend
npm test
```

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.
