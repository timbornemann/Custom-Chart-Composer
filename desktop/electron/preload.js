// CommonJS preload to avoid ESM issues in sandbox
const { contextBridge, ipcRenderer } = require('electron');

const state = { apiBaseUrl: undefined, appVersion: undefined };

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

function findAppVersionArgument() {
  const args = Array.isArray(process.argv) ? [...process.argv] : [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (typeof a !== 'string') continue;
    if (a.startsWith('--appVersion=')) return a.slice('--appVersion='.length);
    if (a === '--appVersion' && typeof args[i + 1] === 'string') return args[i + 1];
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
state.appVersion = findAppVersionArgument();
if (state.appVersion && typeof window !== 'undefined') {
  try { window.__CCC_APP_VERSION__ = state.appVersion; } catch (e) {}
  safeExpose('__CCC_APP_VERSION__', state.appVersion);
  safeExpose('desktopConfig', { ...(typeof window.desktopConfig === 'object' && window.desktopConfig ? window.desktopConfig : {}), version: state.appVersion, apiBaseUrl: state.apiBaseUrl });
}

ipcRenderer.on('ccc:config', (_event, payload) => {
  if (payload && typeof payload.apiBaseUrl === 'string') {
    applyApiBaseUrl(payload.apiBaseUrl);
  }
  if (payload && typeof payload.version === 'string' && !state.appVersion) {
    state.appVersion = payload.version;
    try { window.__CCC_APP_VERSION__ = state.appVersion; } catch (e) {}
    safeExpose('__CCC_APP_VERSION__', state.appVersion);
  }
});

safeExpose('desktopBridge', {
  getApiBaseUrl: () => state.apiBaseUrl
});
