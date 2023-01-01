// Import required modules
const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const { fstat } = require('fs');
const path = require('path');
const appConfig = require('electron-settings');

// Set default global variables
const appPath = app.getAppPath();
const pagePath = path.join(appPath, 'src', 'pages');
const scriptPath = path.join(appPath, 'src', 'scripts');
const configPath = path.join(appPath, 'config.json');


// load custom modules
const config = require(path.join(scriptPath, 'modules', 'configModule.js'));
config.InitPath(configPath);


   
let window = null;

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
    const mainWindow = new BrowserWindow(windowOptions);
    mainWindowStateKeeper.track(mainWindow);

    mainWindow.loadFile(path.join(pagePath, config.GetPage()));
}

app.whenReady().then(() => {
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
        default:
            break;
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