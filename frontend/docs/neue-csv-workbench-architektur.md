# Neue CSV Workbench Architektur

## Übersicht

Die neue CSV Workbench verwendet eine **3-Panel-Layout**-Struktur:

```
┌─────────────────────────────────────────────────────────────┐
│ TOOLBAR (File, Quick Actions, Apply)                       │
├──────────┬────────────────────────────────┬─────────────────┤
│          │                                │                 │
│  LEFT    │       CENTER (TABLE)           │     RIGHT       │
│ PANEL    │                                │    PANEL        │
│          │   [MAIN FOCUS AREA]            │                 │
│ Mapping  │                                │  Search Tools   │
│Transform │                                │  Duplicates     │
│ Profil   │                                │  Validation     │
│          │                                │                 │
├──────────┴────────────────────────────────┴─────────────────┤
│ STATUS BAR (Zeilen, Spalten, etc.)                         │
└─────────────────────────────────────────────────────────────┘
```

## Komponenten-Struktur

### Haupt-Komponente
```
CsvWorkbench.jsx (NEU - ~800 Zeilen)
├─ CsvWorkbenchToolbar.jsx (~200 Zeilen)
├─ CsvWorkbenchTable.jsx (~600 Zeilen) ← KERN
├─ CsvWorkbenchMappingPanel.jsx (~400 Zeilen)
├─ CsvWorkbenchTransformPanel.jsx (~500 Zeilen)
└─ CsvWorkbenchToolsPanel.jsx (~400 Zeilen)
```

### Custom Hooks (bereits erstellt)
- useCsvWorkbenchPersist.js
- useCsvWorkbenchColumns.js
- useCsvWorkbenchSearch.js
- useCsvWorkbenchDuplicates.js
- useCsvWorkbenchValidation.js
- useCsvWorkbenchSelection.js
- useCsvWorkbenchFormulas.js
- useCsvWorkbenchCorrelation.js
- useCsvWorkbenchSavedViews.js
- useCsvWorkbenchAggregation.js

## Implementierungs-Strategie

Aufgrund des Umfangs werde ich die alte CsvWorkbench.jsx **beibehalten** und die neue Implementierung **schrittweise** aufbauen:

1. ✅ **Phase 1**: Neue Komponente mit Basis-UI (minimale Funktionalität)
2. 🔄 **Phase 2**: Tabellen-Rendering vollständig implementieren
3. ⏳ **Phase 3**: Alle Panels implementieren
4. ⏳ **Phase 4**: Alte Komponente ersetzen

Dies ermöglicht Rollback bei Problemen und kontinuierliches Testen.

