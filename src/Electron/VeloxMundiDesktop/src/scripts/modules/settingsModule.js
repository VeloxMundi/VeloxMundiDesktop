
const { remote, app } = require('electron');
const path = require('path');
const appConfig = require('electron-settings');

let appData = {};
let defaultPrefs = {
  "editorStyle": "RTE",
  "toastTimeout": 8000
};

module.exports = {
  Configure : (configObj) => {
    appConfig.configure(configObj);
  },
  LoadAppData : () => {
    appData = appConfig.getSync('appData');
    if (!appData.prefs) {
      appData.prefs = defaultPrefs;
      appConfig.setSync('appData', appData);
    }
    let appV = app.getVersion();
    if (!appData.appVersion || appData.appVersion!=appV) {
      appData.appName = require('../../../package.json').productName;
      appData.appVersion = app.getVersion();
      appConfig.setSync('appData', appData);
    }
  },
  Read : (key) => {
    if (!app.isPackaged) {
      console.log('Reading ' + key);
    }
    if (appData==undefined) {
      this.loadAppData();
    }
    let keySplit = key.split('.');
    if (appData.hasOwnProperty(keySplit[0])) {
      let obj = appData[keySplit[0]];
      for (let i=1; i<keySplit.length; i++) {
        if (obj.hasOwnProperty(keySplit[i])) {
          obj = obj[keySplit[i]];
        }
        else {
          obj = undefined;
          break;
        }
      }
      return obj;
    }
    else {
      return undefined;
    }
  },
  Write :  (key, value) => {
    let keySplit = key.split('.');
    let obj = appData;
    for (let i=0; i<keySplit.length-1; i++) {
      const key = keySplit[i];
      if (!obj.hasOwnProperty(key)) {
        obj[key] = {};
      }
      obj = obj[key];
    }
    obj[keySplit[keySplit.length-1]] = value;
    appData.modified = new Date(Date.now()).toLocaleString();
    if (key=='worldDirectory') {
      appData.currentWorld = '';
      appData.worldPath = '';
    }
    if (key=='currentWorld') {
      appData.worldPath = path.join(appData.worldDirectory, appData.currentWorld);
    }
    appConfig.setSync('appData', appData);
    
  },
  Check : (key) => {
    return appConfig.hasSync(key);
  },

  WindowStateKeeper : (windowName) => {
    let window, windowState;
    function setBounds() {
      // Restore from appConfig
      if (appConfig.hasSync(`windowState.${windowName}`)) {
        windowState = appConfig.getSync(`windowState.${windowName}`);
        return;
      }
      // Default
      windowState = {
        x: undefined,
        y: undefined,
        width: 950,
        height: 720,
      };
    }
    function saveState() {
      if (!windowState.isMaximized) {
        windowState = window.getBounds();
      }
      windowState.isMaximized = window.isMaximized();
      appConfig.set(`windowState.${windowName}`, windowState);
    }
    function track(win) {
      window = win;
      ['resize', 'move', 'close'].forEach(event => {
        win.on(event, saveState);
      });
    }
    setBounds();
    return({
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      isMaximized: windowState.isMaximized,
      track,
    });
  }
};