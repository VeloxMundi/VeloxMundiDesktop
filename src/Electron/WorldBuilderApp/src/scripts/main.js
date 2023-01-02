// Import required modules
const {app, BrowserWindow, ipcMain, dialog, Menu, MenuItem, shell} = require('electron');
const { fstat } = require('fs');
const path = require('path');
const appConfig = require('electron-settings');

// Set default global variables
const appPath = app.getAppPath();
const pagePath = path.join(appPath, 'src', 'pages');
const scriptPath = path.join(appPath, 'src', 'scripts');
const configPath = path.join(appPath, 'config.json');
const isMac = process.platform === 'darwin'


// load custom modules
const config = require(path.join(scriptPath, 'modules', 'configModule.js'));
config.InitPath(configPath);
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

    mainWindow.loadFile(path.join(pagePath, config.GetPage()));
}

app.whenReady().then(() => {
    const menu = Menu.buildFromTemplate(menuTemplate)
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

ipcMain.on('Navigate', (event, page) => {
  loadPage(page);
})

ipcMain.on('toMain', (event, module, method, data) => {
    CallModuleMethod(event, module, method, data);
});

ipcMain.on('toMainSync', (event, module, method, data) => {
    event.returnValue = CallModuleMethod(event, module, method, data);
});

function CallModuleMethod(event, module, method, data)
{
    switch(module)
    {
        case 'config':
          return config.InvokeConfig(event, method, data);
          break;
        case 'world':
          return world.InvokeConfig(event, method, data);
          break;
        default:
          break;
    }
}

function loadPage(pageName) {
  mainWindow.loadFile(path.join(pagePath, pageName));
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
        label: 'Home',
        click: async () => {
          loadPage('index.html');
        }
      },
      {
        label: 'Select a World',
        click: async () => {
          loadPage('selectWorld.html');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Settings',
        click: async () => {
          loadPage('config.html');
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