import { encryption } from './encrypt';
import { decryption } from './decrypt';
import { configs, lbgBlue, lred } from './misc';

const invalidArgs = (key: string, action: string) => {
  let invalid = false;

  if (!key) {
    lred('没有提供密钥', 'No key provided');
    invalid = true;
  }

  if (!['--encrypt', '--decrypt'].includes(action)) {
    lred(
      '没有提供有效的操作，操作只能是--encrypt或--decrypt',
      'No valid action provided, action should be --encrypt or --decrypt'
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
  lbgBlue('加载配置', 'Load Configuration');

  configs.set(key, action);
  configs.display();

  console.log();

  action === '--encrypt' && encryption();
  action === '--decrypt' && decryption();
};

main(Array.isArray(process.argv) ? Array.from(process.argv) : []);
