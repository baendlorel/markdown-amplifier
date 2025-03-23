/**
 * @name Configs
 * @description
 * 依赖于locale、utils、logger、argv
 */
import fs from 'fs';
import path from 'path';
import { i, setLocale, lgrey, lyellow } from '../misc';
import { locateRoot, loadRc } from './loader';
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);

export const configs = (() => {
  // * 定义私有变量

  let _initialized = false;

  /**
   * 根目录，层层向上查找.ma所在的目录 \
   * Root directory, located by recursively searching parent directories that contains .ma
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

  /**
   * .gitignore文件必须包含待加密的文件夹、akasha文件，且不能包含加密后的文件夹 \
   * 如果不满足会自动调整 \
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

  return {
    // * 初始化用
    init: () => {
      _root = locateRoot();
      if (!_root) {
        _initialized = false;
        return;
      }

      _raw = loadRc(_root);
      if (!_raw) {
        _initialized = false;
        return;
      }

      const localeText = setLocale(_raw.locale) === 'zh' ? '中文' : 'English';
      lgrey(
        '检测到语言配置，设为' + localeText,
        'Locale configuration detected, set to ' + localeText
      );

      const crypt = _raw.crypt;
      _encryptFileName = crypt.encryptFileName;
      _encryptFolderName = crypt.encryptFolderName;
      _exclude = crypt.exclude;
      _dir.decrypted = crypt.dir.decrypted;
      _dir.encrypted = crypt.dir.encrypted;

      _ensureGitIgnore();

      _initialized = true;
    },
    setKey(key: string) {
      _key = key;
      lgrey(`密钥为 ${key}`, `Key is set to '${key}'`);
    },
    // * 配置表
    get initialized() {
      return _initialized;
    },
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
    get dir() {
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
