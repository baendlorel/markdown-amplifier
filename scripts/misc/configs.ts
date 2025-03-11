import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { util, tab } from './utils';
import { i } from './locale';
import { log, lbgBlue, lbgRed, lblue, lgrey, lred } from './logger';

const privates = {
  /**
   * 语言，从执行参数或系统中获取
   */
  locale: '',

  /**
   * 语言，从执行参数或系统中获取
   */
  historyKeys: '.history-keys' as const,

  /**
   * 根目录，递归向上查找package.json所在的文件夹
   */
  root: '',

  /**
   * 操作，由参数决定
   */
  action: '',

  /**
   * 密钥，由参数决定
   */
  key: '',

  // 以下是package.json读取出来的
  exclude: [] as string[],
  encryptFileName: true,
  encryptFolderName: true,
  directory: {
    decrypted: '',
    encrypted: '',
  },

  // 私有方法
  initLocale() {
    // 先看参数里有没有
    if (process.argv.includes('--en')) {
      privates.locale = 'en';
      return;
    }
    if (process.argv.includes('--zh')) {
      privates.locale = 'zh';
      return;
    }

    // 如果没有参数，再从系统中获取
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale.slice(0, 2) === 'zh') {
      privates.locale = 'zh';
    } else {
      privates.locale = 'en';
    }
  },

  /**
   * 让找到的gitignore文件包含要**加密的文件夹、keys历史**
   */
  ignore() {
    const gitigorePath = path.join(privates.root, '.gitignore');
    if (fs.existsSync(gitigorePath)) {
      const content = fs.readFileSync(gitigorePath).toString();
      const lines = content.split('\n').map((line) => line.trim());

      // 确认是否忽略了加密前的文件夹，没有则加入
      if (!lines.some((p) => p === privates.directory.decrypted)) {
        lgrey(
          '.gitignore文件并未包含要加密的文件夹，添加中',
          'It seems .gitignore in root directory does not contain'
        );
        fs.appendFileSync(gitigorePath, `\n${privates.directory.decrypted}`);
        lgrey(
          `.gitignore已添加'${privates.directory.decrypted}'`,
          `'${privates.directory.decrypted}' is added to .gitignore`
        );
      }

      // 确认是否忽略了.history-keys文件，没有则加入
      if (!lines.some((p) => p === privates.historyKeys)) {
        lgrey(
          `.gitignore文件并未包含'${privates.historyKeys}'，添加中...`,
          `It seems .gitignore does not contain '${privates.historyKeys}'. Adding...`
        );
        fs.appendFileSync(gitigorePath, `\n${privates.historyKeys}`);
        lgrey(
          `.gitignore已添加'${privates.historyKeys}'`,
          `'${privates.historyKeys}' is added to .gitignore`
        );
      }
    } else {
      throw new Error(
        i(
          `${privates.root}下未找到.gitignore文件！`,
          `Cannot find .gitignore file in ${privates.root}!`
        )
      );
    }
  },
  checkPackageJson(configs: any) {
    const k = chalk.rgb(177, 220, 251);
    const v = chalk.rgb(193, 148, 125);
    const p = chalk.rgb(202, 123, 210);
    const b = chalk.rgb(93, 161, 248);
    const y = chalk.rgb(245, 214, 74);
    const example = `${y(`{`)}
  ...other configs,
  ${k(`"encryptConfigs"`)}: ${p(`{`)}
      ${k(`"encryptFolderName"`)}: ${b(`true`)},
      ${k(`"exclude"`)}: ${b(`[]`)},
      ${k(`"directory"`)}: ${b(`{`)}
        ${k(`"decrypted"`)}: ${v(`"decrypted"`)},
        ${k(`"encrypted"`)}: ${v(`"encrypted"`)}
    ${b(`}`)}
  ${p(`}`)}
${y(`}`)}`;

    const messages = [] as string[];
    if (!configs) {
      messages.push(
        i('在package.json中找不到encryptConfigs配置', 'Cannot find encryptConfigs in package.json')
      );
    } else {
      if (configs.encryptFileName !== true && configs.encryptFileName !== false) {
        messages.push(
          i(
            'encryptConfigs.encryptFileName 应该是boolean型',
            'encryptConfigs.encryptFileName should be a boolean'
          )
        );
      }

      if (configs.encryptFolderName !== true && configs.encryptFolderName !== false) {
        messages.push(
          i(
            'encryptConfigs.encryptFolderName 应该是boolean型',
            'encryptConfigs.encryptFolderName should be a boolean'
          )
        );
      }
      if (!configs.exclude) {
        messages.push(
          i(
            'encryptConfigs.exclude 未设置，需设置为字符串数组',
            'encryptConfigs.exclude should be an string array'
          )
        );
      }
      if (!configs.directory) {
        messages.push(i('encryptConfigs.directory 未设置', 'encryptConfigs.directory is not set'));
      } else {
        if (!configs.directory.decrypted) {
          messages.push(
            i(
              'encryptConfigs.directory.decrypted 未设置，需设置为字符串',
              'encryptConfigs.directory.decrypted should be a string'
            )
          );
        }
        if (!configs.directory.encrypted) {
          messages.push(
            i(
              'encryptConfigs.directory.encrypted 未设置，需设置为字符串',
              'encryptConfigs.directory.encrypted should be a string'
            )
          );
        }
      }
    }

    // 输出错误信息
    if (messages.length > 0) {
      lbgRed('加载配置失败', 'Load Configuration Failed');
      lred(messages.join('\n'));
      lbgBlue('package.json中的配置例子如下：', 'An example in package.json should be like this :');
      log(example);
      throw new Error(
        i('package.json中的encryptConfigs配置无效', 'Invalid encryptConfigs in package.json')
      );
    }
  },
  getPackageJson() {
    const paths = util.splitPath(__dirname);
    for (let i = paths.length; i >= 1; i--) {
      const root = path.join(...paths.slice(0, i));
      const p = path.join(root, 'package.json');
      if (fs.existsSync(p)) {
        privates.root = root;
        return require(p);
      }
    }
    lbgRed(
      '加载配置失败。找不到package.json',
      'Load Configuration Failed. Cannot find package.json'
    );

    throw new Error(i('找不到package.json', 'Cannot find package.json'));
  },
};

const createConfigManager = () => {
  privates.initLocale();

  // 寻找配置文件package.json
  const config = privates.getPackageJson().encryptConfigs;
  privates.checkPackageJson(config);

  privates.encryptFileName = config.encryptFileName;
  privates.encryptFolderName = config.encryptFolderName;
  privates.exclude = config.exclude;
  privates.directory.decrypted = config.directory.decrypted;
  privates.directory.encrypted = config.directory.encrypted;
  privates.action = '';
  privates.key = '';

  privates.ignore();

  const u = {
    get key() {
      return privates.key;
    },

    get locale() {
      return privates.locale;
    },

    get encryptFolderName() {
      return privates.encryptFolderName;
    },

    /**
     * 目录配置，包含了根目录
     */
    get dir() {
      return {
        root: privates.root,
        decrypted: privates.directory.decrypted,
        encrypted: privates.directory.encrypted,
      };
    },
    set(key: string, action: string) {
      privates.key = key;
      privates.action = action.replace('--', '');
    },

    excludes(folder: string) {
      return privates.exclude.includes(folder);
    },

    display() {
      const keys = [
        { en: 'encryptFileName', zh: '加密文件名' },
        { en: 'encryptFolderName', zh: '加密文件夹名' },
        { en: 'root', zh: '根目录' },
        { en: 'decrypted', zh: '加密前' },
        { en: 'encrypted', zh: '加密后' },
        { en: 'exclude', zh: '忽略目录' },
        { en: 'action', zh: '操作' },
        { en: 'key', zh: '密钥' },
      ];
      const maxKeyLength = i(
        4 + Math.max(...keys.map((k) => util.actualWidth(k.en))),
        2 + Math.max(...keys.map((k) => util.actualWidth(k.zh)))
      );
      const pk = (key: string) =>
        util.padAlign(key, maxKeyLength).replace(/^[\w]/, (a) => a.toUpperCase());

      const get = (zh: string, en: string) => {
        let r = { value: '', key: '', comment: '' };
        switch (en) {
          case 'encryptFileName':
            r.value = String(privates.encryptFileName);
            r.key = chalk.blue(pk(i(zh, en)));
            r.comment = i(
              '是否加密文件名，默认为true',
              'Whether to encrypt file name, default is true'
            );
            break;
          case 'encryptFolderName':
            r.value = String(privates.encryptFolderName);
            r.key = chalk.blue(pk(i(zh, en)));
            r.comment = i(
              '是否加密文件夹名，默认为true',
              'Whether to encrypt folder name, default is true'
            );
            break;
          case 'root':
            r.value =
              privates.root.length > 24 ? path.relative(__dirname, privates.root) : privates.root;
            r.key = chalk.rgb(147, 183, 236)(pk(' ├─ ' + i(zh, en)));
            r.comment = i('笔记的根目录', 'Root directory of the note');
            break;
          case 'decrypted':
            r.value = privates.directory.decrypted;
            r.key = chalk.rgb(147, 183, 236)(pk(' ├─ ' + i(zh, en)));
            r.comment = i('要加密的文件夹', 'The folder to be encrypted');
            break;
          case 'encrypted':
            r.value = privates.directory.encrypted;
            r.key = chalk.rgb(147, 183, 236)(pk(' └─ ' + i(zh, en)));
            r.comment = i(
              '加密后的文件将放在这个文件夹',
              'Encrypted files will be put in this folder'
            );
            break;
          case 'exclude':
            r.value = `[${privates.exclude.join(', ')}]`;
            r.key = chalk.blue(pk(i(zh, en)));
            r.comment = i(
              '要加密的文件夹下，不加密的文件/文件夹',
              'Folders in decrypted directory will not be encrypted'
            );
            break;
          case 'action':
            r.value = privates.action;
            r.key = chalk.blue(pk(i(zh, en)));
            break;
          case 'key':
            r.value = privates.key;
            r.key = chalk.blue(pk(i(zh, en)));
            r.comment = i(
              chalk.bold.underline('请记住') + '密钥',
              'Promise you will ' + chalk.bold.underline('remember it')
            );
            break;
          default:
            throw new Error(
              i(
                '无法展示这个字段 key = ' + i(zh, en),
                "Can't display this config key = " + i(zh, en)
              )
            );
        }
        return r;
      };

      const values = keys.map((key) => get(key.zh, key.en));
      const maxValueLength = Math.max(...values.map((v) => util.actualWidth(v.value)));
      const pv = (v: string) => util.padAlign(v, maxValueLength);

      const c = chalk.rgb(122, 154, 96);
      for (let index = 0; index < keys.length; index++) {
        const v = values[index];
        if (keys[index].en === 'root') {
          log(chalk.blue(pk(i(tab`目录配置`, tab`Directory`))));
        }
        if (keys[index].en === 'key') {
          v.key = chalk.red(v.key);
        }
        log(tab`${v.key} : ${pv(v.value)} ${v.comment ? c(' // ' + v.comment) : ''}`);
      }
    },
  };
  return u;
};

export const configs = createConfigManager();

// globalThis.configs = configs;

// declare global {
//   var configs: {
//     readonly key: string;
//     readonly locale: string;
//     readonly encryptFolderName: boolean;
//     readonly dir: { root: string; decrypted: string; encrypted: string };
//     set(key: string, action: string): void;
//     excludes(folder: string): boolean;
//     display(): void;
//   };
// }
