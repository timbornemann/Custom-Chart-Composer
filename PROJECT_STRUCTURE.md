# Projekt-Struktur

Vollständige Übersicht über die Custom Chart Composer Projektstruktur.

## 📂 Root-Verzeichnis

```
Custom-Chart-Composer/
├── backend/                     # Backend (Node.js + Express)
├── frontend/                    # Frontend (React + Vite)
├── .dockerignore               # Docker Ignore-Datei
├── .gitignore                  # Git Ignore-Datei
├── CHANGELOG.md                # Versions-Historie
├── CONTRIBUTING.md             # Beitrags-Richtlinien
├── docker-compose.yml          # Docker Compose Konfiguration
├── Dockerfile                  # Docker Build-Anweisungen
├── Guideline.md                # Technische Spezifikation
├── INSTALLATION.md             # Detaillierte Installation
├── LICENSE                     # MIT-Lizenz
├── PROJECT_STRUCTURE.md        # Diese Datei
├── QUICKSTART.md               # Schnellstart-Guide
├── README.md                   # Haupt-Dokumentation
├── start-dev.bat               # Windows Start-Skript
└── start-dev.sh                # Unix Start-Skript
```

## 🔧 Backend-Struktur

```
backend/
├── controllers/
│   └── chartController.js      # API-Controller für Chart-Operationen
│       ├── getChartTypes()     # Liste aller Chart-Typen
│       ├── renderChart()       # Chart rendern
│       ├── exportChart()       # Chart exportieren
│       └── reloadPlugins()     # Module neu laden
│
├── routes/
│   └── chartRoutes.js          # API-Routen Definition
│       ├── GET  /api/charts
│       ├── POST /api/render
│       ├── POST /api/export
│       └── GET  /api/plugins/reload
│
├── services/
│   ├── chartRenderer.js        # Chart-Rendering Service
│   ├── exportService.js        # Export-Funktionalität
│   └── moduleLoader.js         # Plugin-Loader
│       ├── loadChartModules()  # Module laden
│       ├── getModules()        # Module abrufen
│       ├── getModuleById()     # Modul per ID
│       └── reloadModules()     # Module neu laden
│
├── modules/                    # Chart-Plugins
│   ├── barChart.js            # Balkendiagramm
│   ├── lineChart.js           # Liniendiagramm
│   ├── pieChart.js            # Kreisdiagramm
│   ├── donutChart.js          # Donutdiagramm
│   └── radarChart.js          # Radar-Chart
│
├── .env.example               # Beispiel-Umgebungsvariablen
├── package.json               # Backend-Dependencies
└── server.js                  # Express Server Entry Point
```

### Backend-Dependencies

```json
{
  "express": "REST-API Framework",
  "cors": "Cross-Origin Resource Sharing",
  "chart.js": "Chart-Library",
  "canvas": "Server-side Canvas für Chart-Rendering",
  "body-parser": "Request Body Parser",
  "nodemon": "Dev-Server mit Hot-Reload"
}
```

## 🎨 Frontend-Struktur

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx          # Haupt-Header
│   │   │   └── Sidebar.jsx         # Chart-Typ Auswahl
│   │   │
│   │   ├── ChartPreview.jsx        # Live Chart-Vorschau
│   │   │   ├── Chart.js Integration
│   │   │   ├── Dynamic Rendering
│   │   │   └── Real-time Updates
│   │   │
│   │   ├── ChartConfigPanel.jsx    # Konfigurations-Panel
│   │   │   ├── DataTab             # Daten-Eingabe
│   │   │   ├── StylingTab          # Farben & Styling
│   │   │   └── OptionsTab          # Chart-Optionen
│   │   │
│   │   └── ExportPanel.jsx         # Export-Funktionalität
│   │       ├── Format-Auswahl
│   │       ├── Transparenz-Option
│   │       └── Download-Handler
│   │
│   ├── hooks/
│   │   ├── useChartConfig.js       # Chart-Konfigurations-Hook
│   │   │   ├── updateConfig()
│   │   │   ├── resetConfig()
│   │   │   └── setConfig()
│   │   │
│   │   └── useExport.js            # Export-Hook
│   │       ├── handleExport()
│   │       └── downloadFile()
│   │
│   ├── services/
│   │   └── api.js                  # API-Service (Axios)
│   │       ├── getChartTypes()
│   │       ├── renderChart()
│   │       └── exportChart()
│   │
│   ├── App.jsx                     # Haupt-App-Komponente
│   ├── main.jsx                    # React Entry Point
│   └── index.css                   # Global Styles + Tailwind
│
├── index.html                      # HTML Template
├── .env.example                    # Beispiel-Umgebungsvariablen
├── package.json                    # Frontend-Dependencies
├── postcss.config.js               # PostCSS Konfiguration
├── tailwind.config.js              # Tailwind-Konfiguration
└── vite.config.js                  # Vite Build-Konfiguration
```

### Frontend-Dependencies

```json
{
  "react": "UI-Framework",
  "react-dom": "React DOM Renderer",
  "axios": "HTTP-Client",
  "chart.js": "Chart-Library",
  "react-chartjs-2": "React-Wrapper für Chart.js",
  "vite": "Build-Tool",
  "tailwindcss": "CSS-Framework"
}
```

## 🐳 Docker-Setup

### Dockerfile (Multi-Stage Build)

```
Stage 1: Frontend Build
  └── Node Alpine Base
      ├── npm install
      ├── Copy source
      └── Build production bundle

Stage 2: Backend Build
  └── Node Alpine Base
      ├── Install system dependencies (Cairo, Pango)
      ├── npm install
      └── Copy source

Stage 3: Production
  └── Node Alpine Base
      ├── Copy backend from Stage 2
      ├── Copy frontend build from Stage 1
      └── Expose Port 3003
```

### docker-compose.yml

```yaml
Services:
  custom-chart-composer:
    - Build from Dockerfile
    - Port: 3003:3003
    - Volume: Chart modules
    - Health check
    - Auto-restart
```

## 🔌 API-Struktur

### Endpunkte

| Methode | Pfad | Controller | Beschreibung |
|---------|------|-----------|--------------|
| GET | `/api/charts` | getChartTypes | Chart-Typen Liste |
| POST | `/api/render` | renderChart | Chart rendern |
| POST | `/api/export` | exportChart | Chart exportieren |
| GET | `/api/plugins/reload` | reloadPlugins | Module neu laden |
| GET | `/health` | - | Health Check |

### Request/Response Flow

```
Client Request
    ↓
Express Router (routes/)
    ↓
Controller (controllers/)
    ↓
Service Layer (services/)
    ↓
Chart Module (modules/)
    ↓
Response to Client
```

## 📊 Chart-Module System

### Modul-Struktur

Jedes Chart-Modul folgt diesem Schema:

```javascript
export default {
  id: string,              // Eindeutige ID
  name: string,            // Anzeige-Name
  library: string,         // Chart-Library (chartjs)
  configSchema: {          // Konfigurations-Schema
    labels: {...},
    values: {...},
    colors: {...},
    backgroundColor: {...},
    width: {...},
    height: {...},
    options: {...}
  },
  render: async (ctx, config, canvas) => {...}
}
```

### Verfügbare Module

1. **barChart.js** - Balkendiagramme
2. **lineChart.js** - Liniendiagramme
3. **pieChart.js** - Kreisdiagramme
4. **donutChart.js** - Donutdiagramme
5. **radarChart.js** - Radar-Charts

## 🎨 Design-System

### Farb-Tokens (Tailwind)

```javascript
colors: {
  dark: {
    bg: '#0F172A',           // Haupt-Hintergrund
    secondary: '#1E293B',    // Sekundär-Flächen
    accent1: '#3B82F6',      // Primär-Akzent
    accent2: '#22D3EE',      // Sekundär-Akzent
    textLight: '#F8FAFC',    // Heller Text
    textGray: '#CBD5E1',     // Grauer Text
  }
}
```

### Komponenten-Stile

- **Karten**: `rounded-2xl shadow-lg bg-dark-secondary`
- **Buttons**: `rounded-xl hover:shadow-xl transition-all`
- **Inputs**: `rounded-lg border border-gray-700 focus:border-dark-accent1`

## 📝 Konfigurationsdateien

### Backend

- **package.json**: Dependencies und Scripts
- **.env.example**: Umgebungsvariablen-Vorlage
- **server.js**: Express-Konfiguration

### Frontend

- **package.json**: Dependencies und Scripts
- **vite.config.js**: Vite + Proxy-Konfiguration
- **tailwind.config.js**: Design-System
- **postcss.config.js**: CSS-Verarbeitung
- **.env.example**: API-URL

### Docker

- **Dockerfile**: Multi-Stage Build
- **docker-compose.yml**: Service-Definition
- **.dockerignore**: Build-Ausschlüsse

## 🚀 Start-Skripte

### start-dev.bat (Windows)

```batch
1. Backend starten (neues CMD-Fenster)
2. Frontend starten (neues CMD-Fenster)
3. URLs anzeigen
```

### start-dev.sh (Unix)

```bash
1. Backend starten (Hintergrund)
2. Frontend starten (Hintergrund)
3. Warten auf Ctrl+C
4. Graceful Shutdown
```

## 📚 Dokumentation

| Datei | Zweck |
|-------|-------|
| README.md | Haupt-Dokumentation, Feature-Übersicht |
| QUICKSTART.md | Schnellstart in 5 Minuten |
| INSTALLATION.md | Detaillierte Installations-Anleitung |
| CONTRIBUTING.md | Wie man zum Projekt beiträgt |
| Guideline.md | Original technische Spezifikation |
| CHANGELOG.md | Versions-Historie |
| PROJECT_STRUCTURE.md | Diese Datei - Struktur-Übersicht |

## 🔄 Datenfluss

### Chart Erstellung

```
1. User wählt Chart-Typ
   ↓
2. Frontend lädt configSchema
   ↓
3. User konfiguriert Chart
   ↓
4. Frontend rendert Live-Vorschau
   ↓
5. User klickt Export
   ↓
6. POST /api/export
   ↓
7. Backend rendert Chart
   ↓
8. Konvertierung in Format
   ↓
9. Download-Link zurück
   ↓
10. Browser startet Download
```

### Module Laden

```
Server Start
   ↓
loadChartModules()
   ↓
Lese modules/ Verzeichnis
   ↓
Import jedes .js Moduls
   ↓
Validiere Modul-Schema
   ↓
Registriere in chartModules Array
   ↓
Module verfügbar über API
```

## 🔧 Erweiterungspunkte

### Neue Chart-Typen

1. Erstelle `backend/modules/newChart.js`
2. Folge dem Modul-Schema
3. Server neu starten
4. Automatisch verfügbar

### Neue Export-Formate

1. Erweitere `backend/services/exportService.js`
2. Füge Format-Handler hinzu
3. Update `frontend/src/components/ExportPanel.jsx`

### Custom Themes

1. Erweitere `frontend/tailwind.config.js`
2. Füge neue Farb-Tokens hinzu
3. Update Komponenten

## 💾 Datei-Größen (ca.)

```
Backend Code:        ~50 KB
Backend node_modules: ~150 MB
Frontend Code:       ~80 KB
Frontend node_modules: ~300 MB
Docker Image:        ~600 MB
Production Build:    ~2 MB
```

## 🎯 Key Features Zuordnung

| Feature | Implementierung |
|---------|----------------|
| Modulares System | `moduleLoader.js` + `modules/` |
| Live-Vorschau | `ChartPreview.jsx` + react-chartjs-2 |
| Export PNG/JPEG | `exportService.js` + canvas |
| Export SVG | Fallback zu PNG (TODO) |
| Export HTML | Template mit Base64 Image |
| Dark Theme | Tailwind Custom Colors |
| Responsive | Tailwind Responsive Classes |
| API | Express Routes + Controllers |
| Plugin System | Dynamic Import in moduleLoader |

---

**Stand**: Version 1.0.0  
**Letzte Aktualisierung**: 2024-10-22

