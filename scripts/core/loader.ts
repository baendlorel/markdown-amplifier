import fs from 'fs';
import path from 'path';
import { lgrey, i, lflag, lerr } from '../misc';
import { MA_DIR, MA_RC, MARC_JSON_EXAMPLE } from './consts';

/**
 * 以核心文件夹MA_DIR来定位根目录 \
 * Locate root directory by core folder MA_DIR
 * @returns
 */
export const locateRoot = () => {
  let dir = __dirname;
  let father = path.dirname(dir);
  while (father !== dir) {
    if (fs.existsSync(path.join(dir, MA_DIR))) {
      const stat = fs.statSync(path.join(dir, MA_DIR));
      if (stat.isDirectory()) {
        return dir;
      }
    }
    dir = father;
    father = path.dirname(dir);
  }
  return '';
};

/**
 * 加载配置文件 \
 * Load configuration file
 * @returns undefined表示配置有误或没有配置文件。如果无异常则返回配置 \
 */
export const loadRc = (root: string) => {
  lgrey(`检测${MA_RC}中的配置`, `Checking configs in ${MA_RC}`);
  const marc = path.join(root, MA_DIR, MA_RC);
  if (!fs.existsSync(marc)) {
    return undefined;
  }
  const configs = require(marc);
  // 定义化简函数
  const messages = [] as string[];
  const mi = (zh: string, en: string) => messages.push(i(zh, en));

  if (!configs) {
    lflag(`在${MA_RC}中找不到cryption配置`, `Cannot find note in ${MA_RC}`);
    return undefined;
  }

  if (!['zh', 'en'].includes(configs.locale)) {
    mi(`'locale' 必须设置为zh、en`, `'locale' should be 'zh' or 'en'`);
  }

  if (typeof configs.crypt.encryptFileName !== 'boolean') {
    mi(`'encryptFileName'应为boolean`, `'encryptFileName' should be a boolean`);
  }

  if (typeof configs.crypt.encryptFolderName !== 'boolean') {
    mi(`'encryptFolderName'应为boolean`, `'encryptFolderName' should be a boolean`);
  }

  if (
    !Array.isArray(configs.crypt.exclude) ||
    configs.crypt.exclude.some((e) => typeof e !== 'string')
  ) {
    mi(`'exclude'应为字符串数组`, `'exclude' should be an string array`);
  }

  if (!configs.crypt.dir || typeof configs.crypt.dir !== 'object') {
    mi(`'dir' 未设置`, `'dir' is not set`);
  } else {
    if (typeof configs.crypt.dir.decrypted !== 'string') {
      mi(`'dir.decrypted'应为字符串`, `'dir.decrypted' should be a string`);
    }
    if (typeof configs.crypt.dir.encrypted !== 'string') {
      mi(`'dir.encrypted'应为字符串`, `'dir.encrypted' should be a string`);
    }
  }

  // 输出错误信息
  if (messages.length > 0) {
    lerr(messages.join('\n'));
    lflag(`${MA_RC}中的配置例子如下：`, `An example in ${MA_RC} should be like this :`);
    console.log(MARC_JSON_EXAMPLE(i));
    return undefined;
  }

  return configs;
};
