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

  // # 私有方法
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
    // 定义化简函数
    const messages = [] as string[];
    const mi = (zh: string, en: string) => messages.push(i(zh, en));
    const k = chalk.rgb(177, 220, 251);
    const v = chalk.rgb(193, 148, 125);
    const p = chalk.rgb(202, 123, 210);
    const b = chalk.rgb(93, 161, 248);
    const y = chalk.rgb(245, 214, 74);

    // 配置案例
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

    if (!configs) {
      mi('在package.json中找不到encryptConfigs配置', 'Cannot find encryptConfigs in package.json');
    } else {
      if (configs.encryptFileName !== true && configs.encryptFileName !== false) {
        mi(
          'encryptConfigs.encryptFileName 应该是boolean型',
          'encryptConfigs.encryptFileName should be a boolean'
        );
      }

      if (configs.encryptFolderName !== true && configs.encryptFolderName !== false) {
        mi(
          'encryptConfigs.encryptFolderName 应该是boolean型',
          'encryptConfigs.encryptFolderName should be a boolean'
        );
      }
      if (!configs.exclude) {
        mi(
          'encryptConfigs.exclude 未设置，需设置为字符串数组',
          'encryptConfigs.exclude should be an string array'
        );
      }
      if (!configs.directory) {
        mi('encryptConfigs.directory 未设置', 'encryptConfigs.directory is not set');
      } else {
        if (!configs.directory.decrypted) {
          mi(
            'encryptConfigs.directory.decrypted 未设置，需设置为字符串',
            'encryptConfigs.directory.decrypted should be a string'
          );
        }
        if (!configs.directory.encrypted) {
          mi(
            'encryptConfigs.directory.encrypted 未设置，需设置为字符串',
            'encryptConfigs.directory.encrypted should be a string'
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
  // 读取配置
  lbgBlue('加载配置', 'Loading Configuration');

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
      const entries = [
        {
          key: i('加密文件名', 'encryptFileName'),
          value: String(privates.encryptFileName),
          comment: i('是否加密文件名，默认为true', 'Whether to encrypt file name, default is true'),
        },
        {
          key: i('加密文件夹名', 'encryptFolderName'),
          value: String(privates.encryptFolderName),
          comment: i(
            '是否加密文件夹名，默认为true',
            'Whether to encrypt folder name, default is true'
          ),
        },
        {
          key: i(`根目录`, `root`),
          value: privates.root,
          comment: i('笔记的根目录', 'Root directory of the note'),
        },
        {
          key: i(`加密前`, `decrypted`),
          value: privates.directory.decrypted,
          comment: i('要加密的文件夹', 'The folder to be encrypted'),
        },
        {
          key: i(`加密后`, `encrypted`),
          value: privates.directory.encrypted,
          comment: i('加密后的文件将放在这个文件夹', 'Encrypted files will be put in this folder'),
        },
        {
          key: i('忽略', 'exclude'),
          value: `[${privates.exclude.join(', ')}]`,
          comment: i(
            '要加密的文件夹下，不加密的文件/文件夹',
            'Folders in decrypted directory will not be encrypted'
          ),
        },
        {
          key: i('操作', 'action'),
          value: privates.action,
          comment: i(
            '会清空目标文件夹，' + chalk.underline('注意备份!'),
            'Will clear the target folder. ' + chalk.underline('Backup first!')
          ),
        },
        {
          key: i('密钥', 'key'),
          value: privates.key,
          comment: i(
            chalk.bold.underline('请记住') + '密钥',
            'Promise you will ' + chalk.bold.underline('remember it')
          ),
        },
      ];
      const mk = Math.max(...entries.map((k) => util.actualWidth(k.key)));
      const mv = Math.max(...entries.map((v) => util.actualWidth(v.value)));
      const pk = (key: string) => util.padAlign(key, mk).replace(/^[\w]/, (a) => a.toUpperCase());
      const pv = (v: string) => util.padAlign(v, mv);

      for (const e of entries) {
        const k = chalk.blue(pk(e.key));
        const v = pv(e.value);
        const c = chalk.rgb(122, 154, 96)(' //  ' + e.comment);
        log(tab`${k} : ${v} ${c}`);
      }
    },
  };
  return u;
};

export const configs = createConfigManager();
