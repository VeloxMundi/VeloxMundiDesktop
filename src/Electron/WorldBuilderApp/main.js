const {app, BrowserWindow, ipcMain} = require('electron');
const { fstat } = require('fs');
const path = require('path');
let window = null;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800, 
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
        }
    });

    win.loadFile('./pages/home.html');
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


// Custom functions
ipcMain.on('saveChanges', (event, pageContent) => {
    // console.log(pageContent);
    const retarr = [0, 'There was a problem saving your changes. But sometimes error messages are too long to read. What do we do then?'];
    event.sender.send('saveResults', retarr);
});


function saveChanges(event, pageContent) {
    
}



