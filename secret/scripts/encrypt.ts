import { fstat, fstatSync } from 'fs';
import chalk from 'chalk';
import { getAllFiles } from './utils';

export function encrypt(key: string, folder: string) {
  console.log(chalk.blueBright(`Encrypting with key '${key}'`));
  console.log('Encrypting folder:', folder, key);
  console.log('global.asd:', global.asd, typeof global.asd);
  const files = getAllFiles(folder);
  console.log(files);
}
