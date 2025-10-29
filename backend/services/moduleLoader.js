import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let chartModules = [];
let lastResolvedModulesPath = '';
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

const resolveModulesDirectory = () => {
  const candidates = [];

  // 1) Highest priority: explicit env
  if (process.env.BACKEND_MODULES_PATH) {
    candidates.push(process.env.BACKEND_MODULES_PATH);
  }

  const localModules = join(__dirname, '../modules');

  // 2) Production resources path candidates (prefer extraResources first)
  if (process.resourcesPath) {
    // Prefer locations that inherit backend/package.json (type: module)
    candidates.push(join(process.resourcesPath, 'app.asar.unpacked', 'app', 'backend', 'modules'));
    candidates.push(join(process.resourcesPath, 'app', 'backend', 'modules'));
    candidates.push(join(process.resourcesPath, 'backend', 'modules'));
    // extraResources location (no package.json context) as fallback
    candidates.push(join(process.resourcesPath, 'modules'));
    candidates.push(join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'modules'));
  }

  // 3) Repo local fallback (dev)
  candidates.push(localModules);

  // Prefer a directory that actually contains at least one .js file
  for (const candidate of candidates) {
    for (const variant of createCandidateVariants(candidate)) {
      if (!variant || !fs.existsSync(variant)) continue;
      try {
        const entries = fs.readdirSync(variant).filter(name => name.endsWith('.js'));
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

  return localModules;
};

const ensureModulesDirectory = modulesPath => {
  if (fs.existsSync(modulesPath)) {
    return modulesPath;
  }

  if (modulesPath.includes('.asar')) {
    console.warn('Modules path is inside an ASAR archive and cannot be created:', modulesPath);
    return modulesPath;
  }

  try {
    fs.mkdirSync(modulesPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.warn('Unable to create modules directory:', modulesPath, error.message);
    }
  }

  return modulesPath;
};

const annotationOptionSchema = {
  type: 'annotations',
  default: [],
  description: 'Annotationen wie Linien, Boxen oder Labels, die im Diagramm angezeigt werden.'
};

function ensureAnnotationSchema(moduleDefinition) {
  if (!moduleDefinition || moduleDefinition.library !== 'chartjs') {
    return;
  }

  moduleDefinition.configSchema = moduleDefinition.configSchema || {};
  moduleDefinition.configSchema.options = moduleDefinition.configSchema.options || {};

  if (!moduleDefinition.configSchema.options.annotations) {
    moduleDefinition.configSchema.options.annotations = { ...annotationOptionSchema };
  }
}

export const loadChartModules = async () => {
  chartModules = [];
  const resolvedPath = resolveModulesDirectory();
  const modulesPath = ensureModulesDirectory(resolvedPath);
  lastResolvedModulesPath = modulesPath;
  lastLoadErrors = [];

  try {
    console.log('[moduleLoader] Using modules directory:', modulesPath);
  } catch (_) {}

  const files = fs.readdirSync(modulesPath).filter(file => file.endsWith('.js'));

  try {
    console.log(`[moduleLoader] Found ${files.length} module file(s)`);
  } catch (_) {}

  for (const file of files) {
    try {
      const modulePath = join(modulesPath, file);
      const module = await import(`${pathToFileURL(modulePath).href}?update=${Date.now()}`);
      ensureAnnotationSchema(module.default);
      chartModules.push(module.default);
      console.log(`✓ Loaded module: ${module.default.name}`);
    } catch (error) {
      const message = String(error && error.message ? error.message : error);
      lastLoadErrors.push({ file, message });
      try { console.error(`✗ Failed to load module ${file}:`, message); } catch (_) {}
    }
  }

  console.log(`📦 Total modules loaded: ${chartModules.length}`);
  return chartModules;
};

export const getModules = () => chartModules;

export const getModuleById = (id) => {
  return chartModules.find(module => module.id === id);
};

export const reloadModules = () => {
  return loadChartModules();
};

export const getResolvedModulesPath = () => lastResolvedModulesPath;
export const getLoadReport = () => ({ path: lastResolvedModulesPath, errors: lastLoadErrors });

