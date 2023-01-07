const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('contextBridge', {
  fromMain: (channel, data) => {
    ipcRenderer.on(channel, data);
  },
  toMain: (module, method, data) => {
    ipcRenderer.send('toMain', module, method, data);
  },
  toMainSync: (module, method, data) => {
    return ipcRenderer.sendSync('toMainSync', module, method, data);
  },
  navigate: (page) => {
    ipcRenderer.send('navigate', page);
  },
  modal: (action, path) => {
    ipcRenderer.send('modal', action, path);
  }
});
