const {app, BrowserWindow, ipcMain} = require('electron');
const { fstat } = require('fs');
const path = require('path');

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

    ipcMain.on('saveChanges', (content) => {
        saveChanges(content);
    });
    win.loadFile('./pages/home.html');
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
function saveChanges(content) {
    let retVal = {
        'result' : 'success',
        'id' : content[0],
        'content' : content[1]
    };
    console.log("result: " + retVal[0]);
    console.log("id: " + retVal[1]);
    console.log("content: " + retVal[2]);
    return retVal;
}



