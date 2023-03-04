const {app, dialog, BrowserWindow, ipcMain, ipcRenderer, Menu, shell} = require('electron');
const { file, configure } = require('electron-settings');
const fs = require('fs');
let path = require('path');
const config = require('process');
const contextMenu = require('electron-context-menu');

const isMac = process.platform === 'darwin';


// Custom Modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));
const pageManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'pageModule.js'));

module.exports = class UIManager {
  constructor() {
  }

  static Invoke(event, method, data, windows, isMac) {
    switch(method) {
      case 'SetMenu':
        this.SetMenu(event, windows, isMac, data);
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

  

  static SetMenu(event, windows, isMac, page) {
    let win = null;
    switch(page.split('_')[0]) {
      case 'options':
        win = windows.options;
        break;
      case 'preview':
        win = windows.preview;
        break;
      default:
        win = windows.main;
        break;
    }
    let pageMenu = this.menuitems(win).filter(function (m) {
      return (isMac && m.id=='macMain') ||
              (m.showOn &&
                (m.showOn.includes(page) ||
                m.showOn.includes('-all-'))
              );
    });
    for (let i=0; i<pageMenu.length; i++) {
      if (pageMenu[i].submenu && pageMenu[i].submenu.length>0) {
        pageMenu[i].submenu = filterSubmenu(page, pageMenu[i].submenu);
      }
    }
    if (isMac) {
      Menu.setApplicationMenu(Menu.buildFromTemplate(pageMenu));
    }
    else {
      if (page.startsWith('preview_') || page.startsWith('options_')) {
        win.removeMenu();
        contextMenu({
          showInspectElement: !app.isPackaged
        });
      }
      else {
        win.setMenu(Menu.buildFromTemplate(pageMenu));
      }
    }
  }

  static OpenFileDialog() {
    return dialog.showOpenDialogSync(function (fileNames) {         
      });        
  }

  static ShowMessage(options) {
    return dialog.showMessageBoxSync(options);
  }

  static menuitems(win) {
    return [
    {
      id: 'macMain',
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
    },
    {
      id: 'File',
      showOn: ['-all-'],
      label: 'File',
      submenu: [
        {
          id: 'File-New',
          showOn: [
            'edit_md.html',
            'edit_html.html',
            'index.html',
            'selectworld.html',
            'worldhome.html'
          ],
          hideOn: [
            'index.html'
          ],
          label: 'New',
          submenu: [
          {
            id: 'File-New-Page',
            showOn: [
              'edit_md.html',
              'edit_html.html',
              'worldhome.html'
            ],
            label: 'Page',
            click: async() => {
              win.webContents.send('menu','NewPage');
            }
          },
          {
            id: 'File-New-Type',
            showOn: [
              'edit_md.html',
              'edit_html.html',
              'worldhome.html'
            ],
            label: 'Type',
            click: async () => {
              win.webContents.send('menu', 'NewType');
            }
          },
          {
            id: 'File-New-World',
            showOn: [
              'selectworld.html'
            ],
            label: 'World',
            click: async() => {

            }
          }
          ]
        },
        {
          id: 'File-Save',
          showOn: [
            'edit_md.html',
            'edit_html.html'
          ],
          label: 'Save', 
          click: async () => {
            win.webContents.send('menu', 'SavePage');
          }
        },
        {
          id: 'File-SaveAndClose',
          showOn: [
            'edit_md.html',
            'edit_html.html'
          ],
          label: 'Save and Close',
          click: async () => {
            win.webContents.send('menu', 'SaveAndClose');
          }
        },
        {
          id: 'File-Close',
          showOn: [
            'edit_md.html',
            'edit_html.html'
          ],
          label: 'Close',
          click: async() => {
            win.webContents.send('menu', 'ClosePage');
          }
        },
        {
          showOn: [
            'edit_md.html',
            'edit_html.html'
          ],
          type: 'separator'
        },
        {
          id: 'File-ConvertToHtml',
          showOn: [
            'edit_md.html'
          ],
          label: 'Convert to HTML',
          click: async () => {
            win.webContents.send('menu', 'Convert', 'html');
          }
        },
        {
          id: 'File-ConvertToMd',
          showOn: [
            'edit_html.html'
          ],
          label: 'Convert to Markdown',
          click: async () => {
            win.webContents.send('menu', 'Convert', 'md');
          }
        },
        {
          showOn: [
            'edit_md.html',
            'edit_html.html'
          ],
          type: 'separator'
        },
        {
          id: 'File-Rename',
          showOn: [
            'edit_md.html',
            'edit_html.html'
          ],
          label: 'Rename',
          click: async () => {
            win.webContents.send('menu', 'RenamePage');
          }
        },
        {
          id: 'File-Delete',
          showOn: [
            'edit_md.html',
            'edit_html.html'
          ],
          label: 'Delete',
          click: async () => {
            win.webContents.send('menu', 'DeletePage');
          }
        },
        {
          type: 'separator'
        },
        {
          id: 'File-Separator-02',
          showOn: [
            'edit_md.html',
            'edit_html.html',
            'selectworld.html',
            'worldhome.html'
          ],
          type: 'separator'
        },
        {
          id: 'File-Exit',
          showOn: ['-all-'],
          label: 'Exit',
          click: async() => {
            win.webContents.send('menu', 'ExitApp');
          }
        }
      ]
    },
    {
      id: 'Edit',
      showOn: ['-all-'],
      role: 'editMenu'
    },
    {
      id: 'View',
      showOn: ['-all-'],
      role: 'viewMenu'
    },  
    {
      id: 'Window',
      showOn: ['-all-'],
      role: 'windowMenu'
    },
    {
      id: 'Tools',
      showOn: ['-all-'],
      label: 'Tools',
      submenu: [
        {
          id: 'Tools-Options',
          showOn: ['-all-'],
          label: 'Options',
          click: async () => {
            win.webContents.send('menu', 'Navigate', 'options_main.html');
          }
        }
      ]
    },
    {
      id: 'World',
      showOn: ['-all-'],
      label: 'World',
      submenu: [
        {
          id: 'World-Home',
          showOn: ['-all-'],
          label: 'World Home',
          click: async () => {
            win.webContents.send('menu', 'Navigate', 'worldHome.html');
          }
        },
        {
          id: 'World-Separator01',
          showOn: ['-all-'],
          type: 'separator'
        },
        {
          id: 'World-Select',
          showOn: ['-all-'],
          label: 'Select a World',
          click: async () => {
            win.webContents.send('menu', 'Navigate', 'selectWorld.html');
          }
        },
        {
          id: 'World-Close',
          showOn: ['-all-'],
          label: 'Close World',
          click: async () => {
            win.webContents.send('menu', 'CloseWorld');
          }
        }
      ]
    },
    {
      id: 'Help',
      showOn: ['-all-'],
      role: 'help',
       submenu: [
        {
          id: 'Help-About',
          showOn: ['-all-'],
          label: 'About Velox Mundi',
          click: async () => {
            win.webContents.send('menu', 'Navigate', 'index.html');
          }
        },
        {
          id: 'Help-Online',
          showOn: ['-all-'],
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

function filterSubmenu(page, submenuArray) {
  page = page.toLowerCase();
  return submenuArray.filter(function (m) {
    let subm = m.submenu;
    //let show = m.showOn.includes(page);
    if (subm && subm.length>0) {
      m.submenu = filterSubmenu(page, subm);
    }
    return (m.showOn &&
            (!m.hideOn || !m.hideOn.includes(page)) &&
            (m.showOn.includes(page) ||
            m.showOn.includes('-all-'))

           );
  });
}


