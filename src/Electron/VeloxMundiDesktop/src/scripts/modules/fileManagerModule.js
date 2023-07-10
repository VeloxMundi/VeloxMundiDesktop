var fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');


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

  static Invoke(event, method, data) {
    switch(method) {
      case 'GetPathSep':
        return path.sep;
        break;
      case 'ReadFileToString':
        return this.ReadFileToString(data);
        break;
      case 'CreateDirectory':
        this.CreateDirectory(data);
        break;
      case 'ZipDirectory':
        this.ZipDirectory(data);
        break;
      case 'GetFileInfoForPath':
        return this.GetFileInfoForPath(data);
        break;
      default:
        event.sender.send('Invalid');
        break;
    }
    return null;
  }


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

  static ReadFileToString(path) {
    try {
      let buffer = fs.readFileSync(path);
      let string = buffer.toString();
      return string;
    }
    catch(e) {
      return '';
    }
  }

  static ZipDirectory(directoryPath) {
    let platform = process.platform;
    if (platform=='darwin' || platform=='linux') {
      const path = require('path');

      const zipFilePath = path.join();

      // Use the 'zip' command to create a compressed folder
      const zip = spawn('zip', ['-r', zipFilePath, path.basename(directoryPath)], {
        cwd: path.dirname(directoryPath)
      });

      zip.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      zip.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      zip.on('close', (code) => {
        if (code === 0) {
          console.log('Folder compressed successfully.');
        } else {
          console.error(`Failed to compress folder. Exit code: ${code}`);
        }
      });

    }
    else {

    }
  }

  static GetFileInfoForPath(directoryPath) {
    let fileList = [];
  const files = fs.readdirSync(directoryPath);
  
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const subdirectoryFiles = this.GetFileInfoForPath(filePath);
      fileList = fileList.concat(subdirectoryFiles);
    }
    else {
      const fileInfo = {
        path: filePath,
        name: file,
        extension: path.extname(filePath),
        size: stats.size,
        lastAccessTime: stats.atime,
        lastModifiedTime: stats.mtime,
        creationTime: stats.birthtime
      };
      fileList.push(fileInfo);
    }
  }
  return fileList;
  }

}

