import { contextBridge } from 'electron';

const apiArgument = process.argv.find(arg => arg.startsWith('--apiBaseUrl='));
const apiBaseUrl = apiArgument ? apiArgument.split('=')[1] : undefined;

if (apiBaseUrl) {
  window.__CCC_API_URL__ = apiBaseUrl;
}

contextBridge.exposeInMainWorld('desktopConfig', {
  apiBaseUrl
});
