const {app, dialog} = require('electron');
var fs = require('fs-extra');
let path = require('path');
let mv = require('mv');
const { config } = require('process');


// Custom Modules
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));

// Custom Variables
let windowState;
const userData = (app.isPackaged ? path.join(app.getPath('userData')) : path.join(app.getAppPath(), 'user'));
let configPath = path.join(userData, 'config.json');
let settingsModulePath = path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'settingsModule.js');

// Default Preferences (So they will never be returned blank)
let dPrefs = {};

module.exports = class ConfigManager {
  constructor() {
  }

  static Invoke(event, method, data) {
    if (!fs.existsSync(configPath)) {
      throw ('User configuration file is missing from "' + configPath + '"');
    }
    switch(method) {
      case 'SetPage':
        this.SetPage(data);
        break;
      case 'ReadKey':
        return this.ReadKey(data, event);
        break;
      case 'WriteKey':
        this.WriteKey(data[0], data[1]);
        break;
      case 'ReadUserPref':
        return this.ReadUserPref(data);
        break;
      case 'ReadAllUserPrefs':
        return this.ReadAllUserPrefs();
        break;
      case 'WriteUserPref':
        return this.WriteUserPref(data[0], data[1]);
        break;
      case 'WriteAllUserPrefs':
        return this.WriteAllUserPrefs(data);
        break;
      case 'SelectWorldDirectory':
        return this.SelectWorldDirectory();
        break;      
      case 'MoveWorldDirectory':
        return this.MoveWorldDirectory();
        break;
      default:
        event.sender.send('Invalid');
        break;
    }
    return null;
  }


  static InitPath(config, data) {
    configPath = config;    
    this.dataPath = data;
    let dConfigData = fs.readFileSync(path.join(this.dataPath, 'defaultConfig.json'));
    if (dConfigData!='') {
      dPrefs = JSON.parse(dConfigData);
    }
    if (!fs.existsSync(configPath))
    {
      /*
      let date = Date.now();
      let data = {
        "AppName" : "Velox Mundi",
        "ConfigCreated" : new Date(Date.now()).toLocaleString(),
        "WorldDirectory" : path.resolve('user/Worlds'), //TODO Make this blank and trigger setup if it is blank somehow
        "CurrentWorld" : "",
        "CurrentPage" : "index.html"
      };
      let config = fileManager.WriteFile(configPath, JSON.stringify(data));
      */
    }
  }


  static GetPath() {
    return configPath;
  }

  static GetPage() {
    let currentPage = require(settingsModulePath).Read('currentPage');
    if (!currentPage) {
      return ['appSetup.html',{}];
    }
    else {
      let pieces = currentPage.split('?');
      let query = {};
      if (pieces.length>1)
      {
        let params = (decodeURIComponent(pieces[1]).split('&'));
        for (let i=0; i<params.length; i++) {
          let param = params[i].split('=');
          query[param[0]] = param[1];
        }
      }
      return [pieces[0], query];
    }



    if (!fs.existsSync(configPath)) {
      return ['appSetup.html', {}];
    }

    let page = this.ReadKey('CurrentPage');
    if (page && page!='') {
      let pieces = page.split('?');
      let query = {};
      if (pieces.length>1)
      {
        let params = (decodeURIComponent(pieces[1]).split('&'));
        for (let i=0; i<params.length; i++) {
          let param = params[i].split('=');
          query[param[0]] = param[1];
        }
      }
      return [pieces[0], query];
    }
    else {
      return [
        'index.html',
        {}];
    }
  }

  static SetPage(page) {
    if (page.toLowerCase()=='XXedit.html') {
      page='worldHome.html';
    }
    require(settingsModulePath).Write('currentPage', page);
  }


  static ReadKey(key, event) { 
    
    let keyval = require(settingsModulePath).Read(key);
    return keyval;
    if (keyval) {
      let x = keyval;
    }
    let rawdata = fs.readFileSync(configPath);
    if (rawdata!='') {
      let data = JSON.parse(rawdata);
      if (key.toLowerCase()=='prefs') {
        for (let i=0; i<Object.keys(dPrefs).length; i++) {
          let prefKey = Object.keys(dPrefs)[i];
          if (!data[key]) {
            data[key] = dPrefs;
          }
          if (!data[key][prefKey]) {
            data[key][prefKey]=dPrefs[prefKey];
          }
        }
      }
      if (data[key] && data[key].length==1) {
        return data[key].toString();
      }
      else {
        return data[key];
      }

    }
    else {
      return '';
    }
    
  }

  static WriteKey(key, value) {
    require(settingsModulePath).Write(key, value);
    return;
    let data = {};
    if (fs.existsSync(configPath)) {
      let rawdata = fs.readFileSync(configPath);
      if (rawdata != '') {
        data = JSON.parse(rawdata);
      }
    }
    data[key] = value;
    data['ConfigUpdated'] = new Date(Date.now()).toLocaleString();
    fileManager.WriteFile(configPath, JSON.stringify(data, null, 2));
  }

  static WriteUserPref(key, value) {
    require(settingsModulePath).Write('prefs.' + key, value);
    /*
    try {
      let data = {};
      if (fs.existsSync(this.dataPath)) {
        let rawdata = fs.readFileSync(configPath);
        if (rawdata != '') {
          data = JSON.parse(rawdata);
        }
      }
      if (!data['prefs']) {
        data['prefs'] = {};
      }
      for (var pref in data.prefs) {
        if (pref==key) {
          data.prefs[key]=value;
        }
      }
      data['ConfigUpdated'] = new Date(Date.now()).toLocaleString();
      fileManager.WriteFile(configPath, JSON.stringify(data, null, 2));
      return {
        success: true
      };
    }
    catch(e) {
      return {
        success: false,
        message: 'Unable to save preference.<br/>' + e
      };
    }
    */
  }

  static WriteAllUserPrefs(newPrefs) {
    try {
      // Read existing prefs
      let rawdata = fs.readFileSync(configPath);
      if (rawdata!='') {
        let data = JSON.parse(rawdata);
        if (!data['prefs']) {
          data['prefs'] = dPrefs;
        }
        for (let i=0; i<Object.keys(dPrefs).length; i++) {
          let prefKey = Object.keys(dPrefs)[i];
          if (!data['prefs'][prefKey]) {
            data['prefs'][prefKey]=dPrefs[prefKey];
          }
        }
        // Write new prefs over existing prefs
        for (let i=0; i<Object.keys(newPrefs).length; i++) {
          let prefKey = Object.keys(newPrefs)[i];
          data.prefs[prefKey]=newPrefs[prefKey];

          
          require(settingsModulePath).Write('prefs.' + prefKey, newPrefs[prefKey]);
        }
        data['ConfigUpdated'] = new Date(Date.now()).toLocaleString();
        fileManager.WriteFile(configPath, JSON.stringify(data, null, 2));
        return {
          success: true
        };
      }
      else {
        return {
          success: false,
          message: 'Unable to read configuration to get user preferences.'
        };
      }

    }
    catch(e) {
      return {
        success: false,
        message: 'Unable to save preference.<br/>' + e
      };
    }
  }

  static ReadUserPref(key) {
    let rawdata = fs.readFileSync(configPath);
    if (rawdata!='') {
      let data = JSON.parse(rawdata);
      if (!data['prefs']) {
        data['prefs'] = dPrefs;
      }
      for (let i=0; i<Object.keys(dPrefs).length; i++) {
        let prefKey = Object.keys(dPrefs)[i];
        if (!data['prefs'][prefKey]) {
          data['prefs'][prefKey]=dPrefs[prefKey];
        }
      }
      return data['prefs'][key];
    }
    else {
      return undefined;
    }
  }

  static ReadAllUserPrefs() {
    try {
      let rawdata = fs.readFileSync(configPath);
      if (rawdata!='') {
        let data = JSON.parse(rawdata);
        if (!data['prefs']) {
          data['prefs'] = dPrefs;
        }
        for (let i=0; i<Object.keys(dPrefs).length; i++) {
          let prefKey = Object.keys(dPrefs)[i];
          if (!data['prefs'][prefKey]) {
            data['prefs'][prefKey]=dPrefs[prefKey];
          }
        }
        return {
          success: true,
          prefs: data.prefs
        };
      }
      else {
        return {
          success: false,
          message: 'Unable to read configuration to get user preferences.'
        };
      }
    }
    catch(e) {
      return {
        'success': false,
        'message': e
      };
    }
  }


  static RemoveKey(key) {
    let data = {};
    if (fs.existsSync(configPath)) {
      let rawdata = fs.readFileSync(configPath);
      if (rawdata != '') {
        data = JSON.parse(rawdata);
      }
    }
    delete data[key];
    data['ConfigUpdated'] = new Date(Date.now()).toLocaleString();
    fileManager.WriteFile(configPath, JSON.stringify(data, null, 2));
  }

  static ReadAll() {
    let rawdata = fs.readFileSync(configPath);
    if (rawdata!='') {
      let data = JSON.parse(rawdata);
      return data;
    }
    else {
      return '';
    }
  }






  static SelectWorldDirectory() {
    var directory = dialog.showOpenDialogSync({ properties: ['openDirectory']});
    if (directory) {
      require(settingsModulePath).Write('worldDirectory', directory[0]);
      require(settingsModulePath).Write('currentWorld','');
      return directory[0];
      /*
        this.WriteKey('WorldDirectory',directory[0]);
        this.WriteKey('CurrentWorld', '');
        return directory[0];
      */
    }
    else {
        return '';
    }
  }

  static MoveWorldDirectory() {
    let oldDirectory = this.ReadKey('WorldDirectory');
    if (oldDirectory) {
        let newDirectory = dialog.showOpenDialogSync({ properties: ['openDirectory']});
        if (newDirectory) {
          if (newDirectory[0]!=oldDirectory)
          {
            try {
              this.copyDir(oldDirectory, newDirectory[0]);
            }
            catch(e) {
              fs.rmSync(newDirectory[0], {recursive: true, force: true});
              return [false, 'ERROR ' + e];
            }
            require(settingsModulePath).Write('worldDirectory',newDirectory[0]);
            fs.rmSync(oldDirectory, {recursive: true, force: true});
            return [true, newDirectory[0]];
          }
          else {
            return [false, 'Source and destination directories cannot be the same'];
          }
        }
        else {
          return [false,'Destination directory was not specified'];
        }
    }
    else {
        return [false, 'Source directory was not specified'];
    }
  }



  /* Moving directories */
  /*
static mkdir(dir) {
  // making directory without exception if exists
  try {
    fs.mkdirSync(dir, 0755);
  } catch(e) {
    if(e.code != "EEXIST") {
      throw e;
    }
  }
};
*/


static copyDir(src, dest) {
  //this.mkdir(dest);
  var files = fs.readdirSync(src);
  for(var i = 0; i < files.length; i++) {
    var current = fs.lstatSync(path.join(src, files[i]));
    if(current.isDirectory()) {
      this.copyDir(path.join(src, files[i]), path.join(dest, files[i]));
    } else if(current.isSymbolicLink()) {
      var symlink = fs.readlinkSync(path.join(src, files[i]));
      fs.symlinkSync(symlink, path.join(dest, files[i]));
    } else {
      fs.copySync(path.join(src, files[i]), path.join(dest, files[i]), {overwrite: true});
    }
  }
};
}


