/**
 * @name Configs
 * @description
 * 依赖于locale、utils、logger、argv
 */
import fs from 'fs';
import path from 'path';
import { i, setLocale, lflag, lgrey, lyellow, lerr, MARC_JSON_EXAMPLE } from '../misc';
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);

export const configs = (() => {
  // * 定义私有变量

  /**
   * 核心文件夹名称 \
   * Core folder name
   */
  const MA_DIR = '.ma';

  /**
   * 配置文件名 \
   * config file name
   */
  const MA_CONFIG = '.marc.json';

  /**
   * 根目录，层层向上查找.marc.json所在的文件夹 \
   * Root directory, located by recursively searching parent directories that contains .marc.json
   */
  let _root = '';

  // 以下是commander里读取来的
  // Loaded from commander
  let _key = '';

  // 以下是markdown-amplifier.json读取出来的
  // Loaded from markdown-amplifier.json
  let _encryptFileName = true;
  let _encryptFolderName = true;
  let _exclude = [] as string[];
  let _directory = {
    decrypted: '',
    encrypted: '',
  };
  let _raw = {} as any;

  // * 定义私有函数
  // * Private functions

  /**
   * 以核心文件夹MA_DIR来定位根目录 \
   * Locate root directory by core folder MA_DIR
   * @returns
   */
  const _locateRoot = () => {
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

  const _loadJson = () => {
    lgrey(`检测${MA_CONFIG}中的配置`, `Checking configs in ${MA_CONFIG}`);
    const configs = require(path.join(_root, MA_CONFIG));
    // 定义化简函数
    const messages = [] as string[];
    const mi = (zh: string, en: string) => messages.push(i(zh, en));

    if (!configs) {
      lflag(`在${MA_CONFIG}中找不到cryption配置`, `Cannot find note in ${MA_CONFIG}`);
      return undefined;
    } else {
      if (configs.encryptFileName !== true && configs.encryptFileName !== false) {
        mi(
          'note.encryptFileName 应该是boolean型',
          'note.encryptFileName should be a boolean'
        );
      }
      if (configs.encryptFolderName !== true && configs.encryptFolderName !== false) {
        mi(
          'note.encryptFolderName 应该是boolean型',
          'note.encryptFolderName should be a boolean'
        );
      }
      if (!configs.exclude) {
        mi(
          'note.exclude 未设置，需设置为字符串数组',
          'note.exclude should be an string array'
        );
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
      lerr(messages.join('\n'));
      lflag(
        `${MA_CONFIG}中的配置例子如下：`,
        `An example in ${MA_CONFIG} should be like this :`
      );
      console.log(MARC_JSON_EXAMPLE(i));
      throw new Error(
        i(`${MA_CONFIG}中的cryption配置无效`, `Invalid note in ${MA_CONFIG}`)
      );
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

  const _init = () => {
    const notInited = () => {
      lyellow(
        `尚未初始化，请先在笔记目录下执行ma init`,
        `Not initialized yet, please run 'ma init' in the note directory first`
      );
      process.exit(1);
    };

    _root = _locateRoot();
    !_root && notInited();

    _raw = _loadJson();
    !_raw && notInited();

    _encryptFileName = _raw.encryptFileName;
    _encryptFolderName = _raw.encryptFolderName;
    _exclude = _raw.exclude;
    _directory.decrypted = _raw.directory.decrypted;
    _directory.encrypted = _raw.directory.encrypted;
    const localeText = setLocale(_raw.locale) === 'zh' ? '中文' : 'English';
    lgrey('设置语言为' + localeText, 'Locale is set to ' + localeText);
    _ensureGitIgnore();
  };

  _init();

  return {
    // * 初始化用
    setKey(key: string) {
      _key = key;
      lgrey(`密钥为 ${key}`, `Key is set to '${key}'`);
    },
    /**
     * 核心文件夹名称 \
     * Core folder name
     */
    get madir() {
      return MA_DIR;
    },
    /**
     * 配置文件名 \
     * config file name
     */
    get marc() {
      return MA_CONFIG;
    },
    // * 配置表
    get raw() {
      return _raw;
    },
    get key() {
      return _key;
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
