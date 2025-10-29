import { contextBridge } from 'electron';

const apiArgument = process.argv.find(arg => arg.startsWith('--apiBaseUrl='));
const apiBaseUrl = apiArgument ? apiArgument.split('=')[1] : undefined;

if (apiBaseUrl) {
  try {
    contextBridge.exposeInMainWorld('__CCC_API_URL__', apiBaseUrl);
  } catch (error) {
    console.warn('Unable to expose __CCC_API_URL__ via contextBridge:', error);
  }

  window.__CCC_API_URL__ = apiBaseUrl;
}

contextBridge.exposeInMainWorld('desktopConfig', {
  apiBaseUrl
});
