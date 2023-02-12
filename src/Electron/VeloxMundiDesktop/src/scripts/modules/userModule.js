const {app, dialog, BrowserWindow, webContents} = require('electron');
let path = require('path');

/*
const { file } = require('electron-settings');
const fs = require('fs');
const fse = require('fs-extra');
const { config } = require('process');
const jsdom = require('jsdom');
*/


// Custom Modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));


module.exports = class UserModule {
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