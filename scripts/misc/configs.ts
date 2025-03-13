/**
 * @name Configs
 * @description
 * 依赖于locale、utils、logger、argv
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { i } from './locale';
import { formatDatetime, load, splitPath } from './utils';
import { log, lbgBlue, lbgRed, lgrey, lyellow, lerr, table } from './logger';
import { argv } from './argv';
import stringWidth from 'string-width';
import { cb, cb1, ck } from './color';
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);
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

  // 以下是参数里读取来的
  let _key = argv.key;

  // 以下是package.json读取出来的
  let _encryptFileName = true;
  let _encryptFolderName = true;
  let _exclude = [] as string[];
  let _directory = {
    decrypted: '',
    encrypted: '',
  };

  // * 定义私有函数

  const locateRoot = () => {
    const paths = splitPath(__dirname);
    lgrey('寻找package.json的目录作为root目录', 'Locating package.json as root directory');
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

  const loadPackageJsonConfigs = (rootPath: string) => {
    lgrey('检测package.json中的配置', 'Checking configs in package.json');
    const configs = require(path.join(rootPath, 'package.json')).cryption;
    // 定义化简函数
    const messages = [] as string[];
    const mi = (zh: string, en: string) => messages.push(i(zh, en));

    if (!configs) {
      mi('在package.json中找不到cryption配置', 'Cannot find cryption in package.json');
    } else {
      if (configs.encryptFileName !== true && configs.encryptFileName !== false) {
        mi(
          'cryption.encryptFileName 应该是boolean型',
          'cryption.encryptFileName should be a boolean'
        );
      }

      if (configs.encryptFolderName !== true && configs.encryptFolderName !== false) {
        mi(
          'cryption.encryptFolderName 应该是boolean型',
          'cryption.encryptFolderName should be a boolean'
        );
      }
      if (!configs.exclude) {
        mi(
          'cryption.exclude 未设置，需设置为字符串数组',
          'cryption.exclude should be an string array'
        );
      }
      if (!configs.directory) {
        mi('cryption.directory 未设置', 'cryption.directory is not set');
      } else {
        if (!configs.directory.decrypted) {
          mi(
            'cryption.directory.decrypted 未设置，需设置为字符串',
            'cryption.directory.decrypted should be a string'
          );
        }
        if (!configs.directory.encrypted) {
          mi(
            'cryption.directory.encrypted 未设置，需设置为字符串',
            'cryption.directory.encrypted should be a string'
          );
        }
      }
    }

    // 输出错误信息
    if (messages.length > 0) {
      lbgRed('加载配置失败', 'Load Configuration Failed');
      lerr(messages.join('\n'));
      lbgBlue('package.json中的配置例子如下：', 'An example in package.json should be like this :');
      argv.showPackageJsonConfigExample();
      throw new Error(i('package.json中的cryption配置无效', 'Invalid cryption in package.json'));
    }

    return configs;
  };

  /**
   * .gitignore文件必须包含待加密的文件夹、keys历史
   * 不能包含加密后的文件夹
   */
  const checkGitIgnore = () => {
    lgrey('检测.gitignore中的必要配置', 'Checking necessary items in .gitignore');
    const gitigorePath = path.join(_root, '.gitignore');
    if (fs.existsSync(gitigorePath)) {
      const content = fs.readFileSync(gitigorePath).toString();
      const lines = content.split('\n').map((line) => line.trim());

      // 确认是否忽略了加密前的文件夹，没有则加入
      if (!lines.some((p) => p === _directory.decrypted)) {
        lgrey(
          `.gitignore文件并未包含要加密的文件夹'${_directory.decrypted}'，添加中...`,
          `It seems .gitignore in root directory does not contain '${_directory.decrypted}'. Adding...`
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

      // 确认是否忽略了加密后的文件夹，如果忽略了则删掉
      if (lines.some((p) => p === _directory.encrypted)) {
        lyellow(
          `.gitignore包含了加密后的文件夹'${_directory.encrypted}'，如果需要git追踪它，请手动删除`,
          `.gitignore contains the encrypted folder '${_directory.encrypted}'. If you want git to track it, please remove it manually`
        );
      }
    } else {
      throw new Error(
        i(`${_root}下未找到.gitignore文件！`, `Cannot find .gitignore file in ${_root}!`)
      );
    }
  };

  // * 开始加载配置
  lbgBlue('加载配置表', 'Loading Configuration Table');
  log.incrIndent();

  // 以package.json的目录定为root
  _root = locateRoot();
  const config = loadPackageJsonConfigs(_root);

  _encryptFileName = config.encryptFileName;
  _encryptFolderName = config.encryptFolderName;
  _exclude = config.exclude;
  _directory.decrypted = config.directory.decrypted;
  _directory.encrypted = config.directory.encrypted;
  checkGitIgnore();

  log.decrIndent();

  const conf = {
    get key() {
      return _key;
    },
    get action() {
      return {
        isEncrypt: argv.isEncrypt,
        isDecrypt: argv.isDecrypt,
      };
    },
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
          key: 'encryptFileName',
          label: i('加密文件名', 'encryptFileName'),
          value: _encryptFileName,
          comment: i('是否加密文件名，默认为true', 'Whether to encrypt file name, default is true'),
        },
        {
          key: 'encryptFolderName',
          label: i('加密文件夹名', 'encryptFolderName'),
          value: _encryptFolderName,
          comment: i(
            '是否加密文件夹名，默认为true',
            'Whether to encrypt folder name, default is true'
          ),
        },
        {
          key: 'root',
          label: i(`根目录`, `root`),
          value: _root,
          comment: i('笔记的根目录', 'Root directory of the note'),
        },
        {
          key: 'decrypted',
          label: i(`加密前`, `decrypted`),
          value: _directory.decrypted,
          comment: i('要加密的文件夹', 'The folder to be encrypted'),
        },
        {
          key: 'encrypted',
          label: i(`加密后`, `encrypted`),
          value: _directory.encrypted,
          comment: i('加密后的文件将放在这个文件夹', 'Encrypted files will be put in this folder'),
        },
        {
          key: 'exclude',
          label: i('忽略', 'exclude'),
          value: _exclude,
          comment: i(
            '要加密的文件夹下，不加密的文件/文件夹',
            'Folders in decrypted directory will not be encrypted'
          ),
        },
        {
          key: 'action',
          label: i('操作', 'action'),
          value: argv.action,
          comment: i(
            '会清空目标文件夹，' + chalk.underline('注意备份!'),
            'Will clear the target folder. ' + chalk.underline('Backup first!')
          ),
        },
        {
          key: 'key',
          label: i('密钥', 'key'),
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
            return cb(String(value));
          case 'number':
            return chalk.cyan(String(value));
          case 'string':
            return chalk.gray(value);
          case 'object':
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return cb1('[]');
              }

              let width = 0;
              for (let i = 0; i < Math.min(15, value.length); i++) {
                width += stringWidth(value[i]);
              }

              if (width <= 15) {
                const v = chalk.grey(`"${value.join(`", "`)}"`);
                return `${cb1('[')}${v}${cb1(']')}`;
              } else {
                const TAB = '  ';
                const v = chalk.grey(`"${value.join(`",\n${TAB}"`)}"`);
                return `${cb1('[\n')}${TAB}${v}${cb1('\n]')}`;
              }
            } else {
              return cb1(String(value));
            }
          default:
            return value;
        }
      };

      table(
        entries.map((e) => ({
          label: ck(e.label.replace(/^[\w]/, (a) => a.toUpperCase())),
          value: e.key === 'key' ? chalk.red.underline(e.value) : cv(e.value),
          comment: chalk.rgb(122, 154, 96)(e.comment),
        })),
        [
          { index: 'label', alias: chalk.white(i('配置项', 'ConfigItem')) },
          { index: 'value', alias: chalk.white(i('值', 'Value')) },
          { index: 'comment', alias: chalk.white(i('注释', 'Comment')) },
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
