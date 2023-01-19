const {app, dialog} = require('electron');
var fs = require('fs-extra');
let path = require('path');
let mv = require('mv');

// Custom Modules
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));

// Custom Variables
let windowState;

// Default Preferences (So they will never be returned blank)
let dPrefs = {};


module.exports = class ConfigManager {
  constructor() {
    this.configPath = "";
    this.dataPath = "";
  }

  static InvokeConfig(event, method, data) {
    if (!fs.existsSync(this.configPath)) {
      throw ('User configuration file is missing from "' + this.configPath + '"');
    }
    switch(method) {
      case 'SetPage':
        this.SetPage(data);
        break;
      case 'ReadKey':
        return this.ReadKey(data);
        break;
      case 'WriteKey':
        this.WriteKey(data[0], data[1]);
        break;
      case 'ReadUserPref':
        return this.ReadUserPref(data);
        break;
      case 'GetAllUserPrefs':
        try {
          let uprefs = fs.readFileSync(path.join(this.dataPath, 'defaultConfig.json'));
          if (uprefs!='') {
            uprefs = JSON.parse(uprefs);
            return {
              'success': true,
              'prefs': uprefs
            };
          }
          else {
            return {
              'success': false,
              'message': 'No preferences were found.'
            };
          }
        }
        catch(e) {
          return {
            'success': false,
            'message': e
          };
        }
        break;
      case 'WriteUserPref':
        this.WriteUserPref(data[0], data[1]);
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
    this.configPath = config;    
    this.dataPath = data;
    let dConfigData = fs.readFileSync(path.join(this.dataPath, 'defaultConfig.json'));
    if (dConfigData!='') {
      dPrefs = JSON.parse(dConfigData);
    }
    if (!fs.existsSync(this.configPath))
    {
      let date = Date.now();
      let data = {
        "AppName" : "Velox Mundi",
        "ConfigCreated" : new Date(Date.now()).toLocaleString(),
        "WorldDirectory" : path.resolve('user/Worlds'), //TODO Make this blank and trigger setup if it is blank somehow
        "CurrentWorld" : "",
        "CurrentPage" : "index.html"
      };
      let config = fileManager.WriteFile(this.configPath, JSON.stringify(data));
    }
  }


  static GetPath() {
    return this.configPath;
  }

  static GetPage() {
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
      return 'index.html';
    }
  }

  static SetPage(page) {
    if (page.toLowerCase()=='XXedit.html') {
      page='worldHome.html';
    }
    this.WriteKey('CurrentPage', page);
  }


  static ReadKey(key) { 
    let rawdata = fs.readFileSync(this.configPath);
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
    let data = {};
    if (fs.existsSync(this.configPath)) {
      let rawdata = fs.readFileSync(this.configPath);
      if (rawdata != '') {
        data = JSON.parse(rawdata);
      }
    }
    data[key] = value;
    data['ConfigUpdated'] = new Date(Date.now()).toLocaleString();
    fileManager.WriteFile(this.configPath, JSON.stringify(data, null, 2));
  }

  static WriteUserPref(key, value) {
    let data = {};
    if (fs.existsSync(this.dataPath)) {
      let rawdata = fs.readFileSync(this.configPath);
      if (rawdata != '') {
        data = JSON.parse(rawdata);
      }
    }
    if (!data['prefs']) {
      data['prefs'] = {};
    }
    data[prefs][key] = value;
    data['ConfigUpdated'] = new Date(Date.now()).toLocaleString();
    fileManager.WriteFile(this.configpath, JSON.stringify(data, null, 2));
  }

  static ReadUserPref(key) {
    let rawdata = fs.readFileSync(this.configpath);
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


  static RemoveKey(key) {
    let data = {};
    if (fs.existsSync(this.configpath)) {
      let rawdata = fs.readFileSync(this.configpath);
      if (rawdata != '') {
        data = JSON.parse(rawdata);
      }
    }
    delete data[key];
    data['ConfigUpdated'] = new Date(Date.now()).toLocaleString();
    fileManager.WriteFile(this.configpath, JSON.stringify(data, null, 2));
  }

  static ReadAll() {
    let rawdata = fs.readFileSync(this.configpath);
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
        this.WriteKey('WorldDirectory',directory[0]);
        return directory[0];
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
            this.WriteKey('WorldDirectory',newDirectory[0]);
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


