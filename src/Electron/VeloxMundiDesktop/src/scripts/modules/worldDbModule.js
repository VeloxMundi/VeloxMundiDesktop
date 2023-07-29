const {app, dialog, BrowserWindow, webContents} = require('electron');
const fs = require('fs');
const fse = require('fs-extra');
let path = require('path');

// Custom Modules
const configManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'configModule.js'));
const fileManager = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'fileManagerModule.js'));
let settingsModulePath = path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'settingsModule.js');
let dataModulePath = path.join(app.getAppPath() , 'src', 'scripts', 'modules', 'dataModule.js');

module.exports = {
  Invoke: (event, method, data) => {
    switch(method) {      
      case 'CheckWorldDb':
        return CheckWorldDb();
      case 'CheckConfigDb':
        return CheckConfigDb();
      case 'GetPageData':
        return GetPageData(data);
      case 'SavePageData':
        return SavePageData(data);
      default:
        event.sender.send('Invalid method call: "' + method + '"');
        break;
    }
  },


  GetPageData: async(worldPath) => {
    let pageData = await require(dataModulePath).DbGet({
      query: `SELECT * FROM pages WHERE worldPath=$worldPath`,
      params: {
        $worldPath: worldPath
      }
    });
    let linkedPages = await require(dataModulePath).DbAll({
      query: `SELECT worldPath FROM pages
              INNER JOIN links ON pages.id=links.toPageId
              WHERE fromPageId=$thisPageId`,
      params: {
        $thisPageId: pageData.id
      }
    });
    pageData.outgoingLinks = [];
    for (let i=0; i<linkedPages.length; i++){
      pageData.outgoingLinks.push(linkedPages[i].worldPath);
    }
    return pageData;
  },
  
  SavePageData: async(pageData) => {
    let x = 1;
    let paramData = {};
    paramData.$id = pageData.id;
    paramData.$name = pageData.name;
    paramData.$nameDisambiguation = pageData.nameDisambiguation;
    paramData.$fileType = pageData.fileType;
    paramData.$worldPath = pageData.worldPath;
    paramData.$created = pageData.created;
    await require(dataModulePath).DbRun({
      query: `INSERT OR REPLACE INTO pages 
              (id, name, nameDisambiguation, fileType, worldPath, created, saved)
              VALUES
              ($id, $name, $nameDisambiguation, $fileType, $worldPath, COALESCE($created, datetime('now')), datetime('now'))
              `,
      params: paramData
    });

    if (!pageData.outgoingLinks) {
      pageData.outgoingLinks = [];
    }
    await require(dataModulePath).DbRun({
      query: `DELETE FROM links WHERE fromPageId='${pageData.id}'`
    });
    for (let i=0; i< pageData.outgoingLinks.length; i++) {
      let toPage = await require(dataModulePath).DbGet({
        query : `
          SELECT id FROM pages WHERE worldPath = $name
          `,
        params: {
          $name : pageData.outgoingLinks[i].replace(/%20/g,' ')
        }
      });
      if (toPage && toPage.id && toPage.id>0) {
        await require(dataModulePath).DbRun({
          query: `
            INSERT OR REPLACE INTO links
            (fromPageId, toPageId)
            VALUES
            ($fromId, $toId)
            `,
          params: {
            $fromId : pageData.id,
            $toId : toPage.id
          }
        });
      }
    }
  }  
}


async function CheckConfigDb() {
  let ret = {
    success : true,
    errors : []
  };
  try {
    // Create worldConfig table if needed      
    await require(dataModulePath).CreateTable('config','worldConfig');
  }
  catch(e) {
    ret.success = false;
    ret.message = e.message;
    ret.errors.push(e);
  }
  finally {
    return ret;
  }
}
async function CheckWorldDb() {
  // Used when switching world to verify db exists and contains all tables. In the future may be used to upgrade database when the application is updated.
  let ret = {
    success : true,
    errors : []
  }
  try {
    // Create world table if needed      
    await require(dataModulePath).CreateTable('world','world');
    
    // Check DB version
    let appVer = app.getVersion();
    let dbVer=undefined;
    let checkVer = await (require(dataModulePath).DbGet({
      dbName : 'world',
      query : 'SELECT value FROM world WHERE key=$key', 
      params : {
        $key : 'appVersion'
      }
    }));
    if (checkVer && checkVer.value && checkVer.value!='') {
      dbVer = checkVer.value;
    }
    else {
      await require(dataModulePath).DbRun({
        dbName : 'world',
        query : `INSERT INTO world 
        (key, value) 
        VALUES
        ($key, $value)
        `,
        params : {
          $key : 'appVersion',
          $value : appVer
        }
      });
      dbVer = appVer;
    }

    // Placeholder for db upgrades
    if (dbVer && dbVer!=appVer) {
      let upg = true;
    }

    // Check worldDirName matches selected world directory
    let curDir = require(settingsModulePath).Read('currentWorldPath').split(path.sep).pop();
    let dbDir = undefined;
    let dirRow = await require(dataModulePath).DbGet({
      dbName : 'world',
      query : `SELECT value FROM world WHERE key=$key`,
      params : {
        $key : 'worldDirName'
      }
    });

    if (dirRow && !dirRow.value) {
      // Add current directory name to table
      await require(dataModulePath).DbRun({
        dbName : 'world',
        query : `INSERT INTO world
          (key, value)
          VALUES
          ($key, $value)
          `,
        params : {
          $key : 'worldDirName',
          $value : curDir
        }
      });
      dbDir = curDir;
    }
    else if (dirRow && dirRow.value && dirRow.value!='') {
      dbDir = dirRow.value;
    }
    else {
      dbDir = '';
    }

    if (dbDir && dbDir!=curDir) {
      // Update worldDirName to current world directory
      await require(dataModulePath).DbRun({
        dbName : 'world',
        query : `UPDATE world
        SET value=$value
        WHERE key=$key
        `,
        params : {
          $key : 'worldDirName',
          $value : curDir
        }
      });
    }

    // Check worldName and set if missing
    let worldNameRow = await require(dataModulePath).DbGet({
      dbName : 'world',
      query : `SELECT value FROM world WHERE key=$key`,
      params : {
        $key : 'worldName'
      }
    });

    if (worldNameRow && !worldNameRow.value) {
      // Set worldName to current directory name
      await require(dataModulePath).DbRun({
        dbName : 'world',
        query : `INSERT INTO world
          (key, value)
          VALUES
          ($key, $value)  
        `,
        params : {
          $key : 'worldName',
          $value : curDir
        }
      });
    }

    // Create pages table if needed
    await require(dataModulePath).CreateTable('world','pages');
    await require(dataModulePath).CreateTable('world', 'links');
    

  }
  catch(e) {
    ret.success = false;
    ret.message = e.message;
    ret.errors.push(e);
  }
  return ret;
}

