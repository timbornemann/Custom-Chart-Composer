import { contextBridge, ipcRenderer } from 'electron';

const state = {
  apiBaseUrl: undefined
};

const findApiBaseUrlArgument = () => {
  const args = Array.isArray(process.argv) ? [...process.argv] : [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (typeof argument !== 'string') {
      continue;
    }

    if (argument.startsWith('--apiBaseUrl=')) {
      return argument.slice('--apiBaseUrl='.length);
    }

    if (argument === '--apiBaseUrl' && typeof args[index + 1] === 'string') {
      return args[index + 1];
    }
  }

  return undefined;
};

const safeExpose = (key, value) => {
  try {
    contextBridge.exposeInMainWorld(key, value);
  } catch (error) {
    if (!/has already been exposed to the main world/i.test(String(error?.message))) {
      console.warn(`Unable to expose ${key} via contextBridge:`, error);
    }
  }
};

const applyApiBaseUrl = (rawValue) => {
  if (typeof rawValue !== 'string' || rawValue.length === 0) {
    return;
  }

  const value = rawValue.trim();

  if (!value || value === state.apiBaseUrl) {
    return;
  }

  state.apiBaseUrl = value;

  if (typeof window !== 'undefined') {
    try {
      window.__CCC_API_URL__ = value;
    } catch (error) {
      console.warn('Unable to assign __CCC_API_URL__ on window:', error);
    }

    try {
      const currentConfig = typeof window.desktopConfig === 'object' && window.desktopConfig !== null
        ? window.desktopConfig
        : {};

      window.desktopConfig = {
        ...currentConfig,
        apiBaseUrl: value
      };
    } catch (error) {
      console.warn('Unable to assign desktopConfig on window:', error);
    }
  }

  safeExpose('__CCC_API_URL__', value);
  safeExpose('desktopConfig', {
    apiBaseUrl: value
  });
};

applyApiBaseUrl(findApiBaseUrlArgument());

ipcRenderer.on('ccc:config', (_event, payload) => {
  if (payload && typeof payload.apiBaseUrl === 'string') {
    applyApiBaseUrl(payload.apiBaseUrl);
  }
});

safeExpose('desktopBridge', {
  getApiBaseUrl: () => state.apiBaseUrl
});
