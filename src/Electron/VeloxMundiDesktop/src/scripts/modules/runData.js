const { remote, app } = require('electron');
const path = require('path');

// required modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));

// Consider using this to store a variety of information that gets re-evaluated over and over again. I'm thinking about storing paths to the world and all associated folders as well as configuration and database files.


let runData = {
  worldDirectory : configManager.ReadKey('WorldDirectory'),
  currentWorld : configManager.ReadKey('CurrentWorld'),
  currentWorldDirectory : path.join(configManager.ReadKey('WorldDirectory'), configManager.ReadKey('CurrentWorld')),
  editorStyle : configManager.ReadUserPref('editorStyle'),

};

module.exports = {
  readAllData: () => {
    return runData;
  },
  setAllData: (data) => {
    runData = data;
    return;
  },
  getRunData: (name) => {
    return runData[name];
  },
  setRunData: (name, value) => {
    if (runData.hasOwnProperty(name)) {
      runData[name] = value;
    }
    switch (name) {
      case 'WorldDirectory':
        runData.recalculateDirectories();
        break;
      case 'CurrentWorld':
        runData.recalculateDirectories();
        break;
      default:
        break;
    }
    return;
  },
  recalculateDirectories: () => {
    runData.CurrentWorldDirectory = path.join(this.WorldDirectory, this.CurrentWorld);
  }
}