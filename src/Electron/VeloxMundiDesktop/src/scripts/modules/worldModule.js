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
// because the pageModule references the worldModule, we can't create a reference back to the pageModule from here.
let modal = null;
let saveAsEvent = null;
let settingsModulePath = path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'settingsModule.js');


module.exports = class ConfigManager {
  constructor() {
    this.configpath = "";
  }

  static Invoke(event, method, data) {
    switch(method) {
      case 'GetWorldLinks':
        return this.GetWorldLinks(event);
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
      case 'GetRelPath':
        return this.GetRelPath(data);
        break;
      case 'GetFullPathFromRelPath':
        return this.GetFullPathFromRelPath(data);
        break;
      default:
        event.sender.send('Invalid method call: "' + method + '"');
        break;
    }
    return null;
  }

  static GetWorldLinks(event) {
    let worldPath = require(settingsModulePath).Read('worldDirectory');
    if (!worldPath) {
      //event.sender.send('navigate','appSetup.html');
      event.sender.send('appMessage', 'Error', {
        errorTitle : 'Application Requires Configuration',
        messages : [
          {
            message : 'Unable to find world directory. You may need to configure <i>Velox Mundi.</i>',
              type : 'html'
          },
          {
            message : '<a class="btn btn-danger" id="GoToConfig" href="appSetup.html">Go to setup</button>',
              type : 'html'
          }
        ]
      });
    }
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
      worldName : require(settingsModulePath).Read('currentWorld'),
      worldDirName : require(settingsModulePath).Read('currentWorld'),
      pages : []
    };
    let currentWorld=require(settingsModulePath).Read('currentWorld');
    let worldDir = require(settingsModulePath).Read('worldDirectory');
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
    // TODO: Iterate through all pages in the 'pages' directory and create an index for each.

  }

  static CreateWorld(worldName) {
    try {
      let appPath = app.getAppPath();
      let worldPath = require(settingsModulePath).Read('worldDirectory');
      let dir = path.join(worldPath, worldName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        fs.mkdirSync(path.join(dir, 'pages'));
        fs.mkdirSync(path.join(dir, '_web'));
        fs.mkdirSync(path.join(dir, '_web', '_assets'));        
        fs.mkdirSync(path.join(dir, '_web', '_assets', 'styles'));
        fs.copyFileSync(path.join(appPath, 'src', 'styles', 'default.css'), path.join(dir, 'styles', 'default.css'));
        if (fs.existsSync(path.join(appPath, 'src', 'styles', 'default.css'))) {
          fs.copyFileSync(path.join(appPath, 'src', 'styles', 'default.css'), path.join(dir, '_web', '_assets', 'styles', 'global.css'));
        }
        require(settingsModulePath).Write('currentWorld', worldName);
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




  
  static SaveAsset(newAssetPath, assetType) {
    try {
      assetType = (!assetType || assetType=='' ? 'image' : assetType);
      let worldDir = require(settingsModulePath).Read('worldDirectory');
      let currentWorld = reqire(settingsModulePath).Read('currentWorld');
      let imgPath = path.join(worldDir, currentWorld, '_web', '_assets', 'images');
      fse.ensureDirSync(imgPath);
      let fileName = newAssetPath.split(path.sep).pop();
      let destPath = path.join(imgPath, fileName);
      fs.copyFileSync(newAssetPath, destPath);
      return {
        success: true,
        path: destPath,
        relPath: path.join('_web','_assets', 'images', fileName)
      };
    }
    catch(e) {
      return {
        success: false,
        message: e
      };
    }
  }

  static GetFullPathFromRelPath(relPathInfo) {

    /* relPathInfo:
    fromFullPath (string)
    relPath (string)
    */
    let fullPathInfo = {};
    let fromPathParts = relPathInfo.fromFullPath.split(path.sep);
    let baseIndex = fromPathParts.length-1;
    if (relPathInfo.relPath.startsWith('_assets')) {
      relPathInfo.relPath = '../_web/' + relPathInfo.relPath;
    }
    let relPathParts = relPathInfo.relPath.split('/');
    let relBaseIndex = 0;
    for (let i=0; i<relPathParts.length; i++) {
      if (relPathParts[i]=='..') {
        baseIndex--;
        relBaseIndex++;
      }
      else {
        break;
      }
    }
    // Something is wrong when we do path.join on 'C:' and 'folder', so I'm using this as a workaround...
    let newBase = fromPathParts[0]+path.sep;
    for (let i=1; i<baseIndex; i++) {
      newBase = path.join(newBase, fromPathParts[i]);
    }
    let newRel = '';
    for (let i=relBaseIndex; i<relPathParts.length; i++) {
      newRel = path.join(newRel,relPathParts[i]);
    }
    fullPathInfo.success = true;
    fullPathInfo.fullPath = path.join(newBase,newRel);

    return fullPathInfo;

  }
  static GetRelPath(pathInfo) {
    /* pathInfo:
    isRelPath (bool)
    fromPath (string)
    toPath (string)
    */
    let relPathInfo = {};
    try {
      let relPath = '';
      if (pathInfo.isRelPath) {
        let basePath = path.join(require(settingsModulePath).Read('worldDirectory'),require(settingsModulePath).Read('currentWorld'));
        pathInfo.fromPath = path.join(basePath, pathInfo.fromPath);
        pathInfo.toPath = path.join(basePath, pathInfo.toPath);
      }
      let fromPathParts = pathInfo.fromPath.split(path.sep);
      let toPathParts = pathInfo.toPath.split(path.sep);
      let divergeIndex = (pathInfo.fromPath==pathInfo.toPath ? toPathParts.length-1 : 0);
      for (let i=0; i<toPathParts.length; i++) {
        if (fromPathParts[i]!=toPathParts[i]) {
          divergeIndex = i;
          break; //stop iterating
        }
      }

      for (let i=divergeIndex; i<fromPathParts.length-1; i++) {
        relPath += '../';
      }
      let divergeTo = '';
      for (let i=divergeIndex; i<toPathParts.length; i++) {
        divergeTo = (divergeTo!='' ? divergeTo + '/' : '') +toPathParts[i];
      }
      relPath += divergeTo;
      relPathInfo.success = true;
      relPathInfo.relPath = relPath;
    }
    catch(e) {
      relPathInfo.success = false;
      relPathInfo.message = e;
    }
    return relPathInfo;
  }

}