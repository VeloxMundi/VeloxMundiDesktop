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
let modal = null;
let saveAsEvent = null;


module.exports = class ConfigManager {
  constructor() {
    this.configpath = "";
  }

  static Invoke(event, method, data) {
    switch(method) {      
      case 'ReadPage':
        return this.ReadPage(data);
        break;
      case 'SavePage':
        return this.SavePage(data);
        break;
      case 'GetPagePath':
        return this.GetPagePath(data);
        break;
      default:
        return null;
        break;
    }
  }
  
  
  static ReadPage(pagePath) {
    let pageContents = '';
    let editorStyle=configManager.ReadUserPref('editorStyle')
    switch(editorStyle) {
      case 'RTE':
        let html = fileManager.ReadFileToString(pagePath);
        html = this.tweakHTML('read', html);
        return html;
        break;
      default:
        return fileManager.ReadFileToString(pagePath);
        break;
    }
    return pageContents;
  }
  
  static SavePage(pageInfo) {
    try {
      let pathParts = pageInfo.pagePath.split(path.sep);
      let basePath = pathParts[0];
      for (let i=1; i<pathParts.length-2; i++) {
        basePath = path.join(basePath, pathParts[i]);
      }
      let fileName = '';
      let fileParts = pageInfo.pagePath.split(path.sep).pop().split('.');
      for (let i=0; i<fileParts.length-1; i++) {
        fileName += fileParts[0];
      }
      let htmlPath = path.join(basePath, 'html');
      let mdPath = path.join(basePath, 'md');
      if (!fs.existsSync(htmlPath)) {
        fs.mkdirSync(htmlPath);
      }
      if (!fs.existsSync(mdPath)) {
        fs.mkdirSync(mdPath);
      }
      mdPath = path.join(mdPath, fileName + '.md');
      fs.writeFileSync(mdPath, pageInfo.pageContents);

      htmlPath = path.join(htmlPath, fileName + '.html');      
      fs.writeFileSync(htmlPath, this.tweakHTML('save', pageInfo.pageHTML));
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

  static tweakHTML(action, html) {
    let basePath = path.join(configManager.ReadKey('WorldDirectory'), configManager.ReadKey('CurrentWorld'));
    let baseImgPath = path.join(basePath, 'html', 'assets');
    let dom = null;
    switch(action) {
      case 'read':
        dom = new jsdom.JSDOM(html);
        break;
      case 'save':
        dom = new jsdom.JSDOM(`<!DOCTYPE html><body>${html}</body>`);
        break;
    }
    let jquery = require('jquery')(dom.window);
    let imgs = jquery('img');
    for (let i=0; i<imgs.length; i++) {
      let oldSrc = jquery(imgs[i]).attr('src');
      switch(action) {
        case 'save':
          if (oldSrc.indexOf(baseImgPath)!=-1) {
            let newSrc = oldSrc.replace(baseImgPath,'assets');
            jquery(imgs[i]).attr('src',newSrc.replace('\\\\','/'));
            jquery(imgs[i]).addClass('image-local');
          }
          break;
        case 'read':
          let relAssets = 'assets';
          if (oldSrc.startsWith(relAssets + path.sep) || oldSrc.startsWith(relAssets + '/')) {
            let newSrc = oldSrc.replace('/', path.sep).replace(relAssets, baseImgPath);
            jquery(imgs[i]).attr('src',newSrc.replace('\\\\','/'));
            jquery(imgs[i]).addClass('image-local');
          }
          break;
      }
      
    }
    
    switch(action) {
      case 'save':
        html = `<!DOCTYPE html><html><head>\r\n`
            + `  <link rel="stylesheet" href="css/default.css">\r\n`
            + `  <link rel="stylesheet" href="css/user.css">\r\n`
            + `</head>\r\n<body>\r\n`
            + fileManager.ReadFileToString(path.join(basePath, 'templates', 'header.html'))
            + jquery('body').html()
            + fileManager.ReadFileToString(path.join(basePath, 'templates', 'footer.html'))
            + `\r\n</body>\r\n</html>`;
        break;
      default:
        html = jquery('body').html();
        break;
    }
    return html;
    
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