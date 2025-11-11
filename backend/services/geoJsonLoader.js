import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let geoJsonFiles = [];
let lastResolvedGeoJsonPath = '';
let lastLoadErrors = [];

const createCandidateVariants = basePath => {
  if (!basePath) {
    return [];
  }

  const variants = new Set([basePath]);

  if (basePath.includes('.asar') && !basePath.includes('.asar.unpacked')) {
    variants.add(basePath.replace('.asar', '.asar.unpacked'));
  }

  return Array.from(variants);
};

const resolveGeoJsonDirectory = () => {
  const candidates = [];

  // 1) Highest priority: explicit env
  if (process.env.BACKEND_GEOJSON_PATH) {
    candidates.push(process.env.BACKEND_GEOJSON_PATH);
  }

  // 2) Try frontend source directory (for development)
  const frontendGeoJsonPath = join(__dirname, '../../frontend/src/utils/GeoJSONs');
  candidates.push(frontendGeoJsonPath);

  // 3) Production resources path candidates
  if (process.resourcesPath) {
    candidates.push(join(process.resourcesPath, 'app.asar.unpacked', 'app', 'frontend', 'src', 'utils', 'GeoJSONs'));
    candidates.push(join(process.resourcesPath, 'app', 'frontend', 'src', 'utils', 'GeoJSONs'));
    candidates.push(join(process.resourcesPath, 'frontend', 'src', 'utils', 'GeoJSONs'));
    candidates.push(join(process.resourcesPath, 'geojsons'));
    candidates.push(join(process.resourcesPath, 'app.asar.unpacked', 'geojsons'));
  }

  // 4) Backend local geojsons directory (fallback)
  const localGeoJsons = join(__dirname, '../geojsons');
  candidates.push(localGeoJsons);

  // Find first existing directory with .geojson files
  for (const candidate of candidates) {
    for (const variant of createCandidateVariants(candidate)) {
      if (!variant || !fs.existsSync(variant)) continue;
      try {
        const entries = fs.readdirSync(variant).filter(name => 
          name.endsWith('.geojson') || name.endsWith('.geojson.geojson') || name.endsWith('.geojason.geojson')
        );
        if (entries.length > 0) {
          return variant;
        }
      } catch (_) {
        // ignore and continue
      }
    }
  }

  // As a final fallback, return the first existing candidate even if empty
  for (const candidate of candidates) {
    for (const variant of createCandidateVariants(candidate)) {
      if (variant && fs.existsSync(variant)) {
        return variant;
      }
    }
  }

  return localGeoJsons;
};

const ensureGeoJsonDirectory = geoJsonPath => {
  if (fs.existsSync(geoJsonPath)) {
    return geoJsonPath;
  }

  if (geoJsonPath.includes('.asar')) {
    console.warn('GeoJSON path is inside an ASAR archive and cannot be created:', geoJsonPath);
    return geoJsonPath;
  }

  try {
    fs.mkdirSync(geoJsonPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.warn('Unable to create GeoJSON directory:', geoJsonPath, error.message);
    }
  }

  return geoJsonPath;
};

const createLabelFromFilename = (filename) => {
  let label = filename
    .replace(/\.geojson$/g, '')
    .replace(/\.geojason$/g, '')
    .replace(/\.geojson\.geojson$/g, '')
    .replace(/\.geojason\.geojson$/g, '');
  
  // Handle special cases
  if (label === 'europe') return 'Europa';
  if (label === 'germany-states') return 'Deutschland (Bundesländer)';
  if (label === 'World') return 'Welt';
  
  return label;
};

export const loadGeoJsonFiles = async () => {
  geoJsonFiles = [];
  const resolvedPath = resolveGeoJsonDirectory();
  const geoJsonPath = ensureGeoJsonDirectory(resolvedPath);
  lastResolvedGeoJsonPath = geoJsonPath;
  lastLoadErrors = [];

  try {
    console.log('[geoJsonLoader] Using GeoJSON directory:', geoJsonPath);
  } catch (_) {}

  const files = fs.readdirSync(geoJsonPath).filter(file => 
    file.endsWith('.geojson') || file.endsWith('.geojson.geojson') || file.endsWith('.geojason.geojson')
  );

  try {
    console.log(`[geoJsonLoader] Found ${files.length} GeoJSON file(s)`);
  } catch (_) {}

  for (const file of files) {
    try {
      const filePath = join(geoJsonPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      
      const label = createLabelFromFilename(file);
      
      geoJsonFiles.push({
        filename: file,
        label,
        path: filePath
      });
      
      console.log(`✓ Loaded GeoJSON: ${label} (${file})`);
    } catch (error) {
      const message = String(error && error.message ? error.message : error);
      lastLoadErrors.push({ file, message });
      try {
        console.error(`✗ Failed to load GeoJSON ${file}:`, message);
      } catch (_) {}
    }
  }

  // Sort by label for better UX
  geoJsonFiles.sort((a, b) => a.label.localeCompare(b.label, 'de'));

  console.log(`📦 Total GeoJSON files loaded: ${geoJsonFiles.length}`);
  return geoJsonFiles;
};

export const getGeoJsonFiles = () => geoJsonFiles;

export const getGeoJsonFile = (filename) => {
  const file = geoJsonFiles.find(f => f.filename === filename);
  if (!file) {
    throw new Error(`GeoJSON file not found: ${filename}`);
  }
  
  try {
    const fileContent = fs.readFileSync(file.path, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Failed to read GeoJSON file ${filename}: ${error.message}`);
  }
};

export const getResolvedGeoJsonPath = () => lastResolvedGeoJsonPath;
export const getLoadReport = () => ({ path: lastResolvedGeoJsonPath, errors: lastLoadErrors });

