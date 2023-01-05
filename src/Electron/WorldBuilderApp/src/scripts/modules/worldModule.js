const { triggerAsyncId } = require('async_hooks');
const { hasSubscribers } = require('diagnostics_channel');
const {app, dialog, BrowserWindow} = require('electron');
const fs = require('fs');
let path = require('path');


// Custom Modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));
let modal = null;
let saveAs = '';

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
      return [true, 'Saved file successfully!'];
    }
    catch(e) {
      return [false, 'Unable to save file: ' + e];
    }
  }

  static GetSaveAsPath() {
    saveAs='';
    modal = new BrowserWindow({
      modal: true,
      width: 275,
      height: 100,
      alwaysOnTop: true,
      //frame: false
    });

    var theUrl = 'file://' + path.join(app.getAppPath(), 'src', 'pages', 'modals', 'SaveAsPrompt.html');
    console.log('Modal url', theUrl);

    modal.loadURL(theUrl);
  }

  static SetSaveAsName(name) {
    saveAs=path.join(configManager.ReadKey('WorldPath'), configManager.ReadKey('CurrentWorld'), name + '.md');
    modal.close();
    return saveAs;
  }

}