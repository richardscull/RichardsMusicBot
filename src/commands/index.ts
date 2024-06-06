import * as fs from 'fs';
import path from 'path';

const readDirectory = (dir: string) => {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);

    const isCommand =
      file.includes('command') &&
      (file.endsWith('.js') || file.endsWith('.ts'));

    if (stat.isDirectory()) {
      readDirectory(filePath);
    } else if (isCommand && file !== 'index.js' && file !== 'index.ts') {
      const name = file.split('.command')[0];
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const importedModule = require(filePath);
      exports[name] = importedModule;
    }
  });
};

readDirectory(__dirname);
module.exports = exports;
