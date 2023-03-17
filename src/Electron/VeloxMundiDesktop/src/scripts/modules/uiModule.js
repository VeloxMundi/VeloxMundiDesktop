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
    let pageMenu = filterSubmenu(page, this.menuitems(win));
    /*let pageMenu = this.menuitems(win).filter(function (m) {
      return (isMac && m.id=='macMain') ||
              (m.showOn &&
                (m.showOn.includes(page) ||
                m.showOn.includes('-all-'))
              );
    });*/
    for (let i=0; i<pageMenu.length; i++) {
      if (pageMenu[i].submenu && pageMenu[i].submenu.length>0) {
        pageMenu[i].submenu = filterSubmenu(page, pageMenu[i].submenu);
      }
    }
    if (isMac) {
      Menu.setApplicationMenu(Menu.buildFromTemplate(pageMenu));
    }
    else {
      if (page.startsWith('options_')) {
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
      hideOn: [
        'options_',
        'preview_'
      ],
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
          accelerator: 'CommandOrControl+S',
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
          hideOn: [
            'preview_',
            'options_'
          ],
          label: 'Exit',
          accelerator: '',
          click: async() => {
            win.webContents.send('menu', 'ExitApp');
          }
        }
      ]
    },
    {
      id: 'Edit',
      showOn: ['-all-'],
      hideOn: [
        'options_',
        'preview_'
      ],
      role: 'editMenu'
    },
    {
      id: 'View',
      label: 'View',
      showOn: ['-all-'],
      hideOn: [
        'options_',
      ],
      //role: 'viewMenu'
      submenu: [
        {
          id: 'View-Preview',
          label: 'Preview Page',
          accelerator: 'CommandOrControl+Shift+P',
          showOn: [
            'edit_md.html',
            'edit_html.html'
          ],
          click: async() => {
            win.webContents.send('menu', 'Preview');
          }
        },
        {
          id: 'View-Back',
          label: 'Back',
          showOn: [
            'preview_page.html'
          ],
          click: async() => {
            win.webContents.goBack();
          }
        },
        {
          id: 'View-Forward',
          label: 'Forward',
          showOn: [
            'preview_page.html'
          ],
          click: async() => {
            win.webContents.goForward();
          }
        },
        {
          showOn: [
            'edit_md.html',
            'edit_html.html',
            'preview_'
          ],
          type: 'separator'
        },
        {
          showOn: ['-all-'],
          role: 'reload'
        },
        {
          showOn: ['-all-'],
          role: 'forcereload'
        },
        {
          showOn: ['-all-'],
          role: 'toggledevtools'
        },
        {
          showOn: ['-all-'],
          type: 'separator'
        },
        {
          showOn: ['-all-'],
          role: 'resetzoom'
        },
        {
          showOn: ['-all-'],
          role: 'zoomin'
        },
        {
          showOn: ['-all-'],
          role: 'zoomout'
        },
        {
          showOn: ['-all-'],
          type: 'separator'
        },
        {
          showOn: ['-all-'],
          role: 'togglefullscreen'
        },
        {
          showOn: ['preview_'],
          type: 'separator'
        },
        {
          id: 'View-ClosePreview',
          showOn: ['preview_'],
          label: 'Close Preview',
          accelerator: 'CommandOrControl+W',
          click: async() => {
            win.close();
          }
        }
      ]
    },  
    {
      id: 'Window',
      showOn: ['-all-'],
      hideOn: [
        'preview_',
        'options_'
      ],
      role: 'windowMenu'
    },
    {
      id: 'Tools',
      showOn: ['-all-'],
      hideOn: [
        'preview_',
        'options_'
      ],
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
      hideOn: [
        'preview_',
        'options_'
      ],
      label: 'World',
      submenu: [
        {
          id: 'World-Home',
          showOn: ['-all-'],
          label: 'World Home',
          accelerator: 'CommandOrControl+W',
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
      hideOn: [
        'preview_',
        'options_'
      ],
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
    let pageStub = (page.includes('_') ? page.split('_')[0] + '_' : null);
    let subm = m.submenu;
    //let show = m.showOn.includes(page);
    if (subm && subm.length>0) {
      m.submenu = filterSubmenu(page, subm);
    }
    let ret = false;
    if (
      m.showOn && m.showOn.includes('-all-')
    ) {
      ret = true;
    }
    if (
      m.showOn && 
      (
        m.showOn.includes(page) ||
        (pageStub && m.showOn.includes(pageStub))
      )
    ) {
      ret = true;
    }

    if (
      m.hideOn && 
      (
        m.hideOn.includes(page) ||
        (pageStub && m.hideOn.includes(pageStub))
      )
    ) {
      ret = false;
    }

    return ret;
    /*
    return (m.showOn &&
            (
              !m.hideOn || 
              !m.hideOn.includes(page) ||
              (
                !pageStub || !m.hideOn.includes(pageStub)
              )
            ) &&
            (
              m.showOn.includes(page) ||
              m.showOn.includes('-all-') ||
              (
                pageStub && m.showOn.includes(pageStub)
              )
            )

           );
    */
  });
}


