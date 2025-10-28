import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let chartModules = [];

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
  const modulesPath = join(__dirname, '../modules');
  
  // Create modules directory if it doesn't exist
  if (!fs.existsSync(modulesPath)) {
    fs.mkdirSync(modulesPath, { recursive: true });
  }

  const files = fs.readdirSync(modulesPath).filter(file => file.endsWith('.js'));

  for (const file of files) {
    try {
      const modulePath = join(modulesPath, file);
      const module = await import(`file://${modulePath}?update=${Date.now()}`);
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

