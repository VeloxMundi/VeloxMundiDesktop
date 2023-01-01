const {app, dialog} = require('electron');
var fs = require('fs-extra');
let path = require('path');
let mv = require('mv');

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
      case 'MoveWorldDirectory':
        return this.MoveWorldDirectory();
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
        "ConfigCreated" : new Date(Date.now()).toLocaleString(),
        "WorldDirectory" : path.resolve('user/Worlds'),
        "CurrentWorld" : ""
      };
      let config = fileManager.WriteFile(this.configpath, JSON.stringify(data));
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

          //return newDirectory[0];
        }
        else {
          return [false,'Unable'];
        }
    }
    else {
        return [false, 'Can\'t'];
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


