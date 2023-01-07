const { triggerAsyncId } = require('async_hooks');
const { hasSubscribers } = require('diagnostics_channel');
const {app, dialog, BrowserWindow} = require('electron');
const fs = require('fs');
let path = require('path');


// Custom Modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));
let modal = null;
let saveAsEvent = null;

module.exports = class ConfigManager {
  constructor() {
    this.configpath = "";
  }

  static InvokeConfig(event, method, data) {
    switch(method) {
      case 'GetWorldLinks':
        return this.GetWorldLinks();
        break;
      case 'GetWorldPages':
        return this.GetWorldPages();
        break;
      case 'CreateWorld':
        return this.CreateWorld(data);
        break;
      case 'SavePage':
        return this.SavePage(data);
        break;
      case 'GetSaveAsPath':
        saveAsEvent = event;
        this.GetSaveAsPath();
        break;
      case 'SetSaveAsName':
        this.SetSaveAsName(data);
        break;
      default:
        event.sender.send('Invalid method call: "' + method + '"');
        break;
    }
    return null;
  }

  static GetWorldLinks() {
    let currentWorld=configManager.ReadKey('CurrentWorld');
    let worldPath = configManager.ReadKey('WorldDirectory');
    let worldList = fileManager.ReadSubdirectories(worldPath);
    let worldLinks = '';
    for (let i=0; i<worldList.length; i++)
    {
      worldLinks += '<li><a href="#" class="worldLink" data-path="' + worldList[i].path + '">' + worldList[i].name + '</a></li>\r\n';
    }


    return worldLinks;
  }

  static GetWorldPages() {
    let currentWorld=configManager.ReadKey('CurrentWorld');
    let worldPath = configManager.ReadKey('WorldDirectory');
    let dir = path.join(worldPath, currentWorld, 'md');
    let fileArray = [];
    let files = fs.readdirSync(dir).forEach(file => {
        var fileInfo = new fileManager(`${dir}\\${file}`, file);
        let ext = fileInfo.name.split('.').pop();
        if (ext=='md') {
          fileArray.push(fileInfo);
        }
    });
    return fileArray;
  }

  static CreateWorld(worldName) {
    try {
      let worldPath = configManager.ReadKey('WorldDirectory');
      let dir = path.join(worldPath, worldName);
      let b = fs.existsSync(dir);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        fs.mkdirSync(path.join(dir, 'md'));
        fs.mkdirSync(path.join(dir, 'html'));
        configManager.WriteKey('CurrentWorld', worldName);
        return [true, 'World created successfully'];
      }
      else {
        return [false, 'World already exists'];
      }
    }
    catch(e) {
      return [false, e];
    }

  }

  static SavePage(pageInfo) {
    try {
      fs.writeFileSync(pageInfo.pagePath, pageInfo.pageContents);
      return {
        'success': true, 
        'message': 'Saved file successfully!'
      };
    }
    catch(e) {
      return {
        'success': false, 
        'message': 'Unable to save file: ' + e
      };
    }
  }

  static GetSaveAsPath() {
    let saveAsOptions = {
      modal: true,
      width: 400,
      height: 125,
      frame: false,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(app.getAppPath(), 'src', 'scripts', 'preload.js'),
        nodeIntegration: false, // is default value after Electron v5
        contextIsolation: true, // protect against prototype pollution
        enableRemoteModule: false, // turn off remote
      }
    }
    modal = new BrowserWindow(saveAsOptions);

    var theUrl = 'file://' + path.join(app.getAppPath(), 'src', 'pages', 'modals', 'SaveAsPrompt.html');
    console.log('Modal url', theUrl);
    modal.loadURL(theUrl);
    modal.on('close', function() {
      if (saveAsEvent!=null) {
        saveAsEvent.sender.send('SaveAsPath', {
          'success': false,
          'message': 'File name was not set'
        });
      }
    });
  }

  static SetSaveAsName(data) {
    let worldPath = configManager.ReadKey('WorldDirectory');
    let currentWorld = configManager.ReadKey('CurrentWorld');
    let saveAs = '';
    if (data.action=='Save') {
      if (data.fileName='') {
        saveAs = {
          'success': true, 
          'path': path.join(worldPath, currentWorld, 'md', data.fileName + '.md')
        };
      }
      else {
        saveAs = {
          'success': false,
          'message': 'File name was not specified. File has not been saved.'
        };
      }
    }
    else {
      saveAs = {
        'success': false,
        'message': ''
      };
    }
    saveAsEvent.sender.send('SaveAsPath', {
      'success': saveAs.success,
      'message': saveAs.message
      });
    saveAsEvent = null;
    modal .close();
  }

}