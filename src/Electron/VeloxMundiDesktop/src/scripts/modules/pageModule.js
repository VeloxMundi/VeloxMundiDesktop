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
      default:
        return null;
        break;
    }
  }
}