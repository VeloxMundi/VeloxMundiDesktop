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
const worldManager = require(path.join(app.getAppPath(), 'src','scripts', 'modules', 'worldModule.js'));
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
      case 'GetPageDataFromNameDisambiguation':
        return this.GetPageDataFromNameDisambiguation(data);
        break;
      case 'NewPageType':
        return this.NewPageType(data);
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
      case 'ChangePageEditor':
        return this.ChangePageEditor(data);
        break;
      case 'NewPage':
        this.NewPage(event);
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
      let basePath = path.join(configManager.ReadKey('WorldDirectory'),configManager.ReadKey('CurrentWorld'));
      
      /*
      let pathParts = pageInfo.pagePath.split(path.sep);
      let basePath = pathParts[0];
      for (let i=1; i<pathParts.length-2; i++) {
        basePath = path.join(basePath, pathParts[i]);
        }
      */
      let fileName = pageInfo.pageRelPath.split(path.sep).pop();

      let pageRelDir = '';
      let pageRelPathParts = pageInfo.pageRelPath.split(path.sep);
      for (let i=0; i<pageRelPathParts.length-1; i++) {
        pageRelDir = path.join(pageRelDir, pageRelPathParts[i]);
      }
      let htmlDir = path.join(basePath, 'html',pageRelDir);
      let mdDir = path.join(basePath, 'md', pageRelDir);
      if (!fs.existsSync(htmlDir)) {
        fs.mkdirSync(htmlDir);
      }
      if (!fs.existsSync(mdDir)) {
        fs.mkdirSync(mdDir);
      }
      let mdPath = path.join(mdDir, fileName + '.md');
      let htmlPath = path.join(htmlDir, fileName + '.html');


      fs.writeFileSync(mdPath, pageInfo.pageContents);   
      fs.writeFileSync(htmlPath, this.tweakHTML('save', pageInfo.pageHTML));
      try {
        this.AddPageToIndex(pageInfo.pageRelPath, true);
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
    let pageType = (pageRelPathParts.length==2 ? pageRelPathParts[0] || '' : '');
    let pageName = pagePath.split(path.sep).pop();
    let pageRelPath = '';
    let olinks = [];
    let renamePage = false;
    for (let i=0; i<pageRelPathParts.length-1; i++) {
      pageRelPath += path.join(pageRelPath, pageRelPathParts[i]);
    }
    pageRelPath = (pageRelPath!='' ? pageRelPath + path.sep : '') + pageName;
    let pageHtmlPath = path.join(basePath, 'html', pageRelPath + '.html');
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
      NameDisambiguation : pageName + (pageType=='' ? '' : ' (' + pageType + ')'),
      Status : 'Active',
      RelPath : pageRelPath,
      HtmlRelPath : pageHtmlRelPath
    }
    if (SaveNow) {
      thisPage.Saved = new Date(Date.now()).toLocaleString();
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
    
    let pageNameLower = pageName.toLowerCase();
    for (let i=0; i<data.pages.length; i++) {
      let dataPageNameLower = data.pages[i].Name.toLowerCase();
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

  static GetPagePath(pageRelPath) {
    let baseDir = configManager.ReadKey('WorldDirectory');
    let worldDir = path.join(baseDir, configManager.ReadKey('CurrentWorld'));
    let pagePath = '';
    let editor = configManager.ReadUserPref('editorStyle');
    pagePath = path.join(worldDir,'pages',pageRelPath + (editor=="MD" ? '.md' : '.html'));
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

  static GetPageDataFromNameDisambiguation(nameDisambiguation) {
    let worldData = worldManager.GetWorldData();
    try {
      let thisPage = worldData.pages.filter(function(p) {
        return p.NameDisambiguation==nameDisambiguation;
      });
      let pagePath = this.GetPagePath(thisPage[0].RelPath);
      if (thisPage.length==1) {
        return {
          success: true,
          data: thisPage[0],
          pageFullPath: (pagePath && pagePath.success ? pagePath.path : '')
        };
      }
      else if (thisPage.length<1) {
        return {
          success: false,
          message: 'There were no pages named "' + nameDisambiguation + '."'
        }
      }
      else {
        return {
          success: false,
          message: 'World data contains multiple pages named "' + nameDisambiguation + '."'
        };
      }
    }
    catch(e) {
      return {
        success: false,
        message: 'Unable to load world data: ' + e
      };
    }
  }

  static NewPageType(typeName) {
    let baseDir = path.join(configManager.ReadKey('WorldDirectory'),configManager.ReadKey('CurrentWorld'));
    let templateDir = path.join(basDir,'templates');
    let typeTemplatePathNoExt = path.join(templateDir,typeName);
    if (fs.existsSync(templateDir)) {
      
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
    let savePath = path.join(worldPath, currentWorld, 'pages', data.fileName);
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
    let pagePath = path.join(worldPath, currentWorld, 'pages', pageName);
    try {
      if (fs.existsSync(pagePath)) {
        fs.unlinkSync(pagePath);
        return {
          'success': true
        };
      }
      else {
        return {
          'success': false,
          'message': 'File "' + pagePath + '" was not found.'
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

  static NewPage(event) {
    switch(configManager.ReadUserPref('editorStyle'))
    {
      case 'MD':
        event.sender.send('navigate',path.join(app.getAppPath(), 'src','edit.html'));
        break;
      default: //RTE
        event.sender.send('navigate',path.join(app.getAppPath(), 'src','rtedit.html'));
        break;
    }
  }
  static ChangePageEditor(pageName) {

  }

  
}