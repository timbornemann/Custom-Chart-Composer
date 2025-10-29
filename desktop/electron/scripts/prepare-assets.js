import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../../');
const electronDir = path.resolve(__dirname, '../');
const outputDir = path.join(electronDir, 'app');
const backendSrc = path.join(projectRoot, 'backend');
const frontendSrc = path.join(projectRoot, 'frontend', 'dist');

const ensureFrontendBuildExists = () => {
  if (!fs.existsSync(frontendSrc)) {
    throw new Error('Frontend build output not found. Please run the frontend build before packaging.');
  }
};

const cleanOutputDir = () => {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
};

const shouldCopyBackendEntry = sourcePath => {
  const relative = path.relative(backendSrc, sourcePath);

  if (!relative || relative === '') {
    return true;
  }

  const parts = relative.split(path.sep);
  if (parts[0] === 'node_modules') {
    return false;
  }

  const basename = path.basename(sourcePath);
  if (basename === 'package-lock.json' || basename === 'pnpm-lock.yaml') {
    return false;
  }

  return true;
};

const copyBackend = () => {
  const backendDest = path.join(outputDir, 'backend');
  fs.cpSync(backendSrc, backendDest, {
    recursive: true,
    filter: shouldCopyBackendEntry
  });
  try {
    const modulesDir = path.join(backendDest, 'modules');
    const files = fs.existsSync(modulesDir)
      ? fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'))
      : [];
    console.log(`[prepare-assets] Copied backend. modules/*.js = ${files.length}`);
  } catch (_) {}
};

const copyFrontend = () => {
  const frontendDest = path.join(outputDir, 'frontend', 'dist');
  fs.mkdirSync(path.dirname(frontendDest), { recursive: true });
  fs.cpSync(frontendSrc, frontendDest, { recursive: true });
};

const main = () => {
  ensureFrontendBuildExists();
  cleanOutputDir();
  copyBackend();
  copyFrontend();
};

main();
