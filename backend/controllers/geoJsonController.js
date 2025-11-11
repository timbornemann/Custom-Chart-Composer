import { getGeoJsonFiles, getGeoJsonFile, getResolvedGeoJsonPath, getLoadReport } from '../services/geoJsonLoader.js';

export const getGeoJsonList = (req, res) => {
  try {
    const files = getGeoJsonFiles();
    const fileList = files.map(file => ({
      filename: file.filename,
      label: file.label
    }));
    res.json({ success: true, data: fileList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getGeoJsonData = (req, res) => {
  try {
    let { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ success: false, error: 'Filename parameter is required' });
    }
    
    // Decode filename in case it was URL-encoded (e.g., spaces, special characters)
    filename = decodeURIComponent(filename);
    
    const data = getGeoJsonFile(filename);
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const geoJsonStatus = (req, res) => {
  try {
    const files = getGeoJsonFiles();
    const report = getLoadReport();
    res.json({
      success: true,
      count: files.length,
      resolvedPath: getResolvedGeoJsonPath(),
      filenames: files.map(f => f.filename),
      loadErrors: report.errors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

