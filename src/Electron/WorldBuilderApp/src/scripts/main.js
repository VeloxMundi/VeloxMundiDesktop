const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const { fstat } = require('fs');
const path = require('path');
const appPath = app.getAppPath();
const pagePath = path.join(appPath, 'src', 'pages');
const scriptPath = path.join(appPath, 'src', 'scripts');
const FileManager = require('./utilities/filemanager');
const ConfigManager = require('./utilities/configmanager');
ConfigManager.SetPath(path.join(appPath, 'config.json'));


let configPage = null;


    
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

//Testing
ipcMain.on('B1', (event) => {
    event.returnValue = "Button 1!";
});
ipcMain.on('B2', () => {
    return "Button 2!";
});


// Custom functions
ipcMain.on('listWorlds', (event) => {
    let worldPath = ConfigManager.ReadKey('WorldDirectory');
    const dirArr = FileManager.ReadSubdirectories(worldPath);
    return event.sender.send('listWorlds', dirArr);
});

ipcMain.on('loadConfig', (event) => {
    event.returnValue = ConfigManager.ReadAll();
});
ipcMain.on('setWorld', (event, world) => {
    ConfigManager.WriteKey('CurrentWorld', world);
});

ipcMain.on('selectWorldDirectory', (event) => {
    var directory = dialog.showOpenDialogSync({ properties: ['openDirectory']});
    if (directory.length = 1) {
        ConfigManager.WriteKey('WorldDirectory',directory[0]);
        event.returnValue = directory[0];
    }
    else {
        event.returnValue = '';
    }
});
ipcMain.on('getConfigKey', (event, key) => {
    event.returnValue = ConfigManager.ReadKey(key);
});

ipcMain.on('saveChanges', (event, pageContent) => {
    // console.log(pageContent);
    const retarr = [0, 'There was a problem saving your changes. But sometimes error messages are too long to read. What do we do then?'];
    event.sender.send('saveResults', retarr);
});

ipcMain.on('CreateWorld', (event, worldName) => {
    // Create a new folder named ${data}
    try
    {
        let worldPath = path.join(ConfigManager.ReadKey('WorldDirectory'),worldName);
        FileManager.CreateDirectory(worldPath);
        FileManager.CreateDirectory(path.join(worldPath, 'md'));
        FileManager.CreateDirectory(path.join(worldPath, 'html'));
        event.returnValue = '';
    }
    catch(err)
    {
        event.returnValue = err.message;
    }
});

function saveChanges(event, pageContent) {
    
}



