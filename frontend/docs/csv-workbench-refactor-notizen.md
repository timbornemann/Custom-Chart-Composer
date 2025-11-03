# CSV-Workbench ? Refactor-Notizen

## Ziele
- Aufteilung der monolithischen `CsvWorkbench.jsx` in klar strukturierte Module und UI-Komponenten.
- Beseitigung wiederholter Initialisierungsfehler durch konsistente Defaults und fokussierte Teilkomponenten.
- Verbesserung der Wartbarkeit, indem Hilfsfunktionen, Konstanten und Rendering-Logik getrennt werden.

## Neue Modulstruktur
- `src/components/csv/constants.js` ? zentrale Konstanten, Default-Konfigurationen und Optionslisten (Pivot/Unpivot, Filter, Value-Rules etc.).
- `src/components/csv/formatting.js` ? Formatierungs- und Hilfsfunktionen (Zahlen-/Prozentformat, Highlighting, Suche/Ersetzen, leere Werte).
- `src/components/csv/previewBuilders.js` ? Builder f?r Chart-Vorschl?ge (MultiValue, SingleValue, Long-Format, Scatter/Bubble, Koordinaten).
- `src/components/csv/utils.js` ? allgemeine Utilities (zzt. `createUniqueId`).
- `src/components/csv/SortableHeaderCell.jsx` ? eigener Header f?r Drag/Drop, Pinning und Resize.
- `src/components/csv/DuplicatesSection.jsx` ? eigenst?ndige Duplikatverwaltung inkl. Tabellen?bersicht.
- `src/components/csv/ValueRulesEditor.jsx` ? UI f?r Wert-Regeln mit bedingten Eingabefeldern.
- `src/components/csv/FilterEditor.jsx` ? UI f?r Filterverwaltung mit dynamischen Eingaben.
- Dokumentation: `frontend/docs/csv-workbench-funktionalitaeten.md` & `frontend/docs/csv-workbench-refactor-notizen.md`.

## Anpassungen an `CsvWorkbench.jsx`
- Entfernte Inline-Konstanten/-Funktionen zugunsten zentraler Imports.
- Nutzung der neuen Komponenten (`SortableHeaderCell`, `DuplicatesSection`, `ValueRulesEditor`, `FilterEditor`).
- Aufger?umte Imports, keine direkten Abh?ngigkeiten mehr zu `VALUE_RULE_*`/`FILTER_OPERATORS` im Hauptmodul.
- Beibehalt goldener Pfad f?r State- und Handler-Logik; Renderingbl?cke modularisiert.
- Sicherstellung, dass alle Subkomponenten stets Arrays/Defaults erhalten, um Zugriffe auf nicht initialisierte Werte zu vermeiden.

## Folgearbeiten / Empfehlungen
- Weitere Auslagerung (Pivot-/Unpivot-Panel, Gruppierung, Tabellenrendering) f?r zus?tzliche Entlastung der Hauptkomponente.
- Erg?nzende Unit-/Component-Tests f?r neue Module (insb. `previewBuilders`, `formatting`).
- Pr?fen, ob zus?tzliche Context-Provider sinnvoll sind, um Props zukunftssicher zu b?ndeln.

