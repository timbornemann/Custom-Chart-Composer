import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let chartModules = [];

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

