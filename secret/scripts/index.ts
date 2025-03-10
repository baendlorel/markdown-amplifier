import path from 'path';
import chalk from 'chalk';
import { encrypt } from './encrypt';

function main(argv: string[]) {
  const [nodePath, currentFilePath, arg, key] = argv;
  const dir = path.dirname(path.parse(currentFilePath).dir);
  console.log(dir, arg, key);

  if (!key) {
    console.log(chalk.red('No key provided'));
    return;
  }

  // 加密
  arg === '-e' && encrypt(key, dir);
  arg === '-d' && encrypt(key, dir);
  if (arg === '-e') {
  }
  // 解密
  else if (arg === '-d') {
    console.log(chalk.greenBright(`Decrypting with key '${key}'`));
  }
  // 参数不正确
  else {
    console.log('No valid argument provided');
  }
}

main(Array.isArray(process.argv) ? Array.from(process.argv) : []);
