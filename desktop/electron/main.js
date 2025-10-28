import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

let backendServer;
let backendPort;

const resolveFrontendEntry = () => {
  if (isDev && process.env.ELECTRON_START_URL) {
    return { type: 'url', value: process.env.ELECTRON_START_URL };
  }

  const baseDir = isDev
    ? path.resolve(__dirname, '../../frontend/dist')
    : path.join(app.getAppPath(), 'frontend', 'dist');

  return { type: 'file', value: path.join(baseDir, 'index.html') };
};

const loadBackendModule = async () => {
  const backendEntry = isDev
    ? path.resolve(__dirname, '../../backend/server.js')
    : path.join(app.getAppPath(), 'backend', 'server.js');

  return import(pathToFileURL(backendEntry).href);
};

const startBackend = async () => {
  if (backendServer) {
    const address = backendServer.address();
    if (typeof address === 'object' && address) {
      backendPort = address.port;
      return backendPort;
    }
  }

  const { startServer } = await loadBackendModule();
  const { server, port } = await startServer({ port: 0, host: '127.0.0.1', log: isDev });
  backendServer = server;
  backendPort = port;
  return port;
};

const createWindow = async () => {
  const port = await startBackend();
  const apiBaseUrl = `http://127.0.0.1:${port}/api`;

  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [`--apiBaseUrl=${apiBaseUrl}`]
    }
  });

  const frontendEntry = resolveFrontendEntry();

  if (frontendEntry.type === 'url') {
    await window.loadURL(frontendEntry.value);
  } else {
    await window.loadFile(frontendEntry.value);
  }

  if (isDev) {
    window.webContents.openDevTools({ mode: 'detach' });
  }
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendServer) {
    backendServer.close();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

app.whenReady().then(createWindow).catch(error => {
  console.error('Failed to start application', error);
  app.exit(1);
});

process.on('exit', () => {
  if (backendServer) {
    backendServer.close();
  }
});

process.on('SIGINT', () => {
  app.quit();
});

process.on('SIGTERM', () => {
  app.quit();
});
