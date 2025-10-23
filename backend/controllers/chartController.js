import { getModules, reloadModules } from '../services/moduleLoader.js';
import { renderChartImage } from '../services/chartRenderer.js';
import { exportChartToFormat } from '../services/exportService.js';

export const getChartTypes = (req, res) => {
  try {
    const modules = getModules();
    const chartTypes = modules.map(module => ({
      id: module.id,
      name: module.name,
      category: module.category || null,
      icon: module.icon || null,
      description: module.description || '',
      library: module.library,
      configSchema: module.configSchema
    }));
    res.json({ success: true, data: chartTypes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const renderChart = async (req, res) => {
  try {
    const { chartType, config } = req.body;
    
    if (!chartType || !config) {
      return res.status(400).json({ 
        success: false, 
        error: 'chartType and config are required' 
      });
    }

    const result = await renderChartImage(chartType, config);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportChart = async (req, res) => {
  try {
    const { chartType, config, format = 'png', transparent = false } = req.body;
    
    if (!chartType || !config) {
      return res.status(400).json({ 
        success: false, 
        error: 'chartType and config are required' 
      });
    }

    const result = await exportChartToFormat(chartType, config, format, transparent);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reloadPlugins = (req, res) => {
  try {
    reloadModules();
    const modules = getModules();
    res.json({ 
      success: true, 
      message: `${modules.length} chart modules loaded`,
      modules: modules.map(m => ({ id: m.id, name: m.name }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

