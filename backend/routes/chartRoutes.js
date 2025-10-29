import express from 'express';
import {
  getChartTypes,
  renderChart,
  exportChart,
  reloadPlugins,
  pluginsStatus
} from '../controllers/chartController.js';

const router = express.Router();

router.get('/charts', getChartTypes);
router.post('/render', renderChart);
router.post('/export', exportChart);
router.get('/plugins/reload', reloadPlugins);
router.get('/plugins/status', pluginsStatus);

export default router;

