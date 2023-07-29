const {app, dialog, BrowserWindow, webContents} = require('electron');
const { file } = require('electron-settings');
const fs = require('fs');
const fse = require('fs-extra');
let path = require('path');
const { config } = require('process');


// Custom Modules
const appPath = app.getAppPath();
const scriptPath = path.join(appPath, 'src', 'scripts');
const modulePath = path.join(scriptPath, 'modules');
const fileManagerPath = path.join(modulePath, 'fileManagerModule.js');
const configModulePath = path.join(modulePath, 'configModule.js');
let pageModulePath = path.join(modulePath, 'pageModule.js');
let dataModulePath = path.join(modulePath, 'dataModule.js');
let worldDbModulePath = path.join(modulePath, 'worldDbModule.js');


module.exports = class PublishModule {
  constructor() {
    
  }

  static async Invoke(event, method, data) {
    switch(method) {
      case 'GetPublishPath':
        return await this.GetPublishPath(event);
        break;
      default:
        event.sender.send('status', 'Invalid method call: "' + method + '"');
        break;
    }
  }


  static async GetPublishPath(event)
  {
    try {
      let worldName = require(configModulePath).Invoke(null, 'ReadKey', 'currentWorld');
      let worldConfig = await require(dataModulePath).DbGet({
        dbName: 'config',
        query: `SELECT exportPath FROM worldConfig
                WHERE worldName=$worldName
                `,
        params: {
          $worldName: worldName
        }
      });
      if (worldConfig && worldConfig.exportPath) {
        return worldConfig.exportPath;
      }
      else {
        event.sender.send('status', 'Unable to find export path for world "' + worldName + '"');
      }
    }
    catch(e) {
      event.sender.send('status', 'Unable to find PublishPath for world');
      return '';
    }
  }

}