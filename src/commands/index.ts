import * as fs from 'fs';
import path from 'path';

const readDirectory = (dir: string) => {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);

    const isCommand = file.includes('command') && file.endsWith('.js');

    if (stat.isDirectory()) {
      readDirectory(filePath);
    } else if (isCommand && file !== 'index.js') {
      const name = file.split('.command.js')[0];
      const importedModule = require(filePath);
      exports[name] = importedModule;
    }
  });
};

readDirectory(__dirname);
module.exports = exports;
