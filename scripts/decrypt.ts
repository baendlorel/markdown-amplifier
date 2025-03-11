import chalk from 'chalk';
import { util } from './utils';

export const decryption = () => {
  console.log(chalk.bgBlue('Decrypting'));
  const files = util.getAllFiles(util.secretFolder);
  console.log(` Detected ${files.length} file(s)`);
};
