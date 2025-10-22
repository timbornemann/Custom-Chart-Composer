# Custom Chart Composer

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Ein modernes, webbasiertes Tool zur einfachen Erstellung ästhetisch ansprechender Diagramme. Mit einer intuitiven Benutzeroberfläche können Sie verschiedene Diagrammtypen auswählen, Daten und Farben anpassen und das fertige Ergebnis in verschiedenen Formaten exportieren.

## ✨ Features

- 🎨 **5 Diagrammtypen**: Balken, Linie, Kreis, Donut, Radar
- 🎯 **Modulares Plugin-System**: Neue Diagrammtypen einfach hinzufügen
- 🖌️ **Umfangreiche Anpassungen**: Farben, Beschriftungen, Optionen
- 📦 **Multiple Export-Formate**: PNG, JPEG, SVG, HTML
- 🌙 **Modernes Dark Theme**: Professionelles UI-Design
- 🐳 **Docker-Support**: Einfache Bereitstellung
- ⚡ **Live-Vorschau**: Echtzeit-Aktualisierung bei Änderungen

## 🏗️ Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Charts | Chart.js |
| Export | Canvas (Node) |
| Container | Docker |

## 📋 Voraussetzungen

- Node.js 20+ (für lokale Entwicklung)
- Docker & Docker Compose (für Container-Deployment)
- npm oder yarn

## 🚀 Schnellstart

### Option 1: Docker (Empfohlen)

```bash
# Repository klonen
git clone <repository-url>
cd Custom-Chart-Composer

# Mit Docker Compose starten
docker-compose up --build

# App öffnen unter http://localhost:3003
```

### Option 2: Lokale Entwicklung

#### Windows

```bash
# Doppelklick auf start-dev.bat
# oder im Terminal:
start-dev.bat
```

#### Linux/Mac

```bash
# Ausführbar machen
chmod +x start-dev.sh

# Starten
./start-dev.sh
```

#### Manuell

```bash
# Backend starten
cd backend
npm install
npm run dev

# In einem neuen Terminal: Frontend starten
cd frontend
npm install
npm run dev
```

**Frontend**: http://localhost:5173  
**Backend API**: http://localhost:3003

## 📁 Projektstruktur

```
Custom-Chart-Composer/
├── backend/
│   ├── controllers/          # API-Controller
│   ├── routes/              # API-Routes
│   ├── services/            # Business Logic
│   ├── modules/             # Chart-Module (Plugins)
│   │   ├── barChart.js
│   │   ├── lineChart.js
│   │   ├── pieChart.js
│   │   ├── donutChart.js
│   │   └── radarChart.js
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React-Komponenten
│   │   │   ├── Layout/
│   │   │   ├── ChartPreview.jsx
│   │   │   ├── ChartConfigPanel.jsx
│   │   │   └── ExportPanel.jsx
│   │   ├── hooks/           # Custom React Hooks
│   │   ├── services/        # API-Services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── Dockerfile
├── Guideline.md            # Technische Spezifikation
└── README.md
```

## 🎯 Verwendung

### 1. Diagrammtyp auswählen

Wählen Sie in der Sidebar den gewünschten Diagrammtyp:
- **Balkendiagramm**: Wertevergleiche
- **Liniendiagramm**: Trends und Zeitreihen
- **Kreisdiagramm**: Anteile und Verhältnisse
- **Donutdiagramm**: Alternative zum Kreisdiagramm
- **Radar-Chart**: Mehrere Eigenschaften vergleichen

### 2. Daten konfigurieren

Im Tab **"Daten"**:
- Titel eingeben (optional)
- Beschriftungen (Labels) kommagetrennt eingeben
- Werte kommagetrennt eingeben
- Datensatz-Label definieren

### 3. Styling anpassen

Im Tab **"Styling"**:
- Farbpalette auswählen oder eigene Farben definieren
- Hintergrundfarbe wählen
- Transparente Hintergründe aktivieren

### 4. Optionen einstellen

Im Tab **"Optionen"**:
- Legende ein/ausschalten
- Gitter anzeigen/verbergen
- Diagrammspezifische Optionen anpassen
- Exportgröße festlegen (Breite/Höhe)

### 5. Exportieren

- Gewünschtes Format wählen (PNG, JPEG, SVG, HTML)
- Bei Bedarf transparenten Hintergrund aktivieren
- Auf "Diagramm exportieren" klicken

## 🔌 API-Endpunkte

| Methode | Route | Beschreibung |
|---------|-------|--------------|
| GET | `/api/charts` | Liste aller verfügbaren Diagrammtypen |
| POST | `/api/render` | Rendert ein Diagramm |
| POST | `/api/export` | Exportiert Diagramm in gewähltem Format |
| GET | `/api/plugins/reload` | Lädt Chart-Module neu |
| GET | `/health` | Health-Check |

### Beispiel: Export Request

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

## 🐳 Docker-Deployment

### Development

```bash
docker-compose up
```

### Production

```bash
docker-compose up -d --build
```

### Logs anzeigen

```bash
docker-compose logs -f
```

### Container stoppen

```bash
docker-compose down
```

## 🛠️ Entwicklung

### Backend Development

```bash
cd backend
npm install
npm run dev  # mit Nodemon (Hot-Reload)
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev  # Vite Dev Server
```

### Build für Production

```bash
# Frontend
cd frontend
npm run build

# Backend (keine Build erforderlich)
cd backend
npm install --production
```

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

## 🧪 Testing

```bash
# Backend Tests (wenn implementiert)
cd backend
npm test

# Frontend Tests (wenn implementiert)
cd frontend
npm test
```

## 🤝 Mitwirken

Beiträge sind willkommen! Bitte:

1. Forken Sie das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 🙏 Danksagungen

- [Chart.js](https://www.chartjs.org/) - Für die fantastische Chart-Library
- [React](https://react.dev/) - Für das UI-Framework
- [TailwindCSS](https://tailwindcss.com/) - Für das Styling-Framework
- [Vite](https://vitejs.dev/) - Für das Build-Tool

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues öffnen
- Dokumentation in `Guideline.md` lesen

---

**Erstellt mit ❤️ für schöne Diagramme**
