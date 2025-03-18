/**
 * @name Configs
 * @description
 * 依赖于locale、utils、logger、argv
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import stringWidth from 'string-width';
import { i, setLocale } from './locale';
import { splitPath } from './utils';
import { cb, cb1, ck } from './color';
import { log, lflag, lbgRed, lgrey, lyellow, lerr, table } from './logger';
import { PACKAGEJSON_CRYPTION_CONFIG_EXAMPLE } from './consts';
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);

export const configs = (() => {
  // * 定义私有变量
  /**
   * akasha文件名 \
   * akasha file name
   */
  const _akasha = '.note-akasha.json' as const;

  /**
   * 根目录，层层向上查找package.json所在的文件夹 \
   * Root directory, located by recursively searching parent directories that contains package.json
   */
  let _root = '';

  // 以下是commander里读取来的
  // Loaded from commander
  let _key = '';

  // 以下是package.json读取出来的
  // Loaded from package.json
  let _encryptFileName = true;
  let _encryptFolderName = true;
  let _exclude = [] as string[];
  let _directory = {
    decrypted: '',
    encrypted: '',
  };

  // * 定义私有函数
  // * Private functions
  const _locateRoot = () => {
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

  const _loadPackageJsonConfigs = () => {
    lgrey('检测package.json中的配置', 'Checking configs in package.json');
    const configs = require(path.join(_root, 'package.json')).note;
    // 定义化简函数
    const messages = [] as string[];
    const mi = (zh: string, en: string) => messages.push(i(zh, en));

    if (!configs) {
      mi('在package.json中找不到cryption配置', 'Cannot find note in package.json');
    } else {
      if (configs.encryptFileName !== true && configs.encryptFileName !== false) {
        mi('note.encryptFileName 应该是boolean型', 'note.encryptFileName should be a boolean');
      }

      if (configs.encryptFolderName !== true && configs.encryptFolderName !== false) {
        mi('note.encryptFolderName 应该是boolean型', 'note.encryptFolderName should be a boolean');
      }
      if (!configs.exclude) {
        mi('note.exclude 未设置，需设置为字符串数组', 'note.exclude should be an string array');
      }
      if (!configs.directory) {
        mi('note.directory 未设置', 'note.directory is not set');
      } else {
        if (!configs.directory.decrypted) {
          mi(
            'note.directory.decrypted 未设置，需设置为字符串',
            'note.directory.decrypted should be a string'
          );
        }
        if (!configs.directory.encrypted) {
          mi(
            'note.directory.encrypted 未设置，需设置为字符串',
            'note.directory.encrypted should be a string'
          );
        }
      }
    }

    // 输出错误信息
    if (messages.length > 0) {
      lbgRed('加载配置失败', 'Load Configuration Failed');
      lerr(messages.join('\n'));
      lflag('package.json中的配置例子如下：', 'An example in package.json should be like this :');
      console.log(PACKAGEJSON_CRYPTION_CONFIG_EXAMPLE(i));
      throw new Error(i('package.json中的cryption配置无效', 'Invalid note in package.json'));
    }

    return configs;
  };

  /**
   * .gitignore文件必须包含待加密的文件夹、akasha文件，且不能包含加密后的文件夹 \
   *  如果不满足会自动调整 \
   * .gitignore must contain the folder to be encrypted, akasha file, and must not contain the encrypted folder \
   * If not, it will be adjusted automatically
   */
  const _ensureGitIgnore = () => {
    lgrey('检测.gitignore中的必要配置', 'Checking necessary items in .gitignore');
    const gitigorePath = path.join(_root, '.gitignore');
    if (fs.existsSync(gitigorePath)) {
      const content = fs.readFileSync(gitigorePath, 'utf-8');
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

      // // 确认是否忽略了.history-keys文件，没有则加入
      // if (!lines.some((p) => p === _historyKeys)) {
      //   lgrey(
      //     `.gitignore文件并未包含'${_historyKeys}'，添加中...`,
      //     `It seems .gitignore does not contain '${_historyKeys}'. Adding...`
      //   );
      //   fs.appendFileSync(gitigorePath, `\n${_historyKeys}`);
      //   lgrey(`.gitignore已添加'${_historyKeys}'`, `'${_historyKeys}' is added to .gitignore`);
      // }

      // 确认是否忽略了.note.json文件，没有则加入
      if (!lines.some((p) => p === _akasha)) {
        lgrey(
          `.gitignore文件并未包含'${_akasha}'，添加中...`,
          `It seems .gitignore does not contain '${_akasha}'. Adding...`
        );
        fs.appendFileSync(gitigorePath, `\n${_akasha}`);
        lgrey(`.gitignore已添加'${_akasha}'`, `'${_akasha}' is added to .gitignore`);
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

  /**
   * 展示已加载好的配置 \
   * Display loaded configurations
   */
  const _display = () => {
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
  };

  /**
   * 初始化 \
   * Initialize
   */
  const _init = () => {
    // * 开始加载配置
    // * Start loading configuration
    lflag('加载配置表', 'Loading Configuration Table');
    log.incrIndent();
    _root = _locateRoot();
    const config = _loadPackageJsonConfigs();
    _encryptFileName = config.encryptFileName;
    _encryptFolderName = config.encryptFolderName;
    _exclude = config.exclude;
    _directory.decrypted = config.directory.decrypted;
    _directory.encrypted = config.directory.encrypted;
    _ensureGitIgnore();
    _display();
    log.decrIndent();
  };

  return {
    // * 初始化用
    init: _init,
    setKey(key: string) {
      _key = key;
      lflag('设置密钥', 'Setting key');
      log.incrIndent();
      lgrey(`密钥为 ${key}`, `Key is set to '${key}'`);
      log.decrIndent();
    },
    setLocale(locale: string) {
      const localeText = setLocale(locale) === 'zh' ? '中文' : 'English';
      lflag('加载语言设置', 'Load locale setting');
      log.incrIndent();
      lgrey('设置语言为' + localeText, 'Locale is set to ' + localeText);
      log.decrIndent();
    },
    // * 配置表
    get key() {
      return _key;
    },
    get akashaPath() {
      return path.join(_root, _akasha);
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
        decrypted: _directory.decrypted,
        encrypted: _directory.encrypted,
      };
    },
    // * 工具函数
    excludes(dir: string, fileName: string) {
      return _exclude.includes(fileName);
    },
  };
})();
