import { getModuleById } from './moduleLoader.js';

export const renderChartImage = async (chartType, config) => {
  const module = getModuleById(chartType);
  
  if (!module) {
    throw new Error(`Chart type '${chartType}' not found`);
  }

  // Return configuration for client-side rendering
  return {
    chartType,
    width: config.width || 800,
    height: config.height || 600,
    config,
    message: 'Chart will be rendered client-side'
  };
};

