var fs = require('fs');

module.exports = class FileTree {
  constructor(path, name = null) {
    this.path = path;
    this.name = name;
    this.items = [];
    this.fileArray = [];
  }

  

//  build = () => {
//    this.items = FileTree.readDir(this.path);
//  }

  static ReadSubdirectories(path) { 
    
    this.fileArray = [];
    let files = fs.readdirSync(path).forEach(file => {
        var fileInfo = new FileTree(`${path}\\${file}`, file);

        var stat = fs.statSync(fileInfo.path);

        if (stat.isDirectory()) {
          this.fileArray.push(fileInfo);
        }
    });
    return this.fileArray;
    
    
    /*
    const x = fileArr;
    
    */
  }

  static addToArray(fileInfo) {
    if (!this.fileArray)
    {
      this.fileArray = [];
    }
    this.fileArray.push(fileInfo);
    return;
  }
}

