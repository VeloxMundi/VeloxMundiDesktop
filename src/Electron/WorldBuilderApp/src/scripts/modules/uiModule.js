const {app, dialog, BrowserWindow, ipcMain, ipcRenderer, Menu, shell} = require('electron');
const { file } = require('electron-settings');
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

  static InvokeConfig(event, method, win, data) {
    switch(method) {
      case 'SetMenu':
        this.SetMenu(event, win, data);
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
        for (let i=0; i<newMenu.length; i++) {
          if (newMenu[i].role=='fileMenu') {
            newMenu[i] = this.FileMenu_EditPage(event, win);
          }
        }
        break;
      default:
        break;
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(newMenu));
  }




  static FileMenu_EditPage(event, win) {
    return {
      label: 'File',
      submenu: [
        {
          label: 'Save', 
          click: async () => {
            win.webContents.send('menu', 'savePage');
          }
        },
        {
          label: 'Close',
          click: async() => {
            win.webContents.send('menu', 'closePage');
          }
        }
      ]
    };
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
              win.webContents.send('navigate', 'index.html');
            }
          },
          {
            label: 'World Home',
            click: async () => {
              win.webContents.send('navigate', 'worldHome.html');
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Select a World',
            click: async () => {
              win.webContents.send('navigate', 'selectWorld.html');
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
              win.webContents.send('navigate', 'config.html');
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
              await shell.openExternal('https://veloxmundi.com');
            }
          }
         ]
      }
    ];
  }

}



