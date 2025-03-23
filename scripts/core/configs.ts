/**
 * @name Configs
 * @description
 * 依赖于locale、utils、logger、argv
 */
import fs from 'fs';
import path from 'path';
import { i, setLocale, lflag, lgrey, lyellow, lerr } from '../misc';
import { MA_RC, MA_DIR, MARC_JSON_EXAMPLE } from './consts';
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);

export const configs = (() => {
  // * 定义私有变量

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
  let _dir = {
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

  /**
   * 加载配置文件 \
   * Load configuration file
   * @returns undefined表示配置有误，本文件内会退出。如果无异常则返回配置 \
   */
  const _loadRc = () => {
    lgrey(`检测${MA_RC}中的配置`, `Checking configs in ${MA_RC}`);
    const configs = require(path.join(_root, MA_RC));
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
      if (typeof configs.dir.decrypted !== 'string') {
        mi(`'dir.decrypted'应为字符串`, `'dir.decrypted' should be a string`);
      }
      if (typeof configs.dir.encrypted !== 'string') {
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
      if (!lines.some((p) => p === _dir.decrypted)) {
        lgrey(
          `.gitignore文件并未包含要加密的文件夹'${_dir.decrypted}'，添加中...`,
          `It seems .gitignore in root directory does not contain '${_dir.decrypted}'. Adding...`
        );
        fs.appendFileSync(gitigorePath, `\n${_dir.decrypted}`);
        lgrey(
          `.gitignore已添加'${_dir.decrypted}'`,
          `'${_dir.decrypted}' is added to .gitignore`
        );
      }

      // 确认是否忽略了加密后的文件夹，如果忽略了则删掉
      if (lines.some((p) => p === _dir.encrypted)) {
        lyellow(
          `.gitignore包含了加密后的文件夹'${_dir.encrypted}'，如果需要git追踪它，请手动删除`,
          `.gitignore contains the encrypted folder '${_dir.encrypted}'. If you want git to track it, please remove it manually`
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

    _raw = _loadRc();
    !_raw && notInited();

    _encryptFileName = _raw.encryptFileName;
    _encryptFolderName = _raw.encryptFolderName;
    _exclude = _raw.exclude;
    _dir.decrypted = _raw.dir.decrypted;
    _dir.encrypted = _raw.dir.encrypted;
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
    loadRc: _loadRc,
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
        decrypted: _dir.decrypted,
        encrypted: _dir.encrypted,
      };
    },
    // * 工具函数
    excludes(dir: string, fileName: string) {
      return _exclude.includes(fileName);
    },
  };
})();
