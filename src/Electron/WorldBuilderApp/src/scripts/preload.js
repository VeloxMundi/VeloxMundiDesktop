const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('contextBridge', {
  toMain: (module, method, data) => {
    ipcRenderer.send('toMain', module, method, data);
  },
  toMainSync: (module, method, data) => {
    return ipcRenderer.sendSync('toMainSync', module, method, data);
  }
});
