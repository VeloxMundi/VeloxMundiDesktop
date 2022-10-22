const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('actions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  saveChanges: (content) => ipcRenderer.send('saveChanges', content)
  // we can also expose variables, not just functions
});
