const { triggerAsyncId } = require('async_hooks');
const { hasSubscribers } = require('diagnostics_channel');
const {app, dialog} = require('electron');
const fs = require('fs');
let path = require('path');


// Custom Modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));

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
        var fileInfo = new fileManager(`${path}\\${file}`, file);
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

}