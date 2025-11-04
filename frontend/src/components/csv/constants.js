export const MAX_HIGHLIGHT_SEGMENTS = 100

export const DEFAULT_COLUMN_WIDTH = 160
export const MIN_COLUMN_WIDTH = 60
export const ACTION_COLUMN_WIDTH = 72
export const DEFAULT_ROW_HEIGHT = 36

export const DEFAULT_PIVOT_CONFIG = {
  enabled: false,
  indexColumns: [],
  keyColumn: '',
  valueColumn: '',
  prefix: ''
}

export const DEFAULT_UNPIVOT_CONFIG = {
  enabled: false,
  idColumns: [],
  valueColumns: [],
  variableColumn: 'Kategorie',
  valueColumnName: 'Wert',
  dropEmptyValues: true
}

export const DEFAULT_PIVOT_META = {
  enabled: false,
  createdColumns: [],
  groups: 0,
  skippedMissingKey: 0,
  skippedMissingValue: 0,
  duplicateAssignments: 0,
  indexColumns: [],
  sourceColumn: '',
  valueColumn: '',
  fillValueUsed: false,
  prefix: ''
}

export const DEFAULT_UNPIVOT_META = {
  enabled: false,
  idColumns: [],
  valueColumns: [],
  variableColumn: 'Kategorie',
  valueColumnName: 'Wert',
  dropEmptyValues: true,
  createdRows: 0,
  skippedEmpty: 0
}

export const SUGGESTION_PREVIEW_MAX_POINTS = 200
export const SUGGESTION_PREVIEW_MAX_CATEGORIES = 25
export const SUGGESTION_PREVIEW_MAX_DATASETS = 5
export const SUGGESTION_PREVIEW_COLORS = [
  '#38BDF8',
  '#34D399',
  '#F97316',
  '#A855F7',
  '#F43F5E',
  '#FACC15',
  '#22D3EE',
  '#F472B6'
]

export const FILTER_OPERATORS = [
  { value: 'equalsText', label: 'Text ist gleich' },
  { value: 'notEqualsText', label: 'Text ist ungleich' },
  { value: 'containsText', label: 'Text enthält' },
  { value: 'notContainsText', label: 'Text enthält nicht' },
  { value: 'matchesRegex', label: 'passt auf Regex' },
  { value: 'notMatchesRegex', label: 'passt nicht auf Regex' },
  { value: 'equals', label: 'Zahl ist gleich' },
  { value: 'notEquals', label: 'Zahl ist ungleich' },
  { value: 'greaterThan', label: 'größer als' },
  { value: 'greaterThanOrEqual', label: 'größer oder gleich' },
  { value: 'lessThan', label: 'kleiner als' },
  { value: 'lessThanOrEqual', label: 'kleiner oder gleich' },
  { value: 'between', label: 'liegt zwischen' },
  { value: 'dateEquals', label: 'Datum ist gleich' },
  { value: 'dateGreaterThan', label: 'Datum nach' },
  { value: 'dateGreaterThanOrEqual', label: 'Datum nach oder gleich' },
  { value: 'dateLessThan', label: 'Datum vor' },
  { value: 'dateLessThanOrEqual', label: 'Datum vor oder gleich' },
  { value: 'dateBetween', label: 'Datum zwischen' },
  { value: 'isEmpty', label: 'ist leer' },
  { value: 'isNotEmpty', label: 'ist nicht leer' },
  { value: 'isNumber', label: 'ist Zahl' },
  { value: 'isText', label: 'ist Text' },
  { value: 'isDateTime', label: 'ist Datum/Zeit' }
]

export const AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Summe (Gesamte Werte)' },
  { value: 'average', label: 'Durchschnitt' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Anzahl g?ltiger Werte' },
  { value: 'countRows', label: 'Anzahl Datenpunkte' },
  { value: 'countValid', label: 'Anzahl Werte (nach Kriterien)' },
  { value: 'median', label: 'Median' },
  { value: 'stdDev', label: 'Standardabweichung' },
  { value: 'variance', label: 'Varianz' },
  { value: 'product', label: 'Produkt' },
  { value: 'first', label: 'Erster Wert' },
  { value: 'last', label: 'Letzter Wert' }
]

export const VALUE_RULE_CONDITIONS = [
  { value: 'containsText', label: 'wenn Text enthält' },
  { value: 'notContainsText', label: 'wenn Text nicht enthält' },
  { value: 'equalsText', label: 'wenn Text gleich ist' },
  { value: 'isNumber', label: 'wenn Zahl' },
  { value: 'isEmpty', label: 'wenn leer' },
  { value: 'isNotEmpty', label: 'wenn nicht leer' },
  { value: 'matchesRegex', label: 'wenn Regex passt' }
]

export const VALUE_RULE_ACTIONS = [
  { value: 'replaceText', label: 'ersetze Text' },
  { value: 'regexReplace', label: 'Regex ersetzen' },
  { value: 'setText', label: 'setze Text' },
  { value: 'toNumber', label: 'in Zahl umwandeln' },
  { value: 'multiply', label: 'Zahl multiplizieren' },
  { value: 'divide', label: 'Zahl dividieren' },
  { value: 'removeNonDigits', label: 'Nicht-Ziffern entfernen' },
  { value: 'uppercase', label: 'in GROSS' },
  { value: 'lowercase', label: 'in klein' },
  { value: 'trim', label: 'Leerzeichen trimmen' }
]

export const WORKBENCH_STEPS = [
  { key: 'mapping', label: 'Zuordnung' },
  { key: 'duplicates', label: 'Duplikate' },
  { key: 'transformations', label: 'Transformation' }
]

