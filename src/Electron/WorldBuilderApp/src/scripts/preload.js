const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('contextBridge', {
  toMain: (method, data) => {
    ipcRenderer.send(method, data);
  },
  toMainSync: (method, data) => {
    return ipcRenderer.sendSync(method, data);
  }
  // we can also expose variables, not just functions
});
