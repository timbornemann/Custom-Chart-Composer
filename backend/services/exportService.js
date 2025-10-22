import { getModuleById } from './moduleLoader.js';

export const exportChartToFormat = async (chartType, config, format = 'png', transparent = false) => {
  const module = getModuleById(chartType);
  
  if (!module) {
    throw new Error(`Chart type '${chartType}' not found`);
  }

  // Return configuration for client-side export
  // The actual rendering and export will happen in the browser
  return {
    chartType,
    config,
    format,
    transparent,
    message: 'Export will be handled client-side'
  };
};

