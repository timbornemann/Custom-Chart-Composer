// CommonJS preload to avoid ESM issues in sandbox
const { contextBridge, ipcRenderer } = require('electron');

const state = { apiBaseUrl: undefined };

function findApiBaseUrlArgument() {
  const args = Array.isArray(process.argv) ? [...process.argv] : [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (typeof a !== 'string') continue;
    if (a.startsWith('--apiBaseUrl=')) return a.slice('--apiBaseUrl='.length);
    if (a === '--apiBaseUrl' && typeof args[i + 1] === 'string') return args[i + 1];
  }
  return undefined;
}

function safeExpose(key, value) {
  try {
    contextBridge.exposeInMainWorld(key, value);
  } catch (error) {
    if (!/has already been exposed to the main world/i.test(String(error && error.message))) {
      // eslint-disable-next-line no-console
      console.warn(`Unable to expose ${key} via contextBridge:`, error);
    }
  }
}

function applyApiBaseUrl(rawValue) {
  if (typeof rawValue !== 'string' || rawValue.length === 0) return;
  const value = rawValue.trim();
  if (!value || value === state.apiBaseUrl) return;
  state.apiBaseUrl = value;

  if (typeof window !== 'undefined') {
    try { window.__CCC_API_URL__ = value; } catch (e) {}
    try {
      const current = (typeof window.desktopConfig === 'object' && window.desktopConfig) ? window.desktopConfig : {};
      window.desktopConfig = { ...current, apiBaseUrl: value };
    } catch (e) {}
  }

  safeExpose('__CCC_API_URL__', value);
  safeExpose('desktopConfig', { apiBaseUrl: value });
}

applyApiBaseUrl(findApiBaseUrlArgument());

ipcRenderer.on('ccc:config', (_event, payload) => {
  if (payload && typeof payload.apiBaseUrl === 'string') {
    applyApiBaseUrl(payload.apiBaseUrl);
  }
});

safeExpose('desktopBridge', {
  getApiBaseUrl: () => state.apiBaseUrl
});
