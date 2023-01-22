// Import required modules
const {app, BrowserWindow, ipcMain, dialog, Menu, MenuItem, shell} = require('electron');
const { fstat } = require('fs');
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

const createWindow = () => {
    const mainWindowStateKeeper = windowStateKeeper('main');
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
    menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
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
        return config.InvokeConfig(event, method, data);
        break;
      case 'world':
        return world.InvokeConfig(event, method, data);
        break;
      case 'file':
        return fileManager.InvokeConfig(event, method, data);
        break;
      case 'ui':
        return uiManager.InvokeConfig(event, method, mainWindow, data);
        break;
      case 'quit':
        mainWindow.close();
        break;
      case 'return':
        event.sender.send('return', method, data);
      default:
        break;
    }
  }
  catch(e) {
    mainWindow.webContents.send('error', 'An error has occurred in the ' + module + ' module.<br/>' + e);
  }
}

function loadPage(pageName, qry) {
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

// Menu
const menuTemplate = [
  (isMac ? {
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  } : {role: ''}),
  {
    role: 'fileMenu'
  },
  {
     role: 'editMenu'
  },
  {
    label: 'Go',
    submenu: [
      {
        label: 'Velox Mundi Home',
        click: async () => {
          loadPage('index.html');
        }
      },
      {
        label: 'World Home',
        click: async () => {
          loadPage('worldHome.html');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Select a World',
        click: async () => {
          loadPage('selectWorld.html');
        }
      }
    ]
  },
  {
     role: 'viewMenu'
  },

  {
     role: 'windowMenu'
  },
  {
    label: 'Tools',
    submenu: [
      {
        label: 'Options',
        click: async () => {
          loadPage('config.html');
        }
      }
    ]
  },
  {
     role: 'help',
     submenu: [
      {
        label: 'Velox Mundi Online',
        click: async () => {
          await shell.openExternal('https://google.com');
        }
      }
     ]
  }
]




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