import chalk from 'chalk';
import { config } from './configs';
import { getAllFiles } from './utils';

export const decrypt = () => {
  console.log(chalk.bgBlue('Decrypting'));
  const files = getAllFiles(config.secretFolder);
  console.log(` Detected ${files.length} file(s)`);
};
