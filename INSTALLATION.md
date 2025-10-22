# Installation & Setup Guide

## Inhaltsverzeichnis

1. [System-Anforderungen](#system-anforderungen)
2. [Installation mit Docker](#installation-mit-docker)
3. [Lokale Installation](#lokale-installation)
4. [Fehlerbehebung](#fehlerbehebung)

## System-Anforderungen

### Für Docker-Installation
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2 GB freier RAM
- 1 GB freier Festplattenspeicher

### Für lokale Installation
- Node.js 20.0 oder höher
- npm 9.0 oder höher
- 4 GB freier RAM (für Development)
- 2 GB freier Festplattenspeicher

## Installation mit Docker

### Schritt 1: Repository klonen

```bash
git clone <repository-url>
cd Custom-Chart-Composer
```

### Schritt 2: Docker Container starten

```bash
docker-compose up --build
```

### Schritt 3: Anwendung öffnen

Öffnen Sie Ihren Browser und navigieren Sie zu:
```
http://localhost:3003
```

### Hintergrund-Modus

Um die Anwendung im Hintergrund laufen zu lassen:

```bash
docker-compose up -d --build
```

Logs anzeigen:
```bash
docker-compose logs -f
```

Stoppen:
```bash
docker-compose down
```

## Lokale Installation

### Schritt 1: Repository klonen

```bash
git clone <repository-url>
cd Custom-Chart-Composer
```

### Schritt 2: Backend installieren

```bash
cd backend
npm install
```

**Hinweis für Windows-Benutzer**: Die `canvas` Library erfordert zusätzliche Build-Tools:
```bash
npm install --global windows-build-tools
```

**Hinweis für Linux-Benutzer**: Installieren Sie zuerst die erforderlichen System-Pakete:
```bash
# Ubuntu/Debian
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Fedora
sudo yum install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel

# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

### Schritt 3: Frontend installieren

```bash
cd ../frontend
npm install
```

### Schritt 4: Umgebungsvariablen konfigurieren (optional)

**Backend (.env)**
```bash
cd backend
cp .env.example .env
# Bearbeiten Sie .env nach Bedarf
```

**Frontend (.env)**
```bash
cd frontend
cp .env.example .env
# Bearbeiten Sie .env nach Bedarf
```

### Schritt 5: Anwendung starten

#### Option A: Automatisches Start-Skript

**Windows:**
```bash
# Im Projekt-Root
start-dev.bat
```

**Linux/Mac:**
```bash
# Im Projekt-Root
chmod +x start-dev.sh
./start-dev.sh
```

#### Option B: Manuell

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Schritt 6: Anwendung öffnen

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3003
- **Health Check**: http://localhost:3003/health

## Production Build

### Frontend

```bash
cd frontend
npm run build
```

Die optimierten Dateien befinden sich in `frontend/dist/`.

### Backend

```bash
cd backend
npm install --production
NODE_ENV=production node server.js
```

## Fehlerbehebung

### Problem: Docker Container startet nicht

**Lösung 1**: Port 3003 ist bereits belegt
```bash
# Port-Bindung in docker-compose.yml ändern
ports:
  - "3004:3003"  # Ändert externen Port zu 3004
```

**Lösung 2**: Docker-Ressourcen erhöhen
- Docker Desktop öffnen
- Settings → Resources
- Memory auf mindestens 2 GB erhöhen

### Problem: `canvas` Module kann nicht installiert werden

**Windows:**
```bash
npm install --global windows-build-tools
npm rebuild canvas
```

**Linux:**
```bash
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev
npm rebuild canvas
```

**Mac:**
```bash
brew install pkg-config cairo pango
npm rebuild canvas
```

### Problem: Frontend kann Backend nicht erreichen

**Lösung**: Proxy-Konfiguration prüfen

In `frontend/vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3003',
      changeOrigin: true
    }
  }
}
```

Oder `.env` im Frontend anpassen:
```
VITE_API_URL=http://localhost:3003/api
```

### Problem: Module nicht gefunden

```bash
# Alle node_modules löschen und neu installieren
rm -rf backend/node_modules frontend/node_modules
cd backend && npm install
cd ../frontend && npm install
```

### Problem: Chart-Module werden nicht geladen

1. Server-Logs prüfen:
```bash
# Docker
docker-compose logs backend

# Lokal
# Check Terminal mit Backend-Prozess
```

2. Module-Verzeichnis prüfen:
```bash
ls backend/modules/
# Sollte zeigen: barChart.js, lineChart.js, pieChart.js, donutChart.js, radarChart.js
```

3. Module neu laden:
```bash
curl http://localhost:3003/api/plugins/reload
```

### Problem: Diagramm-Export funktioniert nicht

1. Backend-Logs prüfen auf Fehler
2. Browser-Konsole öffnen (F12) und nach Fehler-Meldungen suchen
3. Sicherstellen dass Backend läuft: http://localhost:3003/health

### Problem: Styling fehlt im Frontend

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npm run dev
```

## Performance-Optimierung

### Für Production-Deployment

1. **Frontend optimieren**:
```bash
cd frontend
npm run build
```

2. **Backend-Dependencies reduzieren**:
```bash
cd backend
npm install --production
```

3. **Reverse-Proxy verwenden** (z.B. Nginx):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Update / Upgrade

### Docker

```bash
git pull
docker-compose down
docker-compose up --build
```

### Lokal

```bash
git pull

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Deinstallation

### Docker

```bash
docker-compose down -v  # Entfernt auch Volumes
docker rmi custom-chart-composer_custom-chart-composer
```

### Lokal

```bash
# Projekt-Ordner löschen
rm -rf Custom-Chart-Composer
```

## Support

Bei weiteren Problemen:
- Öffnen Sie ein Issue auf GitHub
- Prüfen Sie die Logs für Fehler-Meldungen
- Konsultieren Sie die `README.md` und `Guideline.md`

