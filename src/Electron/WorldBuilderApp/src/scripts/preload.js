const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('contextBridge', {
  saveChanges: (pageContent) => ipcRenderer.send('saveChanges', pageContent),
  fromMain: (event, data) => {
    ipcRenderer.on(event, data);
  },
  listWorlds: () => ipcRenderer.send('listWorlds')
  // we can also expose variables, not just functions
});
