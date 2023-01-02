const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('contextBridge', {
  fromMain: (event, data) => {
    ipcRenderer.on(event, data);
  },
  toMain: (module, method, data) => {
    ipcRenderer.send('toMain', module, method, data);
  },
  toMainSync: (module, method, data) => {
    return ipcRenderer.sendSync('toMainSync', module, method, data);
  },
  navigate: (page) => {
    ipcRenderer.send('Navigate', page);
  }
});
