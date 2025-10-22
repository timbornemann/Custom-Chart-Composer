import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import chartRoutes from './routes/chartRoutes.js';
import { loadChartModules } from './services/moduleLoader.js';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Load chart modules on startup
loadChartModules();

// Routes
app.use('/api', chartRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Custom Chart Composer API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Chart modules loaded`);
});

