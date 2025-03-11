import path from 'path';
import chalk from 'chalk';
import { encryption } from './encrypt';
import { decryption } from './decrypt';
import { i, configs } from './utils';

const invalidArgs = (key: string, action: string) => {
  let invalid = false;
  if (!key) {
    console.log(
      chalk.red(
        i({
          zh: '没有提供密钥',
          en: 'No key provided',
        })
      )
    );
    invalid = true;
  }
  if (!['--encrypt', '--decrypt'].includes(action)) {
    console.log(
      i({
        zh: '没有提供有效的操作，操作只能是--encrypt或--decrypt',
        en: 'No valid action provided, action should be --encrypt or --decrypt',
      })
    );
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
  console.log(
    chalk.bgBlue(
      i({
        zh: '加载配置',
        en: 'Load Configuration',
      })
    )
  );
  configs.set(key, action);
  configs.display();

  console.log();

  action === '--encrypt' && encryption();
  action === '--decrypt' && decryption();
};

main(Array.isArray(process.argv) ? Array.from(process.argv) : []);
