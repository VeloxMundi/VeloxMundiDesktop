//const { deepStrictEqual } = require('assert');
//const { triggerAsyncId } = require('async_hooks');
//const { hasSubscribers } = require('diagnostics_channel');
const {app, dialog, BrowserWindow, webContents} = require('electron');
const { file } = require('electron-settings');
const fs = require('fs');
const fse = require('fs-extra');
let path = require('path');
const { config } = require('process');
const jsdom = require('jsdom');



// Custom Modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));
//configManager.InitPath(path.join(app.getAppPath(), 'user', 'config.json'), path.join(app.getAppPath(), 'data'));
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));
const pageManager = require(path.join(app.getAppPath(), 'src','scripts','modules', 'pageModule.js'));
let modal = null;
let saveAsEvent = null;


module.exports = class ConfigManager {
  constructor() {
    this.configpath = "";
  }

  static Invoke(event, method, data) {
    switch(method) {
      case 'GetWorldLinks':
        return this.GetWorldLinks();
        break;
      case 'GetWorldData':
        return this.GetWorldData();
        break;
      case 'CreateWorld':
        return this.CreateWorld(data);
        break;
      case 'SaveAsset':
        return this.SaveAsset(data);
        break;
      case 'SaveAssetFromURL':
        return this.SaveAssetFromURL(data);
        break;
      case 'IndexWorldPages':
        return this.IndexWorldPages();
        break;
      default:
        event.sender.send('Invalid method call: "' + method + '"');
        break;
    }
    return null;
  }

  static GetWorldLinks() {
    let worldPath = configManager.ReadKey('WorldDirectory');
    let worldList = fileManager.ReadSubdirectories(worldPath);
    let worldLinks = '';
    for (let i=0; i<worldList.length; i++)
    {
      worldLinks += '<li><a href="#" class="worldLink" data-path="' + worldList[i].path + '">' + worldList[i].name + '</a></li>\r\n';
    }
    return worldLinks;
  }

  static GetWorldData() {
    let fileArray = [];
    let data={
      worldName : configManager.ReadKey('CurrentWorld'),
      worldDirName : configManager.ReadKey('CurrentWorld'),
      pages : []
    };
    let currentWorld=configManager.ReadKey('CurrentWorld');
    let worldDir = configManager.ReadKey('WorldDirectory');
    let worldPath = path.join(worldDir,currentWorld);
    let worldDataPath = path.join(worldPath,"_world.json");
    if (!fs.existsSync(worldDataPath)) {
      fs.writeFileSync(worldDataPath, JSON.stringify(data, null, 2));
      this.IndexWorldPages();
    }
    let rawdata = fs.readFileSync(worldDataPath);
    if (rawdata != '') {
      data = JSON.parse(rawdata);
    }
    data.worldDataPath = worldDataPath;
    return data;
  }

  static SaveWorldData(data) {
    if (data.worldDataPath) {
      let worldDataPath = data.worldDataPath;
      delete data.worldDataPath;
      fs.writeFileSync(worldDataPath, JSON.stringify(data, null, 2));
    }
    else {
      throw "Unable to save world data.";
    }
  }

  static IndexWorldPages() {
    // TODO: Iterate through all pages in the HTML directory and create an index for each.
  }

  static CreateWorld(worldName) {
    try {
      let worldPath = configManager.ReadKey('WorldDirectory');
      let dir = path.join(worldPath, worldName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        fs.mkdirSync(path.join(dir, 'pages'));
        fs.mkdirSync(path.join(dir, 'assets'));        
        fs.mkdirSync(path.join(dir, 'styles'));
        fs.copyFileSync(path.join(app.getAppPath(), 'src', 'styles', 'default.css'), path.join(dir, 'styles', 'default.css'));
        configManager.WriteKey('CurrentWorld', worldName);
        let data={
          worldName : worldName,
          worldDirName : worldName, //TODO: Make filesystem friendly
          pages : []
        };
        fs.writeFileSync(path.join(dir,'_world.json'), JSON.stringify(data, null, 2));
        return {
          'success': true,
          'message': 'World created successfully'
        };
      }
      else {
        return {
          'success': false,
          'message': 'World already exists'
        };
      }
    }
    catch(e) {
      return {
        'success': false,
        'message': 'Unable to create world.<br/>' + e
      };
    }

  }




  
  static SaveAsset(newImgPath) {
    try {
      let worldDir = configManager.ReadKey('WorldDirectory');
      let currentWorld = configManager.ReadKey('CurrentWorld');
      let imgPath = path.join(worldDir, currentWorld, 'html', 'assets')
      fse.ensureDirSync(imgPath);
      let fileName = newImgPath.split('\\').pop();
      let destPath = path.join(imgPath, fileName);
      fs.copyFileSync(newImgPath, destPath);
      return {
        success: true,
        path: destPath
      };
    }
    catch(e) {
      return {
        success: false,
        message: e
      };
    }
  }

  static SaveAssetFromURL(url) {
    let x = 1;
  }

}