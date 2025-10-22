# Changelog

Alle bedeutenden Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [1.0.0] - 2024-10-22

### Hinzugefügt

#### Backend
- Express.js Server mit REST-API
- Modulares Plugin-System für Chart-Module
- 5 Chart-Module implementiert:
  - Balkendiagramm (Bar Chart)
  - Liniendiagramm (Line Chart)
  - Kreisdiagramm (Pie Chart)
  - Donutdiagramm (Donut Chart)
  - Radar-Chart
- Chart-Rendering mit Chart.js und node-canvas
- Export-Funktionalität für PNG, JPEG, SVG, HTML
- API-Endpunkte:
  - GET `/api/charts` - Liste aller Chart-Typen
  - POST `/api/render` - Chart rendern
  - POST `/api/export` - Chart exportieren
  - GET `/api/plugins/reload` - Module neu laden
  - GET `/health` - Health Check
- Automatisches Laden von Chart-Modulen beim Start

#### Frontend
- React 18 mit Vite als Build-Tool
- TailwindCSS für modernes Styling
- Responsive Design mit Dark Theme
- Komponenten:
  - Header mit Branding
  - Sidebar mit Chart-Typ Auswahl
  - Live-Vorschau mit react-chartjs-2
  - Konfigurations-Panel mit 3 Tabs (Daten, Styling, Optionen)
  - Export-Panel mit Format-Auswahl
- Custom Hooks:
  - useChartConfig - Konfigurations-Management
  - useExport - Export-Funktionalität
- API-Service mit Axios
- Dynamische Chart-Konfiguration basierend auf Schema
- Farbpaletten-Presets
- Transparenter Hintergrund-Support

#### Docker
- Multi-Stage Dockerfile für optimierte Image-Größe
- Docker Compose Konfiguration
- Health-Check Integration
- Volume-Mapping für Chart-Module

#### Dokumentation
- Umfassendes README mit:
  - Feature-Übersicht
  - Installation & Setup
  - Verwendungs-Anleitung
  - API-Dokumentation
  - Plugin-Entwicklungs-Guide
- Technische Spezifikation in Guideline.md
- Installation Guide (INSTALLATION.md)
- Contributing Guide (CONTRIBUTING.md)
- Changelog (diese Datei)

#### Developer Experience
- Start-Skripte für Windows (start-dev.bat) und Unix (start-dev.sh)
- .env.example Dateien für Backend und Frontend
- .gitignore und .dockerignore
- Hot-Reload für Backend (nodemon) und Frontend (Vite)

### Geplant für zukünftige Versionen

#### Version 1.1.0
- [ ] Area Charts (Flächendiagramme)
- [ ] Scatter Plots (Punktwolken)
- [ ] Bubble Charts
- [ ] Test-Suite mit Jest
- [ ] Frontend-Tests mit React Testing Library

#### Version 1.2.0
- [ ] Multi-Dataset Support
- [ ] Kombinierte Chart-Typen
- [ ] Template-System für häufig verwendete Konfigurationen
- [ ] Chart-History (Undo/Redo)

#### Version 2.0.0
- [ ] Benutzer-Authentifizierung
- [ ] Cloud-Speicherung für Charts
- [ ] Kollaborations-Features
- [ ] 3D-Charts
- [ ] Animations-Support
- [ ] Live-Daten Anbindung
- [ ] CSV/Excel Import
- [ ] PDF Export

### Bekannte Probleme

- SVG-Export verwendet aktuell Canvas-Fallback (PNG)
- Canvas-Module benötigt System-Dependencies (siehe INSTALLATION.md)
- Transparente Hintergründe funktionieren nur bei PNG

---

## Versionierungs-Schema

- **Major** (X.0.0): Breaking Changes, große neue Features
- **Minor** (1.X.0): Neue Features, abwärtskompatibel
- **Patch** (1.0.X): Bug-Fixes, kleine Verbesserungen

[1.0.0]: https://github.com/yourusername/Custom-Chart-Composer/releases/tag/v1.0.0

