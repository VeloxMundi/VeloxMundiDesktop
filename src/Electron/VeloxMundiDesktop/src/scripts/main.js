// Import required modules
const {app, BrowserWindow, ipcMain, dialog, Menu, MenuItem, shell} = require('electron');
const fs = require('fs');
const path = require('path');

// register modules
const appConfig = require('electron-settings');
const fileManager = require('./modules/fileManagerModule');
const uiManager = require('./modules/uiModule');

// Set default global variables
const appPath = app.getAppPath();
const pagePath = path.join(appPath, 'src', 'pages');
const modalPath = path.join(pagePath, 'modals');
const scriptPath = path.join(appPath, 'src', 'scripts');
const configPath = path.join(appPath, 'user', 'config.json');
const dataPath = path.join(appPath, 'data');
const isMac = process.platform === 'darwin'

let modal = null;
let menu = null;


// load custom modules
const config = require(path.join(scriptPath, 'modules', 'configModule.js'));
config.InitPath(configPath, dataPath);
const world = require(path.join(scriptPath, 'modules', 'worldModule.js'));



let mainWindow = null;
let optionsWindow = null;
let mainWindowStateKeeper = null;

const createWindow = () => {
    mainWindowStateKeeper = windowStateKeeper('main');
    const windowOptions = {
      x: mainWindowStateKeeper.x,
      y: mainWindowStateKeeper.y,
      width: mainWindowStateKeeper.width,
      height: mainWindowStateKeeper.height,
      webPreferences: {
        preload: path.join(scriptPath, 'preload.js'),
        nodeIntegration: false, // is default value after Electron v5
        contextIsolation: true, // protect against prototype pollution
        enableRemoteModule: false, // turn off remote
      }
    }
    mainWindow = new BrowserWindow(windowOptions);
    mainWindowStateKeeper.track(mainWindow);
    let openPage = config.GetPage();
    console.log(openPage);
    mainWindow.loadFile(path.join(pagePath, openPage[0]), {query: openPage[1]});
}

app.whenReady().then(() => {
    //menu = Menu.buildFromTemplate(menuTemplate)
    //Menu.setApplicationMenu(menu)
    createWindow();

    // for macOS, if the application is activated and no windows are open, create a new window
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
});

// Close application once all windows are closed (Windows and Linux ONLY)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('modal', (event, action, path) => {
  if (action.toLowerCase()=='show') {
    modal = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: 375,
      height: 125,
      alwaysOnTop: true,
      frame: false
    });

    var theUrl = 'file://' + modalPath + '/' + path;
    console.log('Modal url', theUrl);

    modal.loadURL(theUrl);
  }
  else if (action.toLowerCase()=='hide') {
    
  }
});


ipcMain.on('navigate', (event, page, query) => {
  loadPage(page, query);  
});



ipcMain.on('toMain', (event, module, method, data) => {
    CallModuleMethod(event, module, method, data);
});

ipcMain.on('toMainSync', (event, module, method, data) => {
    event.returnValue = CallModuleMethod(event, module, method, data);
});

function CallModuleMethod(event, module, method, data)
{
  try {
    switch(module)
    {
      case 'navigate':
        loadPage(method, data);
        break;
      case 'config':
        return config.Invoke(event, method, data);
        break;
      case 'world':
        return world.Invoke(event, method, data);
        break;
      case 'page':
        return page.Invoke(event, method, data);
        break;
      case 'file':
        return fileManager.Invoke(event, method, data);
        break;
      case 'ui':
        return uiManager.Invoke(event, method, mainWindow, data);
        break;
      case 'quit':
        mainWindow.close();
        break;
      case 'closeWindow':
        switch(method) {
          case 'Options':
            optionsWindow.close();
            optionsWindow = null;
            break;
          default:
            break;
        }
        break;
      case 'return':
        event.sender.send('return', method, data);
      default:
        break;
    }
  }
  catch(e) {
    focusedWindow().webContents.send('error', 'An error has occurred in the ' + module + ' module.<br/>' + e);
  }
}

function loadPage(pageName, qry) {
  let doNav=true;
  if (fs.existsSync(path.join(pagePath, pageName)))
  {
    // page-specific functions
    switch(pageName) {
      case 'edit.html':
        let editor = config.ReadUserPref('editorStyle');
        switch(editor) {
          case 'MD':
            pageName='edit.html';
            break;
          default:
            pageName='rteEdit.html';
            break;
        }
        break;
    }
    // Options pages load in a new window
    if (pageName.startsWith('options_')) {
      let mwPos = mainWindow.getPosition();
      if (!optionsWindow) {
        let optionsWindowOpts = {
          x: mainWindow.getPosition()[0] + 50,
          y: mainWindow.getPosition()[1] + 50,
          width: 800,
          height: 600,
          frame: false,
          webPreferences: {
            preload: path.join(scriptPath, 'preload.js'),
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
          }
        }
        optionsWindow = new BrowserWindow(optionsWindowOpts);
        optionsWindow.loadFile(path.join(pagePath, pageName));
      }
      else {
        optionsWindow.focus();
        optionsWindow.loadFile(path.join(pagePath, pageName));
      }
      doNav=false; 
    }
  }
  else {
    focusedWindow().webContents.send('error', 'Page "' + pageName + '" was not found.');
    doNav = false;
  }
  if (doNav) {
    let pathQuery = {};
    if (qry && qry!='') {
      let params = (decodeURIComponent(qry).split('&'));
      for (let i=0; i<params.length; i++) {
        let param = params[i].split('=');
        pathQuery[param[0]] = param[1];
      }
    }
    mainWindow.loadFile(path.join(pagePath, pageName), {query: pathQuery});
  }
}

function focusedWindow() {
  let wins = BrowserWindow.getAllWindows();
  for (let i=0; i<wins.length; i++) {
    if (wins[i].isFocused()) {
      return wins[i];
    }
  }
}












// Window manager
function windowStateKeeper(windowName) {
    let window, windowState;
    function setBounds() {
      // Restore from appConfig
      let b = appConfig.getSync();
      if (appConfig.hasSync(`windowState.${windowName}`)) {
        windowState = appConfig.getSync(`windowState.${windowName}`);
        return;
      }
      // Default
      windowState = {
        x: undefined,
        y: undefined,
        width: 1000,
        height: 800,
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