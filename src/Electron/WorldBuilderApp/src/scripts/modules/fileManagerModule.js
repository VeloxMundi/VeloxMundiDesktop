var fs = require('fs');
const path = require('path');

module.exports = class fileManager {
  constructor(path, name = null) {
    this.path = path;
    this.name = name;
    this.items = [];
    //this.fileArray = [];
  }


//  build = () => {
//    this.items = FileTree.readDir(this.path);
//  }

  static ReadSubdirectories(path) { 
    
    let fileArray = [];
    let files = fs.readdirSync(path).forEach(file => {
        var fileInfo = new fileManager(`${path}\\${file}`, file);

        var stat = fs.statSync(fileInfo.path);

        if (stat.isDirectory()) {
          fileArray.push(fileInfo);
        }
    });
    return fileArray;
    
  }

  static WriteFile(path, data) {
    fs.writeFileSync(path, data, (err) => {
      if (!err) {
        console.log(`File "${path}" written successfully!`);
      }
      else {
        throw ("Error writing file");
      }
    })
  }

  static CreateDirectory(path) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  }


}
