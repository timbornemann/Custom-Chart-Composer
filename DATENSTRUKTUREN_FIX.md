# Fix: Vereinfachung der Datenstrukturen für neue Diagrammtypen

## Problem
Die neuen Diagrammtypen verwendeten komplexe Datenstrukturen, die nicht mit den vorhandenen Editoren kompatibel waren, weshalb sie als JSON zur Bearbeitung angeboten wurden.

## Lösung
Alle neuen Diagrammtypen wurden auf Standard-Datenstrukturen umgestellt, die mit den vorhandenen Editoren arbeiten.

## Umgestellte Diagramme

### 1. **Box-Plot** (boxPlot)
**Vorher:** Komplexe Objekte mit `{min, q1, median, q3, max, outliers}`  
**Nachher:** Standard datasets mit 5 Datensätzen:
- Minimum (unterer Balken)
- Q1 - 25% Quartil
- Median (mittlerer Balken)
- Q3 - 75% Quartil
- Maximum (oberer Balken)

**Editor:** DatasetEditor (kann Labels und alle 5 Datensätze bearbeiten)

### 2. **Violin-Chart** (violin)
**Vorher:** Komplexe Objekte mit `{values: [], min, q1, median, q3, max}`  
**Nachher:** Standard datasets mit 3 Datensätzen:
- Untere Verteilung
- Mittlere Dichte
- Obere Verteilung

**Editor:** DatasetEditor (kann Labels und Verteilungsdaten bearbeiten)

### 3. **Candlestick-Chart** (candlestick)
**Vorher:** OHLC-Objekte `{o, h, l, c}` (Open, High, Low, Close)  
**Nachher:** Standard datasets mit 4 Datensätzen:
- Low (unterster Wert)
- Open (Eröffnungskurs)
- Close (Schlusskurs)
- High (höchster Wert)

**Editor:** DatasetEditor (kann Labels und alle 4 OHLC-Werte bearbeiten)

### 4. **Sankey-Diagramm** (sankey)
**Vorher:** Komplexe `nodes` und `links` Arrays  
**Nachher:** Standard labels + values:
- Labels: Knotennamen
- Values: Flusswerte
- Colors: Farben für jeden Knoten

**Editor:** SimpleDataEditor (kann Labels, Werte und Farben bearbeiten)

### 5. **Chord-Diagramm** (chord)
**Vorher:** Matrix-Struktur mit Beziehungen  
**Nachher:** Standard labels + values:
- Labels: Entitätsnamen
- Values: Gesamtwerte pro Entität
- Colors: Farben für jeden Bogen

**Editor:** SimpleDataEditor (kann Labels, Werte und Farben bearbeiten)

### 6. **Kalender-Heatmap** (calendarHeatmap)
**Vorher:** Array von `{date, value}` Objekten  
**Nachher:** Array von `{x, y, v}` Punkten:
- x: Woche
- y: Tag
- v: Aktivitätswert

**Editor:** PointEditor (kann Punktdaten mit Werten bearbeiten)

### 7. **Radiales Balkendiagramm** (radialBar)
**Bereits einfach:** labels + values  
**Editor:** SimpleDataEditor

### 8. **Stream-Graph** (streamGraph)
**Bereits einfach:** labels + datasets  
**Editor:** DatasetEditor

## Technische Änderungen

### Backend-Module
Alle Module wurden auf folgende Standard-Strukturen umgestellt:

1. **labels + values** (für einfache Diagramme)
   - Verwendet SimpleDataEditor
   - Unterstützt: radialBar, sankey, chord

2. **labels + datasets** (für mehrere Datensätze)
   - Verwendet DatasetEditor
   - Unterstützt: boxPlot, violin, candlestick, streamGraph

3. **values als Punkte** (für Scatter-basierte Diagramme)
   - Verwendet PointEditor
   - Unterstützt: calendarHeatmap

### Frontend ChartPreview.jsx
- `prepareChartData()`: Vereinfachte Datenverarbeitung für alle neuen Typen
- `prepareChartOptions()`: Gestapelte Ansicht für boxPlot, violin, candlestick

## Ergebnis

✅ **Keine JSON-Bearbeitung mehr nötig**  
✅ **Alle Diagramme verwenden intuitive Editoren**  
✅ **Einfache Bedienung wie bei bestehenden Diagrammen**  
✅ **Labels, Werte und Farben direkt bearbeitbar**  

## Benutzererfahrung

### Vorher
```
🔴 Daten als JSON → Schwer zu bearbeiten, fehleranfällig
```

### Nachher
```
✅ BoxPlot → DatasetEditor mit 5 Datensätzen (Min, Q1, Median, Q3, Max)
✅ Violin → DatasetEditor mit 3 Verteilungsebenen
✅ Candlestick → DatasetEditor mit 4 OHLC-Werten
✅ Sankey → SimpleDataEditor mit Labels und Werten
✅ Chord → SimpleDataEditor mit Labels und Werten
✅ CalendarHeatmap → PointEditor mit x/y/v Punkten
✅ RadialBar → SimpleDataEditor mit Labels und Werten
✅ StreamGraph → DatasetEditor mit mehreren Streams
```

## Verwendung

Nach Neustart des Servers können alle neuen Diagramme mit den Standard-Editoren bearbeitet werden:

1. Diagrammtyp auswählen
2. **Daten-Tab** öffnet den passenden Editor
3. Labels und Werte direkt eingeben
4. Farben über Farbpalette auswählen
5. Vorschau aktualisiert sich automatisch

Keine JSON-Kenntnisse mehr erforderlich! 🎉

