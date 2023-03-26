const { remote, app } = require('electron');
const path = require('path');

// required modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));

// Consider using this to store a variety of information that gets re-evaluated over and over again. I'm thinking about storing paths to the world


let appData = {
  WorldDirectory : configManager.ReadKey('WorldDirectory'),
  CurrentWorld : configManager.ReadKey('CurrentWorld'),
  CurrentWorldDirectory : path.join(configManager.ReadKey('WorldDirectory'), configManager.ReadKey('CurrentWorld')),
  editorStyle : configManager.ReadUserPref('editorStyle'),

  recalculateDirectories : function() {
    this.CurrentWorldDirectory = path.join(this.WorldDirectory, this.CurrentWorld);
  }
};

module.exports = {
  readAllData: () => {
    return appData;
  },
  setAllData: (data) => {
    appData = data;
    return;
  },
  getRunData: (name) => {
    return appData[name];
  },
  setRunData: (name, value) => {
    if (appData.hasOwnProperty(name)) {
      appData[name] = value;
    }
    switch (name) {
      case 'WorldDirectory':
        appData.recalculateDirectories();
        break;
      case 'CurrentWorld':
        appData.recalculateDirectories();
        break;
      default:
        break;
    }
    return;
  }
}