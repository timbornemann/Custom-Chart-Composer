# Quick Start Guide

Schnelleinstieg in Custom Chart Composer - von 0 auf 100 in 5 Minuten!

## 🚀 Schnellster Start mit Docker

```bash
# 1. Repository klonen
git clone <repository-url>
cd Custom-Chart-Composer

# 2. Mit Docker starten
docker-compose up --build

# 3. Browser öffnen
# http://localhost:3003
```

Das war's! 🎉

## 💻 Lokaler Start (ohne Docker)

### Schritt 1: Dependencies installieren

```bash
# Backend
cd backend
npm install

# Frontend (neues Terminal)
cd frontend
npm install
```

### Schritt 2: Starten

#### Windows
```bash
# Im Projekt-Root
start-dev.bat
```

#### Linux/Mac
```bash
# Im Projekt-Root
chmod +x start-dev.sh
./start-dev.sh
```

### Schritt 3: Öffnen

- Frontend: http://localhost:5173
- Backend: http://localhost:3003

## 🎨 Ihr erstes Diagramm erstellen

### 1. Diagrammtyp wählen
- Klicken Sie in der Sidebar auf einen Diagrammtyp (z.B. "Balkendiagramm")

### 2. Daten eingeben
Im **Daten**-Tab:
```
Titel: Verkaufszahlen Q1 2024
Beschriftungen: Januar, Februar, März, April
Werte: 150, 200, 175, 220
```

### 3. Farben anpassen
Im **Styling**-Tab:
- Wählen Sie eine Farbpalette aus den Presets
- ODER geben Sie eigene Farben ein: `#FF6384, #36A2EB, #FFCE56, #4BC0C0`

### 4. Optionen konfigurieren
Im **Optionen**-Tab:
- Legende anzeigen: ✓
- Gitter anzeigen: ✓
- Breite: 800
- Höhe: 600

### 5. Exportieren
- Format wählen (PNG empfohlen)
- Klick auf "Diagramm exportieren"
- Fertig! 🎉

## 📊 Alle verfügbaren Chart-Typen (17 Typen!)

| Chart | Verwendung | Beispiel |
|-------|-----------|----------|
| **Balken** | Wertevergleiche | Monatliche Verkäufe |
| **Horizontal** | Horizontale Balken | Produkt-Ranking |
| **Linie** | Trends | Temperatur über Zeit |
| **Fläche** | Volumen-Trends | Umsatz-Entwicklung |
| **Kreis** | Anteile | Marktanteile |
| **Donut** | Anteile (modern) | Budget-Verteilung |
| **Radar** | Multi-Dimension | Produkt-Vergleich |
| **Streu** | Korrelationen | Preis vs. Qualität |
| **Blasen** | 3D-Daten | Größe + Position |
| **Polar-Fläche** | Kreisförmig | Verkaufsregionen |
| **Gestapelt** | Summierte Werte | Zeitreihen mehrerer Produkte |
| **Multi-Line** | Mehrere Linien | Vergleich mehrerer Trends |
| **Kombiniert** | Bar + Line | Umsatz + Wachstum |
| **Gruppiert** | Nebeneinander | Jahresvergleiche |
| **Treppenstufen** | Gestufte Werte | Preisstufen |
| **Vertikal** | Spezielle Linie | Phasendarstellung |
| **Prozent** | % Verteilung | Projekt-Status |

## 🎯 Häufige Anwendungsfälle

### Business-Präsentation
```
Chart: Balkendiagramm
Beschriftungen: Q1, Q2, Q3, Q4
Werte: 45000, 52000, 48000, 61000
Farben: Business-Palette (Blautöne)
Format: PNG (für PowerPoint)
```

### Social Media Post
```
Chart: Donutdiagramm
Beschriftungen: iOS, Android, Web, Desktop
Werte: 45, 38, 12, 5
Farben: Lebendige Palette
Hintergrund: Transparent
Format: PNG
```

### Wissenschaftlicher Report
```
Chart: Liniendiagramm
Beschriftungen: 0, 5, 10, 15, 20, 25, 30
Werte: 2.1, 4.3, 8.9, 15.2, 21.8, 28.5, 35.1
Optionen: Glatte Linie, Bereich füllen
Format: SVG (für Latex)
```

## ⚡ Pro-Tipps

### Tipp 1: Schnelle Farbauswahl
Nutzen Sie die Preset-Paletten für schnelle, professionelle Ergebnisse.

### Tipp 2: Kommagetrennte Eingaben
Alle Arrays können kommagetrennt eingegeben werden:
```
Labels: A, B, C, D
Werte: 10, 20, 30, 40
Farben: #FF0000, #00FF00, #0000FF, #FFFF00
```

### Tipp 3: Transparente Hintergründe
Für Overlays und Präsentationen:
1. Styling → Hintergrund → Transparent
2. Export → Transparenter Hintergrund ✓
3. Format: PNG

### Tipp 4: Große Exports
Für Print/hochauflösende Exports:
```
Optionen → Breite: 1920
Optionen → Höhe: 1080
```

### Tipp 5: Hex-Farben finden
Nutzen Sie Tools wie:
- https://coolors.co/
- https://colorhunt.co/
- Browser DevTools Color Picker

## 🔧 Troubleshooting

### Problem: Port bereits belegt
```bash
# docker-compose.yml bearbeiten
ports:
  - "3004:3003"  # Ändere 3003 zu 3004
```

### Problem: Module nicht gefunden
```bash
# Im Backend- bzw. Frontend-Verzeichnis
rm -rf node_modules
npm install
```

### Problem: Charts werden nicht angezeigt
1. Browser-Konsole öffnen (F12)
2. Prüfen auf Fehler
3. Backend-Status prüfen: http://localhost:3003/health

## 📚 Weiterführende Dokumentation

- **[README.md](README.md)** - Vollständige Projekt-Übersicht
- **[INSTALLATION.md](INSTALLATION.md)** - Detaillierte Installation
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Beitragen zum Projekt
- **[Guideline.md](Guideline.md)** - Technische Spezifikation

## 🎓 Video-Tutorials (Coming Soon)

- [ ] Erste Schritte
- [ ] Fortgeschrittene Konfiguration
- [ ] Eigene Chart-Module erstellen
- [ ] Best Practices

## 💡 Nächste Schritte

1. ✓ Erstes Diagramm erstellt?
2. → Probieren Sie alle Chart-Typen aus
3. → Experimentieren Sie mit Farben und Optionen
4. → Exportieren Sie in verschiedenen Formaten
5. → Erstellen Sie Ihr eigenes Chart-Modul (siehe CONTRIBUTING.md)

## 🆘 Hilfe bekommen

- **Issues**: [GitHub Issues](https://github.com/yourusername/Custom-Chart-Composer/issues)
- **Dokumentation**: Siehe Dateien in diesem Repository
- **API**: http://localhost:3003/api/charts

---

**Viel Spaß beim Erstellen schöner Diagramme!** 📊✨

