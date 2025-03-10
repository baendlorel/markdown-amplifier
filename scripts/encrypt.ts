import chalk from 'chalk';
import { getAllFiles } from './utils';
import { configs } from './configs';

export const encrypt = () => {
  console.log(chalk.bgBlue('Encrypting'));
  const files = getAllFiles(configs.secretFolder);
  console.log(` Detected ${files.length} file(s)`);
};
