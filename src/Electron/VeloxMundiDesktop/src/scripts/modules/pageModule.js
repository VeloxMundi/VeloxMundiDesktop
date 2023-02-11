const {app, dialog, BrowserWindow, webContents} = require('electron');
const { file } = require('electron-settings');
const fs = require('fs');
const fse = require('fs-extra');
let path = require('path');
const { config } = require('process');
const jsdom = require('jsdom');
const { triggerAsyncId } = require('async_hooks');



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
      htmlPath = path.join(htmlPath, fileName + '.html');


      fs.writeFileSync(mdPath, pageInfo.pageContents);   
      fs.writeFileSync(htmlPath, this.tweakHTML('save', pageInfo.pageHTML));
      try {
        this.AddPageToIndex(pageInfo.pagePath, true);
        return {
          'success': true, 
          'message': 'Saved file successfully!'
        };
      }
      catch(e) {
        return {
          'success': false, 
          'message': 'Page was saved, but page info was not added to index: ' + e
        };
      }
    }
    catch(e) {
      return {
        'success': false, 
        'message': 'Unable to save file: ' + e
      };
    }
  }

  static AddPageToIndex(pagePath, SaveNow) {
    // Set up variables
    let basePath = path.join(configManager.ReadKey('WorldDirectory'),configManager.ReadKey('CurrentWorld')) + path.sep;
    let baseHtmlPath = path.join(basePath, 'html');
    let pageRelPathParts = pagePath.replace(basePath,'').split(path.sep);
    let pageSavedAs = pageRelPathParts[0];
    let pageType = (pageRelPathParts.length==3 ? pageRelPathParts[1] || 0 : '');
    let pageFileName = pagePath.split(path.sep).pop();
    let pageName = '';
    let pageNameParts = pageFileName.split('.');
    for (let i=0; i<pageNameParts.length-1; i++) {
      pageName += pageNameParts[i] + (i==pageNameParts.length-2 ? '' : '.');
    }
    let pageRelPath = '';
    let olinks = [];
    let renamePage = false;
    for (let i=1; i<pageRelPathParts.length-1; i++) {
      pageRelPath += path.join(pageRelPath, pageRelPathParts[i]);
    }
    let pageHtmlPath = path.join(basePath, 'html', pageRelPath, pageName + '.html');
    let pageHtmlRelPath = pageHtmlPath.replace(basePath,'');
    let pageHTML = fs.readFileSync(pageHtmlPath).toString();

    // Read world index
    let indexPath = path.join(configManager.ReadKey('WorldDirectory'), configManager.ReadKey('CurrentWorld'),'index.json');
    let data = {
      worldName : configManager.ReadKey('CurrentWorld').replace(/([A-Z])/g, ' $1').replace(/([0-9][a-zA-Z])/g, ' $1').replace(/([a-z])([0-9])/g, '$1 $2').replace(/([_.])/g, ' ').trim(),
      worldDirName : configManager.ReadKey('CurrentWorld'),
      pages : []
    };
    if (!fs.existsSync(indexPath)) {
      fileManager.WriteFile(indexPath, JSON.stringify(data, null, 2));
    }
    let rawdata = fs.readFileSync(indexPath);
    if (rawdata != '') {
      data = JSON.parse(rawdata);
    }
    let thisPage = {
      Name : pageName,
      Type : pageType,
      Status : 'Active',
      RelPath : pageRelPath,
      HtmlRelPath : pageHtmlRelPath
    }
    if (SaveNow) {
      thisPage.Saved = new Date(Date.now()).toLocaleString();
      thisPage.SavedAs = pageSavedAs;
      try {
        let dom = new jsdom.JSDOM(`<!DOCTYPE html><body>${pageHTML}</body>`);
        let jquery = require('jquery')(dom.window);
        let $ = jquery;
        let lnks = $('a');
        $('a').each(function() {
          try {
            let ths = $(this);
            let href = decodeURIComponent(ths.attr('href'));
            let baseHref = decodeURIComponent('file:///' + baseHtmlPath) + path.sep;
            if (href.indexOf(baseHref)!=-1) {
              href = href.replace(baseHref,'');
              let existingO = olinks.indexOf(href);
              if (existingO==-1) {
                olinks.push(href);
              }
            }
          }
          catch(e) {
            let x = 1;
          }
        });
      } 
      catch(e) {
        // Fail silently if links cannot be indexed for some reason.
      }
      thisPage.OutgoingLinks = olinks;
    }
    
    if (!data.pages || data.pages.length==0) {
      data.pages = [thisPage];
    }
    for (let i=0; i<data.pages.length; i++) {
      if (data.pages[i].HtmlRelPath.toLowerCase()==pageHtmlRelPath.toLowerCase()) {
        data.pages[i] = thisPage;
      }
    }

    fileManager.WriteFile(indexPath, JSON.stringify(data, null, 2));

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