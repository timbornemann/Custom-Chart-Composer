import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let chartModules = [];

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

  if (process.env.BACKEND_MODULES_PATH) {
    candidates.push(process.env.BACKEND_MODULES_PATH);
  }

  const localModules = join(__dirname, '../modules');
  candidates.push(localModules);

  if (process.resourcesPath) {
    candidates.push(join(process.resourcesPath, 'app', 'backend', 'modules'));
    candidates.push(join(process.resourcesPath, 'backend', 'modules'));
    candidates.push(join(process.resourcesPath, 'app.asar.unpacked', 'app', 'backend', 'modules'));
    candidates.push(join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'modules'));
  }

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
  const modulesPath = ensureModulesDirectory(resolveModulesDirectory());

  const files = fs.readdirSync(modulesPath).filter(file => file.endsWith('.js'));

  for (const file of files) {
    try {
      const modulePath = join(modulesPath, file);
      const module = await import(`${pathToFileURL(modulePath).href}?update=${Date.now()}`);
      ensureAnnotationSchema(module.default);
      chartModules.push(module.default);
      console.log(`✓ Loaded module: ${module.default.name}`);
    } catch (error) {
      console.error(`✗ Failed to load module ${file}:`, error.message);
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

