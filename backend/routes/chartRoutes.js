import express from 'express';
import {
  getChartTypes,
  renderChart,
  exportChart,
  reloadPlugins,
  pluginsStatus
} from '../controllers/chartController.js';
import {
  getGeoJsonList,
  getGeoJsonData,
  geoJsonStatus
} from '../controllers/geoJsonController.js';

const router = express.Router();

router.get('/charts', getChartTypes);
router.post('/render', renderChart);
router.post('/export', exportChart);
router.get('/plugins/reload', reloadPlugins);
router.get('/plugins/status', pluginsStatus);

// GeoJSON routes
router.get('/geojsons', getGeoJsonList);
router.get('/geojsons/:filename', getGeoJsonData);
router.get('/geojsons/status', geoJsonStatus);

export default router;

