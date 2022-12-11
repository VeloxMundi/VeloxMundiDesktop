const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const { fstat } = require('fs');
const path = require('path');
const appPath = app.getAppPath();
const pagePath = path.join(appPath, 'src', 'pages');
const scriptPath = path.join(appPath, 'src', 'scripts');

   
let window = null;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000, 
        height: 800,
        webPreferences: {
            preload: path.join(scriptPath, 'preload.js'),
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
        }
    });
    

    win.loadFile(path.join(pagePath, 'index.html'));
    window = win;
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
