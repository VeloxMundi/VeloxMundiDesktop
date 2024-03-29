const {app, dialog, BrowserWindow, ipcMain, ipcRenderer, Menu, shell} = require('electron');
const { file, configure } = require('electron-settings');
const fs = require('fs');
let path = require('path');
const config = require('process');

const isMac = process.platform === 'darwin';


// Custom Modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));

module.exports = class UIManager {
  constructor() {
  }

  static Invoke(event, method, win, data) {
    switch(method) {
      case 'SetMenu':
        this.SetMenu(event, win, data);
        break;
      case 'OpenFileDialog':
        return this.OpenFileDialog();
        break;
      case 'ShowMessage':
        return this.ShowMessage(data);
        break;
      default:
        win.webContents.send('error', 'Invalid method call: "' + method + '"');
        break;
    }
    return null;
  }


  static SetMenu(event, win, page) {
    let newMenu = this.MenuDefault(win);
    switch(page) { 
      case 'edit.html':
        newMenu[1] = this.FileMenu_EditPage(win);
        break;      
      case 'rteEdit.html':
        newMenu[1] = this.FileMenu_EditPage(win);
        break;
      case 'worldHome.html':
        newMenu[1] = this.FileMenu_WorldHome(win);
        break;
      case 'selectWorld.html':
        newMenu[1] = this.FileMenu_SelectWorld(win);
        break;
      default:
        break;
    }
    let currentWorld = configManager.ReadKey('CurrentWorld');
    if (currentWorld && currentWorld!='') {
      if (currentWorld.length>25) {
        currentWorld = currentWorld.substring(0,22) + '...';
      }
      newMenu[6].submenu[0].label = currentWorld;
      newMenu[6].submenu[3].label = 'Close ' + currentWorld;
      newMenu[6].submenu[2].label = 'Change World';
    }
    else {
      newMenu[6] = this.WorldMenu_NoWorld(win);
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(newMenu));
  }

  static OpenFileDialog() {
    return dialog.showOpenDialogSync(function (fileNames) {         
      });        
  }

  static ShowMessage(options) {
    return dialog.showMessageBoxSync(options);
  }




  static FileMenu_EditPage(win) {
    return {
      label: 'File',
      submenu: [
        {
          label: 'Save', 
          click: async () => {
            win.webContents.send('menu', 'SavePage');
          }
        },
        {
          label: 'Save and Close',
          click: async () => {
            win.webContents.send('menu', 'SaveAndClose');
          }
        },
        {
          label: 'Close',
          click: async() => {
            win.webContents.send('menu', 'ClosePage');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Rename',
          click: async () => {
            win.webContents.send('menu', 'RenamePage');
          }
        },
        {
          label: 'Delete',
          click: async () => {
            win.webContents.send('menu', 'DeletePage');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Home',
          click: async() => {
            win.webContents.send('menu', 'Home');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Exit',
          click: async() => {
            win.webContents.send('menu', 'ExitApp');
          }
        }
      ]
    };
  }

  static FileMenu_WorldHome(win) {
    return {
      label: 'File',
      submenu: [
        {
          label: 'New',
          submenu: [
            {
              label: 'Page',
              click: async () => {
                win.webContents.send('menu', 'NewPage');
              }
            },
            {
              label: 'Type',
              click: async () => {
                win.webContents.send('menu', 'NewType');
              }
            }
          ]
        },
        {
          type: 'separator'
        },
        {
          type: 'separator'
        },
        {
          label: 'Exit',
          click: async() => {
            win.webContents.send('menu', 'ExitApp');
          }
        }
      ]
    };
  }

  static FileMenu_SelectWorld(win) {
    return {
      label: 'File',
      submenu: [
        {
          label: 'New World',
          click: async () => {
            win.webContents.send('menu', 'NewWorld');
          }
        },
        {
          type: 'separator'
        },
        {
          type: 'separator'
        },
        {
          label: 'Exit',
          click: async() => {
            win.webContents.send('menu', 'ExitApp');
          }
        }
      ]
    };
  }

  static WorldMenu_NoWorld(win) {
    return {
      label: 'World',
      enabled: false,
      submenu: [
        {
          label: 'Select a World',
          click: async () => {
            win.webContents.send('menu', 'Navigate', 'selectWorld.html');
          }
        }
      ]
    }
  }

  static MenuDefault(win) {
    return [
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
        label: 'File',
        submenu: [
          {
            label: 'Home',
            click: async() => {
              win.webContents.send('menu', 'Home');
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Exit',
            click: async() => {
              win.webContents.send('menu', 'ExitApp');
            }
          }
        ]
      },
      {
         role: 'editMenu'
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
              win.webContents.send('menu', 'Navigate', 'options_main.html');
            }
          }
        ]
      },
      {
        label: 'World',
        submenu: [
          {
            label: 'World Home',
            click: async () => {
              win.webContents.send('menu', 'Navigate', 'worldHome.html');
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Select a World',
            click: async () => {
              win.webContents.send('menu', 'Navigate', 'selectWorld.html');
            }
          },
          {
            label: 'Close World',
            click: async () => {
              win.webContents.send('menu', 'CloseWorld');
            }
          }
        ]
      },
      {
         role: 'help',
         submenu: [
          {
            label: 'About Velox Mundi',
            click: async () => {
              win.webContents.send('menu', 'Navigate', 'index.html');
            }
          },
          {
            label: 'Velox Mundi Online',
            click: async () => {
              await shell.openExternal('https://veloxmundi.com');
            }
          }
         ]
      }
    ];
  }

}



