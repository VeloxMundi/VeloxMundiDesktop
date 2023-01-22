const { deepStrictEqual } = require('assert');
const { triggerAsyncId } = require('async_hooks');
const { hasSubscribers } = require('diagnostics_channel');
const {app, dialog, BrowserWindow} = require('electron');
const { file } = require('electron-settings');
const fs = require('fs');
let path = require('path');
const { config } = require('process');


// Custom Modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));
//configManager.InitPath(path.join(app.getAppPath(), 'user', 'config.json'), path.join(app.getAppPath(), 'data'));
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
      case 'GetPagePath':
        return this.GetPagePath(data);
        break;
      case 'SetSaveAsName':
        this.SetSaveAsName(event, data);
        break;
      case 'DeletePage':
        return this.DeletePage(data);
        break;
      case 'RenamePage':
        return this.RenamePage(data);
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

  static SavePage(pageInfo) {
    try {
      fs.writeFileSync(pageInfo.pagePath, pageInfo.pageContents);
      let pathParts = pageInfo.pagePath.split(path.sep);
      let htmlPath = pathParts[0];
      for (let i=1; i<pathParts.length-2; i++) {
        htmlPath = path.join(htmlPath, pathParts[i]);
      }
      let fileName = '';
      let fileParts = pageInfo.pagePath.split(path.sep).pop().split('.');
      for (let i=0; i<fileParts.length-1; i++) {
        fileName += fileParts[0];
      }
      htmlPath = path.join(htmlPath, 'html');
      if (!fs.existsSync(htmlPath)) {
        fs.mkdirSync(htmlPath);
      }
      htmlPath = path.join(htmlPath, fileName + '.html');      
      fs.writeFileSync(htmlPath, pageInfo.pageHTML);
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

  static SetSaveAsName(event, data) {
    //TODO: Check if file name is acceptable before saving
    let worldPath = configManager.ReadKey('WorldDirectory');
    let currentWorld = configManager.ReadKey('CurrentWorld');
    let savePath = path.join(worldPath, currentWorld, 'md', data.fileName + '.md');
    let saveAs = '';
    if (data.action=='Save') {
      if (data.fileName=='') {
        saveAs = {
          'success': false,
          'message': 'File name was not specified. File has not been saved.'
        };
      }
      else {
        if (fs.existsSync(savePath)) {
          SaveAs = {
            'success': false,
            'message': 'File already exists. File has not been saved.'
          };
        }
        else {
          saveAs = {
            'success': true, 
            'path': savePath,
            'message' : ''
          };
        }
      }
    }
    else {
      saveAs = {
        'success': false,
        'message': ''
      };
    }
    event.sender.send('SaveAsPath', saveAs);
  }

  static DeletePage(pageName) {    
    let worldPath = configManager.ReadKey('WorldDirectory');
    let currentWorld = configManager.ReadKey('CurrentWorld');
    let mdPagePath = path.join(worldPath, currentWorld, 'md', pageName + '.md');
    let htmlPagePath = path.join(worldPath, currentWorld, 'html', pageName + '.html');
    try {
      if (fs.existsSync(mdPagePath)) {
        fs.unlinkSync(mdPagePath);
        // We only delete the HTML page if the MD page is deleted because the MD is the master file(??)
        if (fs.existsSync(htmlPagePath)) {
          fs.unlinkSync(htmlPagePath);
        }
        return {
          'success': true
        };
      }
      else {
        return {
          'success': false,
          'message': 'File "' + mdPagePath + '" was not found.'
        };
      }
    }
    catch(e) {
      return {
        'success': false, 
        'message': 'There was a problem deleting the file.<br/>' + e
      };
    }
  }

  static RenamePage(pageData) {
    let worldPath = configManager.ReadKey('WorldDirectory');
    let currentWorld = configManager.ReadKey('CurrentWorld');
    let oldMdPagePath = path.join(worldPath, currentWorld, 'md', pageData.oldPageName + '.md');
    let oldHtmlPagePath = path.join(worldPath, currentWorld, 'html', pageData.oldPageName + '.html');
    let newMdPagePath = path.join(worldPath, currentWorld, 'md', pageData.newPageName + '.md');
    let newHtmlPagePath = path.join(worldPath, currentWorld, 'html', pageData.newPageName + '.html');
    if (fs.existsSync(newMdPagePath)) {
      return {
        'success': false,
        'message': 'File "' + pageData.newPageName + '" already exists. Page was not renamed.'
      };
    }
    else {
      let retVal = {
        'success': false,
        'message': '',
        'saveOnReturn': false,
        'newPagePath': newMdPagePath
      };
      try {
        fs.renameSync(oldMdPagePath, newMdPagePath, function(err) {
          if (err) {
            retVal.success = false;
            retVal.message = 'Unable to rename ' + pageData.oldPageName + '.<br/>' + err;
            return retVal;
          }
        });
        try {
          fs.renameSync(oldHtmlPagePath, newHtmlPagePath, function(err) {
            let x = 1;
            if (err) {
              retVal.message += 'The main page was renamed successfully, but there was a problem renaming the output page. ';
              try {
                fs.unlinSynck(oldHtmlPagePath);
                fs.unlinkSync(newHtmlPagePath);
                retVal.message += 'Removed output pages for both old and new output files.';
                return retVal;
              }
              catch(e) {
                retVal.message += 'Try re-saving this page to generate a new output page.';
                retVal.saveOnReturn = true;
                return retVal;
              }
            }
          }); 
          retVal.success=true; 
          return retVal;
        }
        catch(e) {
          retVal.success=true,
          retVal.saveOnReturn = true;
          return retVal;
        }      
      }
      catch(e) {
        retVal.success = false;
        retVal.message += 'Unable to save file.<br/>' + e;
        retVal.saveOnReturn = false;
        return retVal;
      }
    }
  }

  static GetPagePath(pageName) {
    let baseDir = configManager.ReadKey('WorldDirectory');
    let worldDir = path.join(baseDir, configManager.ReadKey('CurrentWorld'));
    let pagePath = '';
    let editor = configManager.ReadUserPref('editorStyle');
    switch(editor) {
      case 'RTE':
        pagePath = path.join(worldDir, 'html', pageName + '.html');
        break;
      case 'MD':
        pagePath = path.join(worldDir, 'md', pageName + '.md');
        break;
      default:
        pagePath = path.join(worldDir, pageName);
        break;
    }
    if (fs.existsSync(pagePath)) {
      return {
        success: true,
        path: pagePath
      };
    }
    else {
      return {
        success: false,
        message: "Unable to find page \"" + pagePath + "\"."
      };
    }
  }

}