import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import stringWidth from 'string-width';

// 一些常用的单独导出的函数
export const i = (i18nConfig: any) => i18nConfig[privates.locale];

export const tab = (t: TemplateStringsArray, ...values: any[]) =>
  values.reduce((result, str, i) => result + t[i] + String(str), '  ') + t[t.length - 1];

type Fn<T extends any[], R> = (...args: T) => R;
/**
 * 缓存函数结果
 * @param fn 要缓存的函数
 * @returns 带缓存功能的函数
 */
export const memoize = <T extends any[], R>(fn: Fn<T, R>): Fn<T, R> => {
  const cache = new Map<string, R>();

  return (...args: T): R => {
    // 将参数序列化以支持多个参数
    const key = args.reduce((prev, current) => prev + '_' + String(current), '');
    if (cache.has(key)) {
      return cache.get(key)!; // `!` 表示断言，告诉 TS 这里一定有值
    } else {
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }
  };
};

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
   * 将路径转换为加密路径
   * @param p 原路径
   * @returns 加密路径
   */
  toEncryptedPath(p: string) {
    // $ 此处进行懒重载
    const list = util.splitPath(p);
    const index = list.findIndex((p) => p === privates.directory.decrypted);
    if (index === -1) {
      throw new Error(
        i({
          zh: '找不到需要加密的文件夹',
          en: 'Cannot find the folder to be encrypted',
        })
      );
    }
    list[index] = privates.directory.encrypted;
    // 如果需要加密文件夹名，那么还要进一步加密
    return path.join(...list);
  },

  /**
   * 将路径转换为解密路径
   * @param p 原路径
   * @returns 解密路径
   */
  toDecryptedPath(p: string) {
    const list = util.splitPath(p);
    const index = list.findIndex((p) => p === privates.directory.decrypted);
    if (index === -1) {
      throw new Error(
        i({
          zh: '找不到未加密的文件夹',
          en: 'Cannot find the folder to be decrypted',
        })
      );
    }
    list[index] = privates.directory.decrypted;
    return path.join(...list);
  },

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
  save(data: string, folder: string, fileName: string) {
    // 创建文件夹
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    // 写入到新文件
    fs.writeFileSync(path.join(folder, fileName), data);
  },
};

const privates = {
  /**
   * 语言，从执行参数或系统中获取
   */
  locale: '',

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
  checkDecryptedIgnored() {
    const gitigorePath = path.join(privates.root, '.gitignore');
    if (fs.existsSync(gitigorePath)) {
      const content = fs.readFileSync(gitigorePath);
      const lines = content
        .toString()
        .split('\n')
        .map((line) => line.trim());
      if (!lines.some((p) => p.match(new RegExp(`${privates.directory.decrypted}`)))) {
        console.log(
          chalk.bgRed(
            `${i({
              zh: '.gitignore文件可能并未包含要加密的文件夹',
              en: 'It seems .gitignore in root directory does not contain',
            })} '${privates.directory.decrypted}'. ${chalk.underline(
              i({
                zh: '未加密的文件可能被推送到远程仓库！',
                en: 'Unencrypted files may be pushed to remote repository!',
              })
            )}`
          )
        );
        throw new Error(
          i({
            zh: '未在.gitignore中忽略加密文件夹',
            en: 'Decrypted directory is not ignored in .gitignore',
          })
        );
      }
    }
  },
  checkPackageJson(encryptConfigs: any) {
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
    if (!encryptConfigs) {
      messages.push(
        chalk.red(
          i({
            zh: '在package.json中找不到encryptConfigs配置',
            en: 'Cannot find encryptConfigs in package.json',
          })
        )
      );
    } else {
      if (encryptConfigs.encryptFolderName !== true && encryptConfigs.encryptFolderName !== false) {
        messages.push(
          chalk.red(
            i({
              zh: 'encryptConfigs.encryptFolderName 应该是boolean型',
              en: 'encryptConfigs.encryptFolderName should be a boolean',
            })
          )
        );
      }
      if (!encryptConfigs.exclude) {
        messages.push(
          chalk.red(
            i({
              zh: 'encryptConfigs.exclude 未设置，需设置为字符串数组',
              en: 'encryptConfigs.exclude should be an string array',
            })
          )
        );
      }
      if (!encryptConfigs.directory) {
        messages.push(
          chalk.red(
            i({
              zh: 'encryptConfigs.directory 未设置',
              en: 'encryptConfigs.directory is not set',
            })
          )
        );
      } else {
        if (!encryptConfigs.directory.decrypted) {
          messages.push(
            chalk.red(
              i({
                zh: 'encryptConfigs.directory.decrypted 未设置，需设置为字符串',
                en: 'encryptConfigs.directory.decrypted should be a string',
              })
            )
          );
        }
        if (!encryptConfigs.directory.encrypted) {
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

  privates.encryptFolderName = config.encryptFolderName === false ? false : true;
  privates.exclude = config.exclude;
  privates.directory.decrypted = config.directory.decrypted;
  privates.directory.encrypted = config.directory.encrypted;
  privates.action = '';
  privates.key = '';

  privates.checkDecryptedIgnored();

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
