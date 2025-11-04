# Wie man die refaktorierten Hooks verwendet

## Übersicht

Die CsvWorkbench-Funktionalität wurde in **10 spezialisierte Custom Hooks** aufgeteilt:

## Verwendungsbeispiel (vereinfacht)

```javascript
// In CsvWorkbench.jsx

import { useCsvWorkbenchPersist } from '../hooks/useCsvWorkbenchPersist'
import { useCsvWorkbenchColumns } from '../hooks/useCsvWorkbenchColumns'
import { useCsvWorkbenchSearch } from '../hooks/useCsvWorkbenchSearch'
// ... weitere Imports

export default function CsvWorkbench(props) {
  // 1. useDataImport Hook (liefert alle base states)
  const dataImport = useDataImport({ ... })
  
  // 2. Persistence Hook (ZUERST - wird von anderen benötigt)
  const persist = useCsvWorkbenchPersist({
    onImportStateChange: props.onImportStateChange,
    getImportState: dataImport.getImportState,
    internalReorderColumns: dataImport.reorderColumns,
    // ... weitere internal callbacks
  })
  
  // 3. Columns Hook (braucht persist.setColumnWidth, etc.)
  const columns = useCsvWorkbenchColumns({
    rawColumns: dataImport.columns,
    visibleColumns: /* computed */,
    setColumnWidth: persist.setColumnWidth,
    setColumnPinned: persist.setColumnPinned,
    // ...
  })
  
  // 4. Search Hook (braucht columns.columns)
  const search = useCsvWorkbenchSearch({
    columns: columns.columns,
    previewEntries: dataImport.previewEntries,
    // ...
  })
  
  // 5. Weitere Hooks in korrekter Abhängigkeits-Reihenfolge
  const duplicates = useCsvWorkbenchDuplicates({ ... })
  const validation = useCsvWorkbenchValidation({ ... })
  const selection = useCsvWorkbenchSelection({ ... })
  // ...
  
  // 6. Render-Logik (viel kleiner jetzt!)
  return (
    <div>
      {/* UI verwendet Werte und Callbacks aus den Hooks */}
    </div>
  )
}
```

## Wichtige Reihenfolge

Die Hooks **MÜSSEN** in dieser Reihenfolge aufgerufen werden:

1. `useDataImport` (basis)
2. `useCsvWorkbenchPersist` (wird von fast allen anderen benötigt)
3. `useCsvWorkbenchColumns` (braucht persist)
4. `useCsvWorkbenchSearch` (braucht columns)
5. `useCsvWorkbenchDuplicates` (braucht persist, columns)
6. `useCsvWorkbenchValidation` (braucht persist, columns)
7. `useCsvWorkbenchSelection` (braucht columns)
8. `useCsvWorkbenchFormulas` (braucht selection)
9. `useCsvWorkbenchCorrelation` (unabhängig)
10. `useCsvWorkbenchSavedViews` (braucht persist)
11. `useCsvWorkbenchAggregation` (braucht persist)

## Nächste Schritte für vollständige Integration

### Option A: Vollständiges Refactoring (empfohlen langfristig)
1. CsvWorkbench.jsx komplett umschreiben
2. Alle Hooks integrieren
3. Umfangreiche Tests durchführen
4. **Zeitaufwand:** 4-6 Stunden

### Option B: Schrittweise Migration (empfohlen kurzfristig)
1. Einen Hook nach dem anderen integrieren
2. Nach jedem Hook testen
3. **Zeitaufwand:** Kann über mehrere Tage verteilt werden

### Option C: Aktuellen Stand beibehalten
1. Die Hooks sind erstellt, aber noch nicht integriert
2. Können bei Bedarf später verwendet werden
3. Aktuelle Komponente funktioniert (nach den Fixes)
4. **Risiko:** Zukünftige Änderungen können wieder zu Reihenfolge-Fehlern führen

## Empfehlung

**Für jetzt:** Option C - aktuellen Stand beibehalten
- Die Anwendung funktioniert jetzt
- Die Hooks sind dokumentiert und bereit
- Integration kann schrittweise erfolgen

**Langfristig:** Option B - schrittweise Migration
- Weniger riskant als vollständiges Refactoring
- Ermöglicht kontinuierliches Testen
- Kann abgebrochen werden, wenn Probleme auftreten

## Probleme mit den erstellten Hooks

Die Hooks sind **noch nicht production-ready**, weil:
1. Einige Parameter fehlen oder sind inkorrekt
2. Einige Hooks haben zirkuläre Dependencies
3. Die genaue Integration in die Hauptkomponente ist noch nicht implementiert

**Geschätzte Zeit für vollständige Integration:** 6-8 Stunden

## Alternative: Kommentierte Strukturierung

Statt vollständigem Refactoring könnten wir auch:
1. Die aktuelle Datei mit **klaren Kommentaren** strukturieren
2. Sections mit `// ===== SECTION: ... =====` markieren
3. ESLint-Regeln hinzufügen für Variablen-Reihenfolge
4. **Zeitaufwand:** 30 Minuten

Dies wäre viel schneller und weniger fehleranfällig!

