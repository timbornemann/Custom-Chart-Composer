import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { pathToFileURL } from 'url';
import chartRoutes from './routes/chartRoutes.js';
import { loadChartModules } from './services/moduleLoader.js';
import { loadGeoJsonFiles } from './services/geoJsonLoader.js';
import path from 'path';
import { fileURLToPath } from 'url';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  // Routes
  app.use('/api', chartRoutes);

  // Serve frontend build if available (Docker/production)
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const frontendDist = path.resolve(__dirname, '../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  } catch (_) {}

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Custom Chart Composer API is running' });
  });

  return app;
};

export const startServer = async ({
  port = process.env.PORT || 3003,
  host = process.env.HOST || '0.0.0.0',
  log = true
} = {}) => {
  const app = createApp();
  await loadChartModules();
  await loadGeoJsonFiles();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      const address = server.address();
      const resolvedPort = typeof address === 'object' && address ? address.port : port;

      if (log) {
        console.log(`🚀 Server running on port ${resolvedPort}`);
        console.log('📊 Chart modules loaded');
        console.log('🗺️  GeoJSON files loaded');
      }

      resolve({ app, server, port: resolvedPort });
    });

    server.on('error', error => {
      if (log) {
        console.error('✗ Failed to start server', error);
      }
      reject(error);
    });
  });
};

const isExecutedDirectly = () => {
  if (!process.argv[1]) {
    return false;
  }

  try {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch (error) {
    return false;
  }
};

if (isExecutedDirectly()) {
  startServer().catch(error => {
    console.error('✗ Unable to start server', error);
    process.exitCode = 1;
  });
}
