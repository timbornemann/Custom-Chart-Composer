# CSV Workbench Refactoring Plan

## Problem

Die `CsvWorkbench.jsx` Datei ist mit **6918 Zeilen** viel zu groß und unübersichtlich. Dies führt zu:
- Variablen-Reihenfolge-Fehlern ("Cannot access before initialization")
- Schwierige Wartbarkeit
- Lange Ladezeiten im Editor
- Fehleranfällige Änderungen

## Erstellte Custom Hooks

### 1. ✅ `useCsvWorkbenchPersist.js`
**Zweck:** Persistence-Logik und Wrapper-Callbacks
**Exports:**
- `schedulePersist` - Speichert State-Änderungen
- `reorderColumns`, `setColumnWidth`, `setColumnVisibility`, etc.
- `parseFile`, `updateMapping`, `updateTransformations`

### 2. ✅ `useCsvWorkbenchColumns.js`
**Zweck:** Column-Management
**Exports:**
- `columns`, `orderedColumns`, `hiddenColumns`
- `columnIndexMap`, `columnByKey`
- `columnMeasurements`, `rowMeasurements`
- `headerRef`, `transformedHeaderRef`
- `getColumnWidth`, `handleColumnResizeStart`
- `pinnedLeftOffsets`, `pinnedRightOffsets`

### 3. ✅ `useCsvWorkbenchSearch.js`
**Zweck:** Search und Find & Replace
**Exports:**
- `activeSearchConfig`, `searchMatches`
- `activeSearchMatch`, `hasSearchMatches`
- `handleSearchMatchNavigate`
- `isFindReplaceOpen`, `findReplaceData`
- `handleOpenFindReplace`, `computeMatchesForRows`

### 4. ✅ `useCsvWorkbenchDuplicates.js`
**Zweck:** Duplicate Detection
**Exports:**
- `duplicateGroups`, `duplicateRowCount`
- `hasDuplicateSelection`, `hasDuplicates`
- `handleDuplicateColumnToggle`, `handleResolveDuplicatesAction`

### 5. ✅ `useCsvWorkbenchValidation.js`
**Zweck:** Validation Rules
**Exports:**
- `validationRules`, `validationComputed`
- `handleAddValidationRule`, `handleUpdateValidationRule`

### 6. ✅ `useCsvWorkbenchSelection.js`
**Zweck:** Cell Selection
**Exports:**
- `selectionState`, `activeCell`, `hasSelection`
- `selectedTargets`, `selectedCellSet`
- `activeCellLabel`, `selectionReference`
- `moveSelection`, `handleCellMouseDown`

### 7. ✅ `useCsvWorkbenchFormulas.js`
**Zweck:** Formula-Handling
**Exports:**
- `formulaInputValue`, `formulaSuggestions`
- `currentFormulaHelp`, `activeFormulaError`
- `handleFormulaInputChange`, `applyFormulaInput`

### 8. ✅ `useCsvWorkbenchCorrelation.js`
**Zweck:** Correlation Matrix
**Exports:**
- `correlationMatrix`, `correlationDisplayIndices`
- `correlationColorForValue`
- `handleCorrelationColumnToggle`

### 9. ✅ `useCsvWorkbenchSavedViews.js`
**Zweck:** Saved Views
**Exports:**
- `savedViews`, `activeSavedViewId`
- `handleSaveCurrentView`, `handleApplySavedView`

### 10. ✅ `useCsvWorkbenchAggregation.js`
**Zweck:** Quick Aggregation
**Exports:**
- `quickAggregationConfig`, `quickAggregationResult`
- `runQuickAggregation`, `handleQuickAggregationExport`

## Nächste Schritte für vollständiges Refactoring

### Phase 1: Hook-Integration (AKTUELL)
- [x] Alle Custom Hooks erstellen
- [ ] CsvWorkbench.jsx refaktorieren um Hooks zu verwenden
- [ ] Alle Imports und Dependencies auflösen

### Phase 2: Weitere Aufteilung
- [ ] Rendering-Logik in separate Komponenten:
  - `CsvWorkbenchTable.jsx` - Tabellen-Rendering
  - `CsvWorkbenchMappingSection.jsx` - Mapping-UI
  - `CsvWorkbenchTransformationSection.jsx` - Transformation-UI
  
### Phase 3: Testing
- [ ] Alle Funktionen testen
- [ ] Performance-Optimierung
- [ ] Dokumentation

## Vorteile des refaktorierten Codes

1. **Klare Separation of Concerns** - Jeder Hook hat eine spezifische Aufgabe
2. **Bessere Testbarkeit** - Hooks können einzeln getestet werden
3. **Vermeidung von Reihenfolge-Fehlern** - Dependencies sind explizit
4. **Einfachere Wartung** - Änderungen betreffen nur relevante Hooks
5. **Wiederverwendbarkeit** - Hooks können in anderen Komponenten verwendet werden

## Wichtige Hinweise

- Die Hooks sind **nicht vollständig unabhängig** - einige haben Dependencies zu anderen
- Die korrekte Reihenfolge der Hook-Aufrufe ist wichtig
- Alle Hooks müssen die gleichen Props/States teilen

## Variablen-Reihenfolge in CsvWorkbench (wichtig!)

```javascript
// 1. useDataImport Hook (liefert alle internen States)
const { fileName, columns: rawColumns, ... } = useDataImport(...)

// 2. Local States
const [activeTab, setActiveTab] = useState('mapping')

// 3. Persistence Hook (braucht getImportState, etc.)
const persistHook = useCsvWorkbenchPersist({ ... })

// 4. Columns Hook (braucht rawColumns, persistHook.setColumnWidth, etc.)
const columnsHook = useCsvWorkbenchColumns({ rawColumns, ... })

// 5. Search Hook (braucht columns, previewEntries)
const searchHook = useCsvWorkbenchSearch({ columns: columnsHook.columns, ... })

// 6. Weitere Hooks in korrekter Abhängigkeits-Reihenfolge
```

## Migration-Strategie

Die Migration sollte **schrittweise** erfolgen:
1. Einen Hook nach dem anderen integrieren
2. Nach jedem Hook testen
3. Bei Fehlern: Hook anpassen, nicht zurückrollen

Dies verhindert große Breaking Changes und ermöglicht kontinuierliches Testen.

