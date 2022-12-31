const {app, dialog} = require('electron');
var fs = require('fs');
let path = require('path');

// Custom Modules
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));

// Custom Variables
let windowState;

module.exports = class ConfigManager {
  constructor() {
    this.configpath = "";
  }

  static InvokeConfig(event, method, data) {
    console.log('Method="' + method + '", data="' + data + '"')
    switch(method) {
      case 'One-Way':
        this.GetPath();
        break;
      case 'Two-Way':
        return this.GetPath();
        break;
      case 'ReadKey':
        return this.ReadKey(data);
        break;
      case 'SelectWorldDirectory':
        return this.SelectWorldDirectory();
        break;
      default:
        event.sender.send('Invalid');
        break;
    }
    return null;
  }


  static InitPath(mypath) {
    this.configpath = mypath;
    if (!fs.existsSync(this.configpath))
    {
      let date = Date.now();
      let data = {
        "AppName" : "Velox Mundi",
        "ConfigCreated" : TimeStamp.GetTimeStamp(),
        "WorldDirectory" : path.resolve('user/Worlds'),
        "CurrentWorld" : ""
      };
      let config = fileManager.WriteFile(this.configpath, JSON.stringify(data));
    }
  }

  static SelectWorldDirectory() {
    var directory = dialog.showOpenDialogSync({ properties: ['openDirectory']});
    if (directory.length = 1) {
        this.WriteKey('WorldDirectory',directory[0]);
        return directory[0];
    }
    else {
        return '';
    }
  }

  static GetPath() {
    return this.configpath;
  }


  static ReadKey(key) { 
    let rawdata = fs.readFileSync(this.configpath);
    if (rawdata!='') {
      let data = JSON.parse(rawdata);
      if (data[key].length==1) {
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
    if (fs.existsSync(this.configpath)) {
      let rawdata = fs.readFileSync(this.configpath);
      if (rawdata != '') {
        data = JSON.parse(rawdata);
      }
    }
    data[key] = value;
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
}