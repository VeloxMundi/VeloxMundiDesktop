var fs = require('fs');
let path = require('path');
const appConfig = require('electron-settings');

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
        this.GetPath(event);
        break;
      case 'Two-Way':
        this.GetPath(event);
        return 'RetVal';
        break;
      case 'GetPath':
        this.GetPath(event);
        break;
      case 'SelectWorldDirectory':
        this.GetPath(event);
        break;
      default:
        event.sender.send('Invalid');
        break;
    }
    return null;
  }


  
  static GetPath(event) {
    //event.sender.send('fromMain', 'config', 'GetPath', 'data1');
  }
}