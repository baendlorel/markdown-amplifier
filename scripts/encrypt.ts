import chalk from 'chalk';
import { getAllFiles } from './utils';
import { config } from './configs';

export const encrypt = () => {
  console.log(chalk.bgBlue('Encrypting'));
  const files = getAllFiles(config.secretDir, (f: string) => config.excludes(f));
  console.log(` Detected ${files.length} file(s)`);
};
