import express from 'express';
import {
  getChartTypes,
  renderChart,
  exportChart,
  reloadPlugins
} from '../controllers/chartController.js';

const router = express.Router();

router.get('/charts', getChartTypes);
router.post('/render', renderChart);
router.post('/export', exportChart);
router.get('/plugins/reload', reloadPlugins);

export default router;

