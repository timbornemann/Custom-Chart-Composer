# Contributing to Custom Chart Composer

Vielen Dank für Ihr Interesse, zu Custom Chart Composer beizutragen! Dieses Dokument enthält Richtlinien und Best Practices für Beiträge.

## Inhaltsverzeichnis

1. [Code of Conduct](#code-of-conduct)
2. [Wie kann ich beitragen?](#wie-kann-ich-beitragen)
3. [Development Setup](#development-setup)
4. [Pull Request Prozess](#pull-request-prozess)
5. [Coding Standards](#coding-standards)
6. [Neue Chart-Module hinzufügen](#neue-chart-module-hinzufügen)

## Code of Conduct

- Seien Sie respektvoll und konstruktiv
- Begrüßen Sie unterschiedliche Perspektiven
- Akzeptieren Sie konstruktive Kritik
- Fokussieren Sie sich auf das Beste für die Community

## Wie kann ich beitragen?

### Bugs melden

Wenn Sie einen Bug finden:

1. Prüfen Sie, ob der Bug bereits gemeldet wurde
2. Erstellen Sie ein neues Issue mit:
   - Klare Beschreibung des Problems
   - Schritte zur Reproduktion
   - Erwartetes vs. tatsächliches Verhalten
   - Screenshots (falls hilfreich)
   - System-Informationen (OS, Browser, Node-Version)

### Features vorschlagen

1. Erstellen Sie ein Issue mit dem Label "enhancement"
2. Beschreiben Sie detailliert:
   - Was Sie erreichen möchten
   - Warum es nützlich wäre
   - Mögliche Implementierungs-Ansätze

### Code beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch
3. Implementieren Sie Ihre Änderungen
4. Erstellen Sie einen Pull Request

## Development Setup

### Voraussetzungen

- Node.js 20+
- npm 9+
- Git

### Repository einrichten

```bash
# Fork klonen
git clone https://github.com/YOUR-USERNAME/Custom-Chart-Composer.git
cd Custom-Chart-Composer

# Upstream hinzufügen
git remote add upstream https://github.com/ORIGINAL-OWNER/Custom-Chart-Composer.git

# Dependencies installieren
cd backend && npm install
cd ../frontend && npm install
```

### Development-Server starten

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

## Pull Request Prozess

### 1. Branch erstellen

```bash
git checkout -b feature/your-feature-name
# oder
git checkout -b fix/bug-description
```

Branch-Naming Convention:
- `feature/` - Neue Features
- `fix/` - Bug-Fixes
- `docs/` - Dokumentations-Änderungen
- `refactor/` - Code-Refactoring
- `test/` - Test-Änderungen

### 2. Änderungen committen

```bash
git add .
git commit -m "feat: Add new chart type"
```

Commit-Message Format:
- `feat:` - Neues Feature
- `fix:` - Bug-Fix
- `docs:` - Dokumentation
- `style:` - Code-Styling (keine funktionale Änderung)
- `refactor:` - Code-Refactoring
- `test:` - Tests hinzufügen/ändern
- `chore:` - Wartungsaufgaben

### 3. Upstream-Änderungen holen

```bash
git fetch upstream
git rebase upstream/main
```

### 4. Push & Pull Request erstellen

```bash
git push origin feature/your-feature-name
```

Dann auf GitHub:
1. Gehen Sie zu Ihrem Fork
2. Klicken Sie "Compare & pull request"
3. Füllen Sie die PR-Vorlage aus
4. Warten Sie auf Review

### PR-Checkliste

- [ ] Code folgt den Coding Standards
- [ ] Alle Tests laufen durch
- [ ] Neue Features haben Tests
- [ ] Dokumentation wurde aktualisiert
- [ ] Commit-Messages sind aussagekräftig
- [ ] Branch ist aktuell mit main

## Coding Standards

### JavaScript/React

**Style Guide:**
- Verwenden Sie ESLint
- 2 Spaces für Indentation
- Semicolons verwenden
- Single Quotes für Strings (außer JSX)
- Trailing Commas

**Beispiel:**

```javascript
// ✅ Gut
const chartTypes = ['bar', 'line', 'pie'];

function createChart(type, config) {
  if (!type || !config) {
    throw new Error('Type and config required');
  }
  return { type, config };
}

// ❌ Schlecht
var chartTypes = ["bar","line","pie"]

function createChart(type,config){
  if(!type||!config)throw new Error("Type and config required")
  return {type,config}
}
```

### React-Komponenten

```jsx
// ✅ Gut - Functional Component mit Hooks
import { useState, useEffect } from 'react';

export default function ChartPreview({ chartType, config }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Effect logic
  }, [chartType, config]);

  return (
    <div className="chart-preview">
      {/* JSX */}
    </div>
  );
}

// Props validieren (optional, aber empfohlen)
ChartPreview.propTypes = {
  chartType: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired
};
```

### CSS/Tailwind

- Verwenden Sie Tailwind-Klassen wo möglich
- Folgen Sie dem Design-System (siehe `Guideline.md`)
- Mobile-First Ansatz
- Responsive Design

```jsx
// ✅ Gut
<div className="w-full px-4 py-2 bg-dark-bg text-dark-textLight rounded-lg 
                hover:bg-gray-800 transition-all">
  Content
</div>

// ❌ Vermeiden - Inline Styles
<div style={{ width: '100%', padding: '8px 16px' }}>
  Content
</div>
```

## Neue Chart-Module hinzufügen

### 1. Modul-Datei erstellen

Erstellen Sie eine neue Datei in `backend/modules/`:

```javascript
// backend/modules/yourChart.js
import Chart from 'chart.js/auto';

export default {
  id: "your-chart-id",
  name: "Ihr Chart-Name",
  library: "chartjs",
  
  configSchema: {
    labels: { 
      type: "array", 
      default: ["A", "B", "C"] 
    },
    values: { 
      type: "array", 
      default: [10, 20, 30] 
    },
    colors: { 
      type: "array", 
      default: ["#4ADE80", "#22D3EE", "#F472B6"] 
    },
    backgroundColor: {
      type: "string",
      default: "#0F172A"
    },
    width: {
      type: "number",
      default: 800
    },
    height: {
      type: "number",
      default: 600
    },
    options: {
      showLegend: { 
        type: "boolean", 
        default: true 
      }
      // Weitere Chart-spezifische Optionen
    }
  },
  
  render: async (ctx, config, canvas) => {
    // Ihre Chart.js Rendering-Logik
    const chartConfig = {
      type: 'your-type',
      data: {
        labels: config.labels,
        datasets: [{
          data: config.values,
          backgroundColor: config.colors
        }]
      },
      options: {
        // Chart-Optionen
      }
    };
    
    new Chart(ctx, chartConfig);
  }
};
```

### 2. Frontend-Unterstützung (optional)

Wenn Ihr Chart-Typ spezielle UI-Elemente benötigt:

1. Icon hinzufügen in `frontend/src/components/Layout/Sidebar.jsx`
2. Spezielle Konfigurationen in `ChartConfigPanel.jsx` ergänzen
3. Preview-Logik in `ChartPreview.jsx` anpassen

### 3. Testen

```bash
# Backend neu starten
cd backend
npm run dev

# Module sollten automatisch geladen werden
curl http://localhost:3003/api/charts
```

### 4. Dokumentation

Aktualisieren Sie:
- `README.md` - Fügen Sie den neuen Chart-Typ zur Liste hinzu
- `Guideline.md` - Wenn es strukturelle Änderungen gibt
- Erstellen Sie ein Beispiel-Bild des neuen Chart-Typs

## Testing

### Backend-Tests

```bash
cd backend
npm test
```

### Frontend-Tests

```bash
cd frontend
npm test
```

### Manuelle Tests

1. Alle Chart-Typen durchgehen
2. Export in allen Formaten testen
3. Verschiedene Konfigurationen ausprobieren
4. Responsive Design testen

## Dokumentation

Wenn Sie Code hinzufügen, dokumentieren Sie:

- **Funktionen**: JSDoc-Kommentare
- **Komponenten**: Props und Verwendungs-Beispiele
- **API-Endpunkte**: Request/Response-Beispiele
- **Komplexe Logik**: Inline-Kommentare

```javascript
/**
 * Erstellt ein Chart-Objekt mit der gegebenen Konfiguration
 * @param {string} type - Der Chart-Typ (bar, line, etc.)
 * @param {Object} config - Die Chart-Konfiguration
 * @param {Array<string>} config.labels - Die Achsen-Beschriftungen
 * @param {Array<number>} config.values - Die Datenpunkte
 * @returns {Promise<Chart>} Das erstellte Chart-Objekt
 */
async function createChart(type, config) {
  // Implementation
}
```

## Review-Prozess

1. Maintainer werden Ihren PR prüfen
2. Feedback wird als Kommentare gegeben
3. Nehmen Sie angeforderte Änderungen vor
4. Nach Approval wird der PR gemerged

## Fragen?

- Erstellen Sie ein Issue mit dem Label "question"
- Schauen Sie in bestehende Issues/PRs
- Lesen Sie die Dokumentation

Vielen Dank für Ihren Beitrag! 🎉

