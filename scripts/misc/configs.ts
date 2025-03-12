/**
 * @name Configs
 * @description
 * 依赖于locale、utils、logger、argv
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import stringWidth from 'string-width';
import { i } from './locale';
import { formatDatetime, load, padAlign, splitPath, tab } from './utils';
import { log, lbgBlue, lbgRed, lgrey, lred, table } from './logger';
import { argv } from './argv';
console.log(global.idx === undefined ? (global.idx = 0) : global.idx++, __filename);

const createConfigManager = () => {
  // * 定义私有变量
  /**
   * 保存历史用key的文件名
   */
  const _historyKeys = '.history-keys' as const;

  /**
   * 根目录，递归向上查找package.json所在的文件夹
   */
  let _root = '';

  // 以下是package.json读取出来的
  let _encryptFileName = true;
  let _encryptFolderName = true;
  let _exclude = [] as string[];
  let _directory = {
    decrypted: '',
    encrypted: '',
  };

  // * 定义私有函数

  /**
   * 让找到的gitignore文件包含要**加密的文件夹、keys历史**
   */
  const checkGitIgnore = () => {
    const gitigorePath = path.join(_root, '.gitignore');
    if (fs.existsSync(gitigorePath)) {
      const content = fs.readFileSync(gitigorePath).toString();
      const lines = content.split('\n').map((line) => line.trim());

      // 确认是否忽略了加密前的文件夹，没有则加入
      if (!lines.some((p) => p === _directory.decrypted)) {
        lgrey(
          '.gitignore文件并未包含要加密的文件夹，添加中',
          'It seems .gitignore in root directory does not contain'
        );
        fs.appendFileSync(gitigorePath, `\n${_directory.decrypted}`);
        lgrey(
          `.gitignore已添加'${_directory.decrypted}'`,
          `'${_directory.decrypted}' is added to .gitignore`
        );
      }

      // 确认是否忽略了.history-keys文件，没有则加入
      if (!lines.some((p) => p === _historyKeys)) {
        lgrey(
          `.gitignore文件并未包含'${_historyKeys}'，添加中...`,
          `It seems .gitignore does not contain '${_historyKeys}'. Adding...`
        );
        fs.appendFileSync(gitigorePath, `\n${_historyKeys}`);
        lgrey(`.gitignore已添加'${_historyKeys}'`, `'${_historyKeys}' is added to .gitignore`);
      }
    } else {
      throw new Error(
        i(`${_root}下未找到.gitignore文件！`, `Cannot find .gitignore file in ${_root}!`)
      );
    }
  };

  const loadPackageJsonConfigs = (rootPath: string) => {
    const configs = require(path.join(rootPath, 'package.json')).encryptConfigs;
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

    return configs;
  };

  const locateRoot = () => {
    const paths = splitPath(__dirname);
    lgrey(i('寻找package.json的目录作为root目录', 'Locating package.json as root directory'));
    for (let i = paths.length; i >= 1; i--) {
      const root = path.join(...paths.slice(0, i));
      const p = path.join(root, 'package.json');
      if (fs.existsSync(p)) {
        return root;
      }
    }

    lbgRed(
      '加载配置失败。找不到package.json',
      'Load Configuration Failed. Cannot find package.json'
    );

    throw new Error(i('找不到package.json', 'Cannot find package.json'));
  };

  // * 开始加载配置
  lbgBlue('加载配置表', 'Loading Configuration Table');

  // 以package.json的目录定为root
  _root = locateRoot();
  const config = loadPackageJsonConfigs(_root);

  _encryptFileName = config.encryptFileName;
  _encryptFolderName = config.encryptFolderName;
  _exclude = config.exclude;
  _directory.decrypted = config.directory.decrypted;
  _directory.encrypted = config.directory.encrypted;

  checkGitIgnore();

  const conf = {
    get historyKeysPath() {
      return path.join(_root, _historyKeys);
    },
    get encryptFileName() {
      return _encryptFileName;
    },
    get encryptFolderName() {
      return _encryptFolderName;
    },
    get root() {
      return _root;
    },
    get directory() {
      return {
        decrypted: path.join(_root, _directory.decrypted),
        encrypted: path.join(_root, _directory.encrypted),
      };
    },
    excludes(folder: string) {
      return _exclude.includes(folder);
    },
    display() {
      const entries = [
        {
          key: i('加密文件名', 'encryptFileName'),
          value: _encryptFileName,
          comment: i('是否加密文件名，默认为true', 'Whether to encrypt file name, default is true'),
        },
        {
          key: i('加密文件夹名', 'encryptFolderName'),
          value: _encryptFolderName,
          comment: i(
            '是否加密文件夹名，默认为true',
            'Whether to encrypt folder name, default is true'
          ),
        },
        {
          key: i(`根目录`, `root`),
          value: _root,
          comment: i('笔记的根目录', 'Root directory of the note'),
        },
        {
          key: i(`加密前`, `decrypted`),
          value: _directory.decrypted,
          comment: i('要加密的文件夹', 'The folder to be encrypted'),
        },
        {
          key: i(`加密后`, `encrypted`),
          value: _directory.encrypted,
          comment: i('加密后的文件将放在这个文件夹', 'Encrypted files will be put in this folder'),
        },
        {
          key: i('忽略', 'exclude'),
          value: _exclude,
          comment: i(
            '要加密的文件夹下，不加密的文件/文件夹',
            'Folders in decrypted directory will not be encrypted'
          ),
        },
        {
          key: i('操作', 'action'),
          value: argv.action,
          comment: i(
            '会清空目标文件夹，' + chalk.underline('注意备份!'),
            'Will clear the target folder. ' + chalk.underline('Backup first!')
          ),
        },
        {
          key: i('密钥', 'key'),
          value: argv.key,
          comment: i(
            chalk.bold.underline('请记住') + '密钥',
            'Promise you will ' + chalk.bold.underline('remember it')
          ),
        },
      ];

      // coloredValue
      const cv = (value: any) => {
        switch (typeof value) {
          case 'undefined':
          case 'boolean':
            return chalk.yellow(String(value));
          case 'number':
            return chalk.cyan(String(value));
          case 'string':
            return chalk.grey(value);
          case 'object':
            if (Array.isArray(value)) {
              return (
                chalk.magentaBright('[') +
                value.join(chalk.magentaBright(', ')) +
                chalk.magentaBright(']')
              );
            } else {
              return chalk.magentaBright(String(value));
            }
          default:
            return value;
        }
      };

      table(
        entries.map((e) => ({
          key: chalk.blueBright(e.key.replace(/^[\w]/, (a) => a.toUpperCase())),
          value: cv(e.value),
          comment: chalk.rgb(122, 154, 96)(e.comment),
        })),
        [
          { index: 'key', alias: chalk.bold(i('配置项', 'ConfigItem')) },
          { index: 'value', alias: chalk.bold(i('值', 'Value')) },
          { index: 'comment', alias: chalk.bold(i('注释', 'Comment')) },
        ]
      );
    },
    /**
     * 把使用的key保存在.history-keys文件中
     */
    saveHistoryKey() {
      const newKey = `[${formatDatetime(new Date())}] ${argv.action} key=${argv.key}\n`;
      if (fs.existsSync(conf.historyKeysPath)) {
        const head = load(conf.historyKeysPath).endsWith('\n') ? '' : '\n';
        fs.appendFileSync(conf.historyKeysPath, head + newKey);
      } else {
        fs.writeFileSync(conf.historyKeysPath, newKey);
      }
    },
  };
  return conf;
};

export const configs = createConfigManager();
