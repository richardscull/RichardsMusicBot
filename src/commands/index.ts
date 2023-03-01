import * as fs from 'fs';
import path from 'path';

const readDirectory = (dir: string) => {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      readDirectory(filePath);
    } else if (file.endsWith('.js') && file !== 'index.js') {
      const name = file.slice(0, -3);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const importedModule = require(filePath);
      exports[name] = importedModule;
    }
  });
};

readDirectory(__dirname);
module.exports = exports;
