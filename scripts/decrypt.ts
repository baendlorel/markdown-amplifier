import chalk from 'chalk';
import { configs } from './configs';
import { getAllFiles } from './utils';

export const decrypt = () => {
  console.log(chalk.bgBlue('Decrypting'));
  const files = getAllFiles(configs.secretFolder);
  console.log(` Detected ${files.length} file(s)`);
};
