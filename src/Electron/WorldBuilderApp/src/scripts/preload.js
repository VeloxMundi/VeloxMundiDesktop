const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('contextBridge', {
  saveChanges: (pageContent) => ipcRenderer.send('saveChanges', pageContent),
  fromMain: (event, data) => {
    ipcRenderer.on(event, data);
  },
  toMain: (method, data) => {
    ipcRenderer.send(method, data);
  },
  selectDirectory: () => {
    ipcRenderer.sendSync('selectDirectory');
  },
  toMainSync: (method, data) => {
    return ipcRenderer.sendSync(method, data);
  },
  listWorlds: () => ipcRenderer.send('listWorlds'),
  ai: async (event, data) => {
    return await ipcRenderer.invoke(event, data);
  }
  // we can also expose variables, not just functions
});
