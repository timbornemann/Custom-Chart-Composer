import { createCanvas } from 'canvas';
import { getModuleById } from './moduleLoader.js';

export const renderChartImage = async (chartType, config) => {
  const module = getModuleById(chartType);
  
  if (!module) {
    throw new Error(`Chart type '${chartType}' not found`);
  }

  const width = config.width || 800;
  const height = config.height || 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Set background
  if (config.backgroundColor && config.backgroundColor !== 'transparent') {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Render using module's render function
  await module.render(ctx, config, canvas);

  return {
    chartType,
    width,
    height,
    config
  };
};

