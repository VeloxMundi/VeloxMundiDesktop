var fs = require('fs');
let path = require('path');
let FileManager = require('./filemanager');
let TimeStamp = require('./timestamp');

module.exports = class ConfigManager {
  constructor() {
    this.configpath = "";
  }

  static SetPath(mypath) {
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
      let config = FileManager.WriteFile(this.configpath, JSON.stringify(data));
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
    FileManager.WriteFile(this.configpath, JSON.stringify(data));
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

