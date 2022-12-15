const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('contextBridge', {
  toMain: (module, method, data) => {
    ipcRenderer.send('toMain', module, method, data);
  },
  toMainAndBack: (module, method, data) => {
    return ipcRenderer.sendSync('toMainAndBack', module, method, data);
  },

  /*
  fromMain: (method, module, data) => {
    ipcRenderer.on('fromMain', (method, module, data) => {});
  }
  */
  // we can also expose variables, not just functions
});
