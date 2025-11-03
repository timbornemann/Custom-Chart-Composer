# CSV-Workbench ? Funktions?bersicht

## Datenimport
- Unterst?tzt CSV-, TSV- und Excel-Dateien (`.xls`, `.xlsx`, `.ods`).
- Parser basiert auf PapaParse mit automatischer Typ-Erkennung, individueller Vorschaugrenze und Fehler/Warnmeldungen.
- Fortschritts- und Fehlermeldungen beim Einlesen sowie Validierungsfeedback (z.?B. fehlende Spalten, Formatanomalien).

## Datenansicht & Navigation
- Zwei synchronisierte Tabellenansichten: Rohdaten und transformierte Daten (inkl. Filter/Gruppierung).
- Spaltenreihenfolge per Drag & Drop, Spaltenbreite anpassbar, Links/Rechts-Pinning, Spalten ein-/ausblenden.
- Zeilen pinnen/ausblenden, Hervorhebung aktiver Zellen, Auswahlbereiche mit Maus/Keyboard.
- Individuelle Zeilenh?hen- und Spaltenbreitenmessung zur Layout-Stabilit?t.

## Suche & Ersetzen
- Textsuche wahlweise normal, Ganzwort oder Regex; Spaltenfilterung f?r die Suche; Hervorhebung aller Treffer.
- Navigation durch Treffer (inkl. F3-Unterst?tzung), Scrolling und Fokus-Steuerung auf Trefferzellen.
- Dialog f?r Suchen/Ersetzen mit separatem Roh-/Transformationskontext sowie Sicherheitspr?fungen (z.?B. deaktiviert, wenn Aggregation Zeilenanzahl ver?ndert).

## Manuelle Bearbeitung & Formeln
- Direkte Zellbearbeitung einschlie?lich Undo-Stack f?r manuelle ?nderungen.
- Formel-Editor mit Syntaxvorschl?gen (`AVAILABLE_FORMULAS`), Bereichseinf?gen, Cursorsteuerung und Hilfedarstellung.
- Fehleranzeige pro Formelzelle; Validierung auf nicht initialisierte Bereiche reduziert Laufzeitfehler.

## Spaltenzuordnung & Diagramm-Mapping
- Flexible Zuordnung f?r Label-, Werte- und Datensatzspalten, Spezialmodus f?r Scatter/Bubble sowie Koordinatendiagramme.
- Vorschlagssystem f?r Chartkonfigurationen inkl. aggregierter Vorschau-Datasets und Hervorhebung korrespondierender Zeilen.
- Mapping-Zustand wird an `onApplyToChart` ?bergeben, inklusive Transformationsergebnis und Metadaten.

## Duplikaterkennung & -bereinigung
- Frei w?hlbare Schl?sselspalten, Darstellung gefundener Gruppen inkl. Prim?r- und Duplikatzeilen.
- Aktionen: ?lteste behalten, Werte zusammenf?hren, Feedback ?ber Umfang der ?nderungen.
- Sichtbare Hervorhebung duplizierter Zeilen direkt in der Tabelle.

## Transformationen & Datenaufbereitung
- **Value-Rules:** Bedingungen (Text, Regex, Zahl) und Aktionen (ersetzen, regexReplace, numerische Operationen etc.).
- **Filter:** Umfangreiche Operatoren f?r Text, Zahlen, Datum/Zeit, Regex, leer/nicht leer.
- **Pivot:** Schl?ssel-, Wertespalte, Indexspalten, Pr?fix, Fill-Value; Metadaten zu erzeugten Spalten und Konflikten.
- **Unpivot:** ID- und Wertespalten, benennbare Ergebnisfelder, Option zum Entfernen leerer Werte.
- **Gruppierung & Aggregation:** Reihenfolge der Gruppenspalten, Standard- und spaltenspezifische Aggregationen, Kriterien f?r `countValid`.
- Transformationsergebnis inklusive Warnungen (gefiltert/aggregiert) und Z?hlstatistiken.

## Statistik & Profiling
- Spaltenprofiling (wertebezogene Kennzahlen), Korrelationstabellen mit Schwellenwertfilterung und Sortierung.
- Anzeige von Prozent- und Zahlenformaten mit lokalisierter Formatierung (`de-DE`).

## Export & Integration
- ?bergabe des aktuellen Workbench-Zustands ?ber `onApplyToChart` und `getImportResult`.
- Unterst?tzung f?r Limitierung der Vorschauzeilen und Export von transformierten Datens?tzen.
- Hooks (`useExport`, `useDataImport`) stellen Downstream-Services Daten bereit.

## Fehler- & Statusmeldungen
- Gesammelte Parserwarnungen, Validierungsfehler, Transformationshinweise und Duplikat-Feedback.
- UI-Badges markieren kritische Bereiche (z.?B. Formel- oder Deduplizierungsfehler) um Laufzeitprobleme fr?hzeitig sichtbar zu machen.

