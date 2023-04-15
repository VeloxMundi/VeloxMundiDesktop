
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
        let ret = await CheckWorldDb();
        return ret;
        break;
      default:
        break;
    }
  },
  WorldDbRun: async(event, method, data) => {

  }
  
};

function getDb(dbName) {
  let dbPath = '';
  switch (dbName.toLowerCase()) {
    case 'world':
      let worldPath = require(settingsModulePath).Read('worldPath');
      if (!worldPath || worldPath=='') {
        throw new Error('Please select a valid world.');
      }
      dbPath = path.join(worldPath, '_world.db');
      break;
    case 'config': // Not sure if we will use this...
      dbPath = path.join(
        (app.isPackaged ? path.join(app.getPath('userData')) : path.join(appPath, 'user'))
        ,'config.db'
      );
      break;
    default:
      throw new Error('Database name was not supplied.')
  }
  return new sqlite3.Database(dbPath);
}

function setErr(ret, err) {  
  ret.success = false;
  ret.message = err.message;
  ret.errors.push(err);
}

async function CheckWorldDb() { 
  let ret = {
    success : true,
    errors : []
  };
  let db = getDb('world');

  // Used when switching world to verify db exists and contains all tables. In the future may be used to upgrade database when the application is updated.
  try {      
    // Create world table if needed
    if (ret.success) {
      await new Promise((resolve, reject) => {
        db.run('CREATE TABLE IF NOT EXISTS world (key TEXT, value TEXT, PRIMARY KEY (key, value));', function(err) {
          if (err) {
            setErr(ret, err);
            reject();
          }
          resolve();
        });
      })
      .catch((e) => {
        setErr(ret, e);
      });
    }

    // Check DB version
    let appVer = app.getVersion();
    let dbVer=undefined;
    if (ret.success) {
      dbVer = await new Promise((resolve, reject) => {
        db.get('SELECT value FROM world WHERE key=?', ['appVersion'], async function(err, row) {
          if (err) {
            setErr(ret, err);
            reject(err);
          }
          else {
            if (row && row.value) {
              resolve(row.value);
            }
            else {
              db.run('INSERT INTO world (key, value) VALUES (?,?)', ['appVersion',app.getVersion()], function(err2) {
                if (err2) {
                  setErr(ret, err2);
                  reject(err2);
                }
                else {
                  resolve(appVer);
                }
              });
            }
          }
        });
      })
      .catch((e) => {
        setErr(ret, e);
      });
    }

    // Placeholder for db updates
    if (ret.success && dbVer && dbVer!=appVer) {
      // upgrade
      let upg = true;
    }

    // Check that directory name matches current directory
    let curDir = require(settingsModulePath).Read('worldPath').split(path.sep).pop();
    if (ret.success) {
      await new Promise((resolve, reject) => {
        db.get(`SELECT value from world WHERE key=?`
          , ['worldDirName']
          , async function(err, row) {
            if (err) {
              setErr(ret, err);
              reject(err);
            }

            if (row && row.value && row.value!='') {
              if (row.value!=curDir) {
                await new Promise((resolve2, reject2) => {
                  db.run(`UPDATE world
                    SET value=?
                    WHERE key=?  
                  `
                  ,[curDir, 'worldDirName']
                  ,function(err2) {
                    if (err2) {
                      setErr(ret, err2);
                      reject2(err2); // reject parent promise
                    }
                    resolve2();
                  });
                })
                .catch((e) => {
                  setErr(ret, e);
                });
              }
              else {
                resolve();
              }
            }
            else {
              db.run(`INSERT INTO world
                (key, value)
                VALUES
                (?,?)
              `
              ,['worldDirName',curDir]
              ,function(err2) {
                if (err2) {
                  setErr(ret, err2);
                  reject(err2);
                }
                resolve();
              })
            }
        });
      })
      .catch((e) => {
        setErr(ret, e);
      });
    }

    // Check worldName and set if missing
    if (ret.success) {
      await new Promise((resolve, reject) => {
        db.get(`SELECT value FROM world
          WHERE key=?
        `
        ,['worldName']
        ,function(err, row) {
          if (err) {
            setErr(ret, err);
            reject(err);
          }

          if (!row || !row.value || row.value=='') {
            db.run(`INSERT INTO world
              (key, value)
              VALUES
              (?,?)
            `,
            ['worldName', curDir],
            function(err2) {
              if (err2) {
                setErr(ret, err2);
                reject(err2);
              }
              resolve();
            })
          }
          else {
            resolve();
          }
        });
      })
      .catch((e) => {
        setErr(ret, e);
      });
    }

    // Create pages table if not exists
    if (ret.success) {
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS pages
          (
            ID INTEGER,
            Name TEXT,
            nameDisambiguation TEXT,
            fileType TEXT,
            worldPath TEXT UNIQUE,
            saved TEXT,
            PRIMARY KEY ("ID" AUTOINCREMENT)
          )
        `
        ,[]
        ,function(err) {
          if (err) {
            setErr(ret, err);
            reject(err);
          }
          resolve();
        });
      })
      .catch((e) => {
        setErr(ret, e);
      });
    }
  }
  catch(e) {
    setErr(ret, e);
  }
  db.close();
  return ret;
}

function dbRun(db, command) {
  return new Promise((resolve, reject) => {
    db.run(command, function (err) {
      if (err) {
        reject(err);
      }
      else {
        resolve();
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
