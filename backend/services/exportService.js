import { createCanvas } from 'canvas';
import { getModuleById } from './moduleLoader.js';

export const exportChartToFormat = async (chartType, config, format = 'png', transparent = false) => {
  const module = getModuleById(chartType);
  
  if (!module) {
    throw new Error(`Chart type '${chartType}' not found`);
  }

  const width = config.width || 800;
  const height = config.height || 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Set background
  if (!transparent && config.backgroundColor && config.backgroundColor !== 'transparent') {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Render chart
  await module.render(ctx, config, canvas);

  let dataUrl;
  switch (format.toLowerCase()) {
    case 'png':
      dataUrl = canvas.toDataURL('image/png');
      break;
    case 'jpeg':
    case 'jpg':
      dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      break;
    case 'svg':
      // SVG export would require a different approach
      // For now, fall back to PNG
      dataUrl = canvas.toDataURL('image/png');
      break;
    case 'html':
      // Return HTML with embedded chart
      const base64 = canvas.toDataURL('image/png');
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Chart Export</title>
  <style>
    body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f4f6; }
    img { max-width: 100%; height: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <img src="${base64}" alt="Chart" />
</body>
</html>`;
      return { format: 'html', data: html };
    default:
      dataUrl = canvas.toDataURL('image/png');
  }

  return {
    format,
    data: dataUrl
  };
};

