import { createPlaceholderFeature } from './choroplethUtils'

const rectangle = (id, name, bounds) => {
  const [lonStart, latStart, lonEnd, latEnd] = bounds
  return {
    type: 'Feature',
    id,
    properties: { id, name },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lonStart, latStart],
        [lonEnd, latStart],
        [lonEnd, latEnd],
        [lonStart, latEnd],
        [lonStart, latStart]
      ]]
    }
  }
}

const EUROPE_REGIONS = [
  rectangle('DEU', 'Deutschland', [5.9, 55, 15.5, 47]),
  rectangle('FRA', 'Frankreich', [-5.5, 51.2, 8.2, 42]),
  rectangle('ITA', 'Italien', [6.5, 47.2, 18.8, 36.4]),
  rectangle('ESP', 'Spanien', [-9.5, 44, 3.3, 36]),
  rectangle('POL', 'Polen', [14, 55, 24.5, 49]),
  rectangle('NLD', 'Niederlande', [3.4, 53.7, 7.5, 50.7]),
  rectangle('BEL', 'Belgien', [2.5, 51.7, 6.5, 49.2])
]

const GERMANY_STATES = [
  rectangle('SH', 'Schleswig-Holstein', [8.3, 55.2, 11.3, 53.4]),
  rectangle('HH', 'Hamburg', [9.6, 53.8, 10.4, 53.3]),
  rectangle('NI', 'Niedersachsen', [6, 53.7, 11.6, 51.3]),
  rectangle('HB', 'Bremen', [8.4, 53.2, 8.9, 52.9]),
  rectangle('NW', 'Nordrhein-Westfalen', [5.8, 52.5, 9.6, 50.4]),
  rectangle('HE', 'Hessen', [7.8, 51, 10.2, 49.3]),
  rectangle('RP', 'Rheinland-Pfalz', [6.1, 50, 8.6, 48.9]),
  rectangle('SL', 'Saarland', [6.3, 49.7, 7.5, 49]),
  rectangle('BW', 'Baden-Württemberg', [7.4, 49.8, 10.5, 47.4]),
  rectangle('BY', 'Bayern', [9.8, 50.6, 13.8, 47.2]),
  rectangle('SN', 'Sachsen', [11.9, 51.7, 15, 50.1]),
  rectangle('ST', 'Sachsen-Anhalt', [10.5, 53, 13.3, 51.5]),
  rectangle('BB', 'Brandenburg', [11.2, 53.6, 14.8, 51.2]),
  rectangle('BE', 'Berlin', [13, 52.7, 13.8, 52.3]),
  rectangle('MV', 'Mecklenburg-Vorpommern', [10.6, 54.7, 13.6, 53.1]),
  rectangle('TH', 'Thüringen', [9.7, 51.1, 11.7, 50.1])
]

const SIMPLE_GLOBAL = [
  createPlaceholderFeature('NA', 'Nordamerika', 0, 6),
  createPlaceholderFeature('SA', 'Südamerika', 1, 6),
  createPlaceholderFeature('EU', 'Europa', 2, 6),
  createPlaceholderFeature('AF', 'Afrika', 3, 6),
  createPlaceholderFeature('AS', 'Asien', 4, 6),
  createPlaceholderFeature('OC', 'Ozeanien', 5, 6)
]

export const GEO_PRESETS = [
  {
    id: 'europe-basic',
    label: 'Europa (vereinfachte Länder)',
    description: 'Enthält die wichtigsten Länder Westeuropas als einfache Formen.',
    regions: ['Deutschland', 'Frankreich', 'Italien', 'Spanien', 'Polen', 'Niederlande', 'Belgien'],
    features: EUROPE_REGIONS
  },
  {
    id: 'germany-states',
    label: 'Deutschland (Bundesländer)',
    description: 'Vereinfachte Rechtecke für alle 16 Bundesländer.',
    regions: GERMANY_STATES.map((feature) => feature.properties.name),
    features: GERMANY_STATES
  },
  {
    id: 'world-regions',
    label: 'Globale Regionen',
    description: 'Sechs Kontinente / Regionen als rechteckige Platzhalter.',
    regions: SIMPLE_GLOBAL.map((feature) => feature.properties.name),
    features: SIMPLE_GLOBAL
  }
]

export default GEO_PRESETS
