import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import stringWidth from 'string-width';
import { xor } from './cryptor';

// 一些常用的单独导出的函数
export const i = (i18nConfig: any) => i18nConfig[privates.locale];

export const tab = (t: TemplateStringsArray, ...values: any[]) =>
  values.reduce((result, str, i) => result + t[i] + String(str), '  ') + t[t.length - 1];

/**
 * 把一个地址拆分成数组
 * @param filePath 文件路径
 * @returns 路径数组
 */
const splitPath = (filePath: string) => {
  const list = [] as string[];
  const _detect = (filePath: string) => {
    const father = path.dirname(filePath);
    if (father !== filePath) {
      const { base } = path.parse(filePath);
      list.unshift(base);
      _detect(father);
    } else {
      list.unshift(father);
    }
  };
  _detect(filePath);
  return list;
};

// # 工具函数
export const util = {
  actualWidth(text: string) {
    return stringWidth(text);
  },

  /**
   * 按实际宽度补空格
   * @param text
   * @param length
   * @param direction
   * @returns
   */
  padAlign(text: string, length: number, direction: 'left' | 'right' = 'right') {
    const width = stringWidth(text);
    if (direction === 'left') {
      return ' '.repeat(length - width) + text; // 按实际宽度补空格
    }
    if (direction === 'right') {
      return text + ' '.repeat(length - width); // 按实际宽度补空格
    }
    throw new Error("direction should be 'left' or 'right'");
  },

  /**
   * 递归获取文件夹下的所有文件
   * @param dir 目标文件夹路径
   * @param excludes 用于判断是否不包含这个文件，返回true则跳过该文件
   * @returns 文件路径数组
   */
  getAllFiles(dir: string, excludes: (fileName: string) => boolean): string[] {
    const list = [] as string[];
    const _detect = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (excludes(path.join(dir, file))) {
          continue; // 跳过部分文件夹
        }
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        stat.isDirectory() ? _detect(filePath) : list.push(filePath);
      }
    };
    _detect(dir);
    return list;
  },

  /**
   * 把一个地址拆分成数组
   * @param filePath
   * @returns
   */
  splitPath,

  /**
   * 将路径转换为加密路径，如果encryptFolderName为false那么不会加密目录
   * @param p 原路径
   * @returns 加密路径
   */
  toEncryptedPath(p: string) {
    const getChangedFolder = (p: string) => {
      const pathSplit = util.splitPath(p);
      const index = pathSplit.findIndex((p) => p === privates.directory.decrypted);
      if (index === -1) {
        throw new Error(
          i({
            zh: '找不到需要加密的文件夹',
            en: 'Cannot find the folder to be encrypted',
          })
        );
      }
      pathSplit[index] = privates.directory.encrypted;
      return { pathSplit, index };
    };

    // OL 此处进行懒重载
    if (configs.encryptFolderName) {
      util.toEncryptedPath = (p: string) => path.join(...getChangedFolder(p).pathSplit);
    } else {
      util.toEncryptedPath = (p: string) => {
        const { pathSplit, index } = getChangedFolder(p);
        for (let i = index + 1; i < pathSplit.length; i++) {
          pathSplit[i] = xor.encrypt(pathSplit[i]);
        }
        path.join(...pathSplit);
      };
    }

    // 如果需要加密文件夹名，那么还要进一步加密
    return util.toEncryptedPath(p);
  },

  /**
   * 将路径转换为解密路径
   * @param p 原路径
   * @returns 解密路径
   */
  toDecryptedPath(p: string) {
    const getChangedFolder = (p: string) => {
      const pathSplit = util.splitPath(p);
      const index = pathSplit.findIndex((p) => p === privates.directory.encrypted);
      if (index === -1) {
        throw new Error(
          i({
            zh: '找不到需要解密的文件夹',
            en: 'Cannot find the folder to be decrypted',
          })
        );
      }
      pathSplit[index] = privates.directory.decrypted;
      return { pathSplit, index };
    };

    // OL 此处进行懒重载
    if (configs.encryptFolderName) {
      util.toDecryptedPath = (p: string) => path.join(...getChangedFolder(p).pathSplit);
    } else {
      util.toDecryptedPath = (p: string) => {
        const { pathSplit, index } = getChangedFolder(p);
        for (let i = index + 1; i < pathSplit.length; i++) {
          pathSplit[i] = xor.decrypt(pathSplit[i]);
        }
        path.join(...pathSplit);
      };
    }

    // 如果需要加密文件夹名，那么还要进一步加密
    return util.toDecryptedPath(p);
  },

  /**
   * 加解密文件路径，这一定是文件地址在访问，而非目录
   * @param origin 原路径
   * @param form 从哪个文件夹
   * @param to 加解密到哪个文件夹
   * @param cryptor 加解密函数
   */
  cryptFilePath(origin: string, form: string, to: string, cryptor: (s: string) => string) {},

  /**
   * 读取文件
   * @param filePath 源文件路径
   * @returns 文件内容
   */
  load(filePath: string): string {
    // 读取文件内容
    return fs.readFileSync(filePath).toString();
  },

  /**
   * 保存数据到文件
   * @param data 数据内容
   * @param folder 文件夹路径
   * @param fileName 文件名
   */
  save(data: string, filePath: string) {
    const parsed = path.parse(filePath);
    // 创建文件夹
    if (!fs.existsSync(parsed.dir)) {
      fs.mkdirSync(parsed.dir, { recursive: true });
    }
    // 写入到新文件
    fs.writeFileSync(filePath, data);
  },
};

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
        console.log(
          chalk.gray(
            i({
              zh: '.gitignore文件并未包含要加密的文件夹，添加中',
              en: 'It seems .gitignore in root directory does not contain',
            })
          )
        );
        fs.appendFileSync(gitigorePath, `\n${privates.directory.decrypted}`);
        console.log(
          chalk.gray(
            i({
              zh: `.gitignore已添加'${privates.directory.decrypted}'`,
              en: `'${privates.directory.decrypted}' is added to .gitignore`,
            })
          )
        );
      }

      // 确认是否忽略了.history-keys文件，没有则加入
      if (!lines.some((p) => p === privates.historyKeys)) {
        console.log(
          chalk.gray(
            i({
              zh: `.gitignore文件并未包含'${privates.historyKeys}'，添加中...`,
              en: `It seems .gitignore does not contain '${privates.historyKeys}'. Adding...`,
            })
          )
        );
        fs.appendFileSync(gitigorePath, `\n${privates.historyKeys}`);
        console.log(
          chalk.gray(
            i({
              zh: `.gitignore已添加'${privates.historyKeys}'`,
              en: `'${privates.historyKeys}' is added to .gitignore`,
            })
          )
        );
      }
    } else {
      throw new Error(
        i({
          zh: `${privates.root}下未找到.gitignore文件！`,
          en: `Cannot find .gitignore file in ${privates.root}!`,
        })
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
        chalk.red(
          i({
            zh: '在package.json中找不到encryptConfigs配置',
            en: 'Cannot find encryptConfigs in package.json',
          })
        )
      );
    } else {
      if (configs.encryptFileName !== true && configs.encryptFileName !== false) {
        messages.push(
          chalk.red(
            i({
              zh: 'encryptConfigs.encryptFileName 应该是boolean型',
              en: 'encryptConfigs.encryptFileName should be a boolean',
            })
          )
        );
      }

      if (configs.encryptFolderName !== true && configs.encryptFolderName !== false) {
        messages.push(
          chalk.red(
            i({
              zh: 'encryptConfigs.encryptFolderName 应该是boolean型',
              en: 'encryptConfigs.encryptFolderName should be a boolean',
            })
          )
        );
      }
      if (!configs.exclude) {
        messages.push(
          chalk.red(
            i({
              zh: 'encryptConfigs.exclude 未设置，需设置为字符串数组',
              en: 'encryptConfigs.exclude should be an string array',
            })
          )
        );
      }
      if (!configs.directory) {
        messages.push(
          chalk.red(
            i({
              zh: 'encryptConfigs.directory 未设置',
              en: 'encryptConfigs.directory is not set',
            })
          )
        );
      } else {
        if (!configs.directory.decrypted) {
          messages.push(
            chalk.red(
              i({
                zh: 'encryptConfigs.directory.decrypted 未设置，需设置为字符串',
                en: 'encryptConfigs.directory.decrypted should be a string',
              })
            )
          );
        }
        if (!configs.directory.encrypted) {
          messages.push(
            chalk.red(
              i({
                zh: 'encryptConfigs.directory.encrypted 未设置，需设置为字符串',
                en: 'encryptConfigs.directory.encrypted should be a string',
              })
            )
          );
        }
      }
    }

    // 输出错误信息
    if (messages.length > 0) {
      console.log(
        chalk.bgRed(
          i({
            zh: '加载配置失败',
            en: 'Load Configuration Failed',
          })
        )
      );
      console.log(messages.join('\n'));
      console.log(
        chalk.bgBlue(
          i({
            zh: 'package.json中的配置例子如下：',
            en: 'An example in package.json should be like this :',
          })
        )
      );
      console.log(example);
      throw new Error(
        i({
          zh: 'package.json中的encryptConfigs配置无效',
          en: 'Invalid encryptConfigs in package.json',
        })
      );
    }
  },
  getPackageJson() {
    const paths = splitPath(__dirname);
    console.log('paths', paths);
    for (let i = paths.length; i >= 1; i--) {
      const root = path.join(...paths.slice(0, i));
      const p = path.join(root, 'package.json');
      if (fs.existsSync(p)) {
        privates.root = root;
        return require(p);
      }
    }
    console.log(
      chalk.bgRed(
        i({
          zh: '加载配置失败。找不到package.json',
          en: 'Load Configuration Failed. Cannot find package.json',
        })
      )
    );
    throw new Error(
      i({
        zh: '找不到package.json',
        en: 'Cannot find package.json',
      })
    );
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
      const maxKeyLength = i({
        en: 4 + Math.max(...keys.map((k) => util.actualWidth(k.en))),
        zh: 2 + Math.max(...keys.map((k) => util.actualWidth(k.zh))),
      });
      const pk = (key: string) =>
        util.padAlign(key, maxKeyLength).replace(/^[\w]/, (a) => a.toUpperCase());

      const get = (key: { en: string; zh: string }) => {
        let r = { value: '', key: '', comment: '' };
        switch (key.en) {
          case 'encryptFileName':
            r.value = String(privates.encryptFileName);
            r.key = chalk.blue(pk(i(key)));
            r.comment = i({
              zh: '是否加密文件名，默认为true',
              en: 'Whether to encrypt file name, default is true',
            });
            break;
          case 'encryptFolderName':
            r.value = String(privates.encryptFolderName);
            r.key = chalk.blue(pk(i(key)));
            r.comment = i({
              zh: '是否加密文件夹名，默认为true',
              en: 'Whether to encrypt folder name, default is true',
            });
            break;
          case 'root':
            r.value =
              privates.root.length > 24 ? path.relative(__dirname, privates.root) : privates.root;
            r.key = chalk.rgb(147, 183, 236)(pk(' ├─ ' + i(key)));
            r.comment = i({
              zh: '笔记的根目录',
              en: 'Root directory of the note',
            });
            break;
          case 'decrypted':
            r.value = privates.directory.decrypted;
            r.key = chalk.rgb(147, 183, 236)(pk(' ├─ ' + i(key)));
            r.comment = i({
              zh: '要加密的文件夹',
              en: 'The folder to be encrypted',
            });
            break;
          case 'encrypted':
            r.value = privates.directory.encrypted;
            r.key = chalk.rgb(147, 183, 236)(pk(' └─ ' + i(key)));
            r.comment = i({
              zh: '加密后的文件将放在这个文件夹',
              en: 'Encrypted files will be put in this folder',
            });
            break;
          case 'exclude':
            r.value = `[${privates.exclude.join(', ')}]`;
            r.key = chalk.blue(pk(i(key)));
            r.comment = i({
              zh: '要加密的文件夹下，不加密的文件/文件夹',
              en: 'Folders in decrypted directory will not be encrypted',
            });
            break;
          case 'action':
            r.value = privates.action;
            r.key = chalk.blue(pk(i(key)));
            break;
          case 'key':
            r.value = privates.key;
            r.key = chalk.blue(pk(i(key)));
            r.comment = i({
              zh: chalk.bold.underline('请记住') + '密钥',
              en: 'Promise you will ' + chalk.bold.underline('remember it'),
            });
            break;
          default:
            throw new Error(
              i({
                zh: '无法展示这个字段 key = ' + key,
                en: "Can't display this config key = " + key,
              })
            );
        }
        return r;
      };

      const values = keys.map((key) => get(key));
      const maxValueLength = Math.max(...values.map((v) => util.actualWidth(v.value)));
      const pv = (v: string) => util.padAlign(v, maxValueLength);

      const c = chalk.rgb(122, 154, 96);
      for (let index = 0; index < keys.length; index++) {
        const v = values[index];
        if (keys[index].en === 'root') {
          console.log(chalk.blue(pk(i({ en: tab`Directory`, zh: tab`目录配置` }))));
        }
        if (keys[index].en === 'key') {
          v.key = chalk.red(v.key);
        }
        console.log(tab`${v.key} : ${pv(v.value)} ${v.comment ? c(' // ' + v.comment) : ''}`);
      }
    },
  };
  return u;
};

export const configs = createConfigManager();
