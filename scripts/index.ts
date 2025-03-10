import path from 'path';
import chalk from 'chalk';
import { encrypt } from './encrypt';
import { decrypt } from './decrypt';
import { config } from './configs';

const invalidArgs = (key: string, action: string) => {
  let invalid = false;
  if (!key) {
    console.log(chalk.red('No key provided'));
    invalid = true;
  }
  if (!['--encrypt', '--decrypt'].includes(action)) {
    console.log('No valid argument provided');
    invalid = true;
  }
  return invalid;
};

const main = (argv: string[]) => {
  const [nodePath, currentFilePath, action, key] = argv;
  if (invalidArgs(key, action)) {
    return;
  }

  // 读取配置
  console.log(chalk.bgBlue('Load Configuration'));
  config.set(key, action);
  config.display();

  console.log();

  action === '--encrypt' && encrypt();
  action === '--decrypt' && decrypt();
};

main(Array.isArray(process.argv) ? Array.from(process.argv) : []);
