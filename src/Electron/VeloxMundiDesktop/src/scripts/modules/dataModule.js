
const { remote, app } = require('electron');
const fs = require('fs');
const sqljs = require('sql.js');
const sqlite3 = require('sqlite3').verbose();

const path = require('path');
let settingsModulePath = path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'settingsModule.js');
let functionsModulePath = path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'functionsModule.js');
let worldDbModule = require(path.join(app.getAppPath(), 'src', 'scripts', 'modules', 'worldDbModule.js'));
        

module.exports = {
  Invoke: async (event, method, data) => {
    switch(method) {
      case 'CheckWorldDb':
        let ret = await CheckWorldDb();
        return ret;
      /*
      case 'DbRunSync':
        return dbRunSync(data);
      case 'DbGetSync':
        return dbGetSync(data);
      case 'DbAllSync':
        return dbAllSync(data);
      */
      default:
        break;
    }
  },
  DbCustomSync: async(data) => {
    return await dbCustomSync(
      {
        callFunction : data
      }
    );
  },
  DbRun: async(data) => {
    let ret = {
      success : true,
      errors : []
    }
    let db = await getDb(data.dbName);
    try {
      let x = 1;
      await new Promise((resolve, reject) => {
        db.run(data.query, data.params, function(err) {
          if (err) {
            reject(err);
          }
          else {
            resolve();
          }
        });
      })
      .catch((e) => {
        setErr(ret, e);
      });
      let y = 0;
    }
    catch(e) {
      setErr(ret, e);
    }
    finally {
      db.close();
    }
    if (ret.success) {
      return;
    }
    else {
      throw ret.errors.pop(); // Let caller handle errors
    }
  },
  DbGet: async(data) => {
    let ret = {
      success : true,
      errors : []
    }
    let db = await getDb(data.dbName);
    try {
      ret.result = await new Promise((resolve, reject) => {
        db.get(data.query, data.params, function(err, row) {
          if (err) {
            reject(err);
          }
          if (row) {
            resolve(row);
          }
          else {
            resolve({});
          }
        });
      })
      .catch((e) => {
        setErr(ret, e);
      });
    }
    catch(e) {
      setErr(ret, e);
    }
    finally {
      db.close();
    }
    if (ret.success) {
      return ret.result;
    }
    else {
      throw ret.errors.pop(); // Let caller handle errors
    }
  },
  DbAll : async(data) => {
    let ret = {
      success : true,
      errors : []
    }
    let db = await getDb(data.dbName);
    try {
      ret.result = await new Promise((resolve, reject) => {
        db.all(data.query, data.params, function(err, rows) {
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      })
      .catch((e) => {
        setErr(ret, e);
      });
    }
    catch(e) {
      setErr(ret, e);
    }
    finally {
      db.close();
    }
    if (ret.success) {
      return ret.result;
    }
    else {
      throw ret.errors.pop(); // Let caller handle errors
    }
  },
  CreateTable : async(dbName, tableName) => {
    await createTables(dbName, [tableName]);
    return;
  },
  CreateTables : async(dbName, tableNameArray) => {
    await createTables(dbName, tableNameArray);
    return;
  }
};

async function myTest(res) {
  await new Promise((resolve, reject) => {
    let i=0;
    while (i<10000) {
      i++;
    }
    res = 'Hello, World';
    resolve();
  });
  return 1;
}

async function getDb(dbName) {
  let dbPath = '';
  if (!dbName || dbName=='') {
    dbName = 'world';
  }
  switch (dbName.toLowerCase()) {
    case 'world':
      let worldPath = require(settingsModulePath).Read('worldPath');
      if (!worldPath || worldPath=='') {
        throw new Error('Please select a valid world.');
      }
      dbPath = path.join(worldPath, '_world.db');
      // Check DB if not exists...      
      if (!fs.existsSync(dbPath)) {
        let temp = new sqlite3.Database(dbPath); // create DB or CheckWorldDb will create a permanent loop...
        try {
          await worldDbModule.Invoke(null, 'CheckWorldDb');
        }
        finally {
          temp.close(); // close temp DB
        }
      }
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

async function createTables(dbName, tableNameArray) {
  for (let i=0; i<tableNameArray.length; i++) {
    let success = true;
    let query = '';
    let db = await getDb(dbName);
    switch(tableNameArray[i]) {
      case 'world':
        query = 'CREATE TABLE IF NOT EXISTS world (key TEXT, value TEXT, PRIMARY KEY (key, value));';
        break;
      case 'pages':
        query = `
          CREATE TABLE IF NOT EXISTS pages
          (
            id INTEGER,
            name TEXT,
            nameDisambiguation TEXT,
            fileType TEXT,
            worldPath TEXT UNIQUE,
            created TEXT,
            saved TEXT,
            PRIMARY KEY ("ID" AUTOINCREMENT)
          )
        `;
        break;
      case 'links':
        query = `
            CREATE TABLE IF NOT EXISTS links
            (
              fromPageId INTEGER,
              toPageId INTEGER,
              PRIMARY KEY (fromPageId, toPageId)
            )
          `;
        break;
    }
    if (query!='') {
      await new Promise((resolve, reject) => {
        db.run(query, [], function(err) {
          if (err) {
            reject(err);
          }
          else {
            resolve();
          }
        });
      })
      .catch((e) => {
        success = false;
      })
      .finally(() => {
        db.close();
      });
    }
    else {
      db.close();
      throw new Error('Invalid table name');
    }
  }
}

async function dbCustomSync(data) {
  let ret = {
    success : true,
    errors : []
  }
  let db = await getDb(data.dbName);
  try {
    await data.callFunction(db, ret);
  }
  catch(e) {
    setErr(ret, e);
  }
  finally {
    db.close();
  }
  if (ret.success) {
    return ret.result;
  }
  else {
    throw ret.errors.pop(); // Let caller handle errors
  }
}





/*
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

function updateDb(db, ret) {
  // TODO: Write update scripts here to allow db to be upgraded from any version to any higher version
  // NOTE: Think about what happens if two people share a world (OneDrive or Google Drive or DropBox, etc.) and use a different version of the app...this should be as compatible as possible
}

*/