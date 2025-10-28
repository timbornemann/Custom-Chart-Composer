# Custom Chart Composer - Screenshots

Diese Sammlung von Screenshots zeigt die verschiedenen Funktionen und Bereiche der Custom Chart Composer Anwendung.

## Screenshot-Übersicht

### 01_hauptansicht.png
**Hauptansicht der Anwendung**
- Zeigt die Startseite der Custom Chart Composer Anwendung
- Links: Sidebar mit Diagrammtypen-Kategorien (Balkendiagramme, Kreisdiagramme, Liniendiagramme, Punktdiagramme, Spezialdiagramme)
- Mitte: Vorschau-Bereich mit Platzhalter für Diagramme
- Rechts: Konfigurationsbereich mit Tabs für Daten, Styling, Annotationen, Optionen und Export
- Oben: Header mit Logo und Titel "Custom Chart Composer"
- Suchfeld zur Filterung von Diagrammtypen

### 02_chord_diagramm_auswahl.png
**Diagrammtyp-Auswahl und Vorschau**
- Zeigt die Auswahl verschiedener Diagrammtypen aus der Kategorie "Kreisdiagramme"
- Sichtbar sind: Chord-Diagramm, Donutdiagramm, Halbkreis-Diagramm, Kreisdiagramm, Polar-Flächendiagramm, Radiales Balkendiagramm, Sunburst-Diagramm, Verschachteltes Donut-Diagramm
- Im Vorschau-Bereich ist ein Chord-Diagramm mit Beispieldaten (Berlin, München, Hamburg, Köln, Frankfurt) zu sehen
- Konfigurationsbereich zeigt den "Daten"-Tab mit Beispieldaten und Möglichkeit zur Bearbeitung

### 03_styling_optionen.png
**Styling und Design-Optionen**
- Zeigt den "Styling"-Tab der Konfiguration
- **Farbpalette**: Benutzerdefinierte Farbzuweisung für jeden Datenpunkt mit Farbwählern
- **Hintergrundfarbe**: Vordefinierte Optionen (Dunkel, Grau, Schwarz, Weiß, Hellgrau, Transparent) plus benutzerdefinierte Farbauswahl
- **Hintergrundbild**: Upload-Funktion für PNG, JPG, GIF bis 5MB
- Alle Einstellungen werden in Echtzeit in der Vorschau angezeigt

### 04_export_optionen.png
**Export-Funktionen**
- Zeigt den "Export"-Tab mit umfangreichen Export-Optionen
- **JSON-Export**: Konfiguration als JSON-Datei exportieren/importieren
- **Bild-Export**: Verschiedene Formate (PNG, JPEG, HTML)
- **Auflösung**: HD (1280×720), Full HD (1920×1080), 4K (3840×2160), Quadrat (1080×1080)
- **Benutzerdefinierte Dimensionen**: Maximale Breite und Höhe in Pixeln
- **Skalierung**: Prozentuale Skalierung mit Live-Vorschau der Ergebnis-Dimensionen
- **Transparenz**: Option für transparenten Hintergrund
- **Export-Buttons**: Vorschau und Direkt-Export

### 05_suchfunktion.png
**Suchfunktion in Aktion**
- Zeigt die Suchfunktion mit dem Suchbegriff "radar"
- Gefilterte Ergebnisse zeigen nur relevante Diagrammtypen
- Sichtbar ist das "Radar-Chart" aus der Kategorie "Spezialdiagramme"
- Beschreibung: "Mehrdimensionale Daten auf polaren Achsen"
- Die Suchfunktion hilft bei der schnellen Navigation durch die vielen verfügbaren Diagrammtypen

### 06_polar_flaechen_diagramm.png
**Polar-Flächendiagramm**
- Zeigt ein Polar-Flächendiagramm mit radialer Darstellung kategorialer Werte
- Das Diagramm verwendet polare Koordinaten für eine kreisförmige Darstellung
- Beispieldaten zeigen verschiedene Kategorien in einem radialen Format
- Ideal für die Darstellung von zyklischen Daten oder kategorialen Vergleichen
- Die radiale Anordnung ermöglicht eine kompakte und übersichtliche Darstellung

### 07_kreisdiagramm.png
**Standard Kreisdiagramm**
- Zeigt ein klassisches Kreisdiagramm mit proportionalen Sektoren
- Jeder Sektor repräsentiert einen Anteil des Ganzen
- Beispieldaten werden als farbige Segmente dargestellt
- Perfekt für die Visualisierung von Anteilen und Prozenten
- Einfache und intuitive Darstellung für Teil-Ganzes-Beziehungen

### 08_streudiagramm.png
**Streudiagramm für Korrelationsanalyse**
- Zeigt ein Streudiagramm zur Analyse von Zusammenhängen zwischen zwei Variablen
- Jeder Punkt repräsentiert ein Datenpaar (X- und Y-Wert)
- Ideal für die Erkennung von Trends und Korrelationen
- Beispieldaten zeigen die Verteilung der Datenpunkte
- Wichtig für statistische Analysen und Datenexploration

### 09_radar_chart.png
**Radar-Chart für mehrdimensionale Daten**
- Zeigt ein Radar-Chart mit mehrdimensionalen Daten auf polaren Achsen
- Jede Achse repräsentiert eine andere Dimension oder Kategorie
- Die Verbindungslinien zeigen das Profil der Daten
- Ideal für den Vergleich mehrerer Entitäten über verschiedene Kriterien
- Besonders nützlich für Leistungsbewertungen und Profilvergleiche

## Technische Details

- **Frontend**: React-basierte Webanwendung mit modernem UI
- **Backend**: Node.js/Express API für Diagramm-Rendering
- **Chart-Library**: Chart.js mit erweiterten Plugins
- **Styling**: Tailwind CSS für responsives Design
- **Export**: Server-seitiges Rendering für hochqualitative Bildausgaben

## Verwendung

1. **Diagrammtyp wählen**: Aus der Sidebar oder über die Suchfunktion
2. **Daten eingeben**: Im "Daten"-Tab eigene Werte oder CSV/Excel importieren
3. **Styling anpassen**: Farben, Hintergrund und Design im "Styling"-Tab
4. **Exportieren**: Verschiedene Formate und Auflösungen im "Export"-Tab

Die Anwendung bietet über 40 verschiedene Diagrammtypen für alle möglichen Datenvisualisierungs-Anforderungen.
