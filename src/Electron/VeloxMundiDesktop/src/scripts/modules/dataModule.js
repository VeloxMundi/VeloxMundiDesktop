
const { remote, app } = require('electron');
const fs = require('fs');
const sqljs = require('sql.js');
const sqlite3 = require('sqlite3').verbose();

const path = require('path');
let settingsModulePath = path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'settingsModule.js');
let functionsModulePath = path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'functionsModule.js');



module.exports = {
  Invoke: async (event, method, data) => {
    switch(method) {
      case 'CheckWorldDb':
        let x = await CheckWorldDb();
        /*
        .then((ver) => {
          return ver;
        });
        */
        return x;
        break;
      default:
        break;
    }
  },
  
};


function setErr(ret, err) {  
  ret.success = false;
  ret.message = err.message;
  ret.error.push (err);
}

async function CheckWorldDb() { 
  let ret = {};
  let val = await new Promise(async (resolve, reject) => {
    // Used when switching world to verify db exists and contains all tables. In the future may be used to upgrade database when the application is updated.

    let worldPath = require(settingsModulePath).Read('worldPath');
    if (!worldPath || worldPath=='') {
      ret.success = false;
      ret.message = 'Please select a valid world.';
    }
    try {
      let dbPath = path.join(worldPath, '_world.db');  
      let db = new sqlite3.Database(dbPath);

      let ver = '';
      
      await new Promise((resolve2, reject2) => {
        db.run('CREATE TABLE IF NOT EXISTS app (key TEXT, value TEXT, PRIMARY KEY (key, value));', function(err2) {
          if (err2) {
            reject(err2); // reject the entire function
          }
          else {
            resolve2();
          }
        });
      })
      .then(async () => {
        await new Promise(async (resolve3, reject3) => {
        db.get('SELECT value FROM app WHERE key=?', ['version'], async function(err3, retrow) {
              if (err3) {
                reject(err3); // reject the entire function
              }
              else {
                if (retrow && retrow.value) {
                  ver = retrow.value;
                  db.close();
                  resolve(retrow.value);
                }
                else {
                  db.run('INSERT INTO app (key, value) VALUES (?,?)', ['version',app.getVersion()], function(err4) {
                    if (err4) {
                      reject(err4);
                    }
                    else {
                      db.close();
                      resolve(app.getVersion());
                    }
                  });
                }
              }
          });
        });
      })
      .finally(() => {
        db.close(); // catchall
      });
    }
    catch(e) {
      //ret.success = false;
      //ret.message = e.message;
      //ret.error.push(e);
      reject(e);
      if (db) {
        db.close();
      }
    }
  });
  return val;
}

function dbRun(db, command) {
  return new Promise(() => {
    db.run(command, function (err) {
      if (err) {
        reject(err);
      }
      else {
        relolve();
      }
    });
  });
}

function dbGet(db, command, row) {
  return new Promise(() => {
    db.get(command, function(err, row) {
      if (err) {
        reject(err);
      }
      else {
        resolve(row);
      }
    });
  });
}

function updateDb(db, ret) {
  // TODO: Write update scripts here to allow db to be upgraded from any version to any higher version
  // NOTE: Think about what happens if two people share a world (OneDrive or Google Drive or DropBox, etc.) and use a different version of the app...this should be as compatible as possible
}
