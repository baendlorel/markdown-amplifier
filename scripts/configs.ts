import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { actualWidth, padAlign, splitPath } from './utils';

export const i = (i18nConfig: any) => config.getI18N(i18nConfig);

class Configuration {
  #locale: string;
  #exclude: string[] = [];
  #rootDir: string;
  #directory: {
    secret: string;
    encrypted: string;
  };
  #action: string;
  #key: string;

  constructor() {
    this.#initLocale();
    // 寻找配置文件package.json
    const config = this.#getPackageJson().encryptConfigs;
    this.#check(config);

    this.#exclude = config.exclude;
    this.#directory = {
      secret: config.directory.secret,
      encrypted: config.directory.encrypted,
    };
    this.#action = '';
    this.#key = '';

    this.#checkSecretIgnored();
  }

  #initLocale() {
    // 先看参数里有没有
    if (process.argv.includes('--en')) {
      this.#locale = 'en';
      return;
    }
    if (process.argv.includes('--zh')) {
      this.#locale = 'zh';
      return;
    }

    // 如果没有参数，再从系统中获取
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale.slice(0, 2) === 'zh') {
      this.#locale = 'zh';
    } else {
      this.#locale = 'en';
    }
  }

  #checkSecretIgnored() {
    const gitigorePath = path.join(this.#rootDir, '.gitignore');
    if (fs.existsSync(gitigorePath)) {
      const content = fs.readFileSync(gitigorePath);
      const lines = content
        .toString()
        .split('\n')
        .map((line) => line.trim());
      if (!lines.some((p) => p.match(new RegExp(`${this.#directory.secret}`)))) {
        console.log(
          chalk.bgRed(
            `${i({
              zh: '.gitignore文件可能并未包含要加密的文件夹',
              en: 'It seems .gitignore in root directory does not contain',
            })} '${this.#directory.secret}'. ${chalk.underline(
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
            en: 'Secret directory is not ignored in .gitignore',
          })
        );
      }
    }
  }

  #check(encryptConfigs: any) {
    const k = chalk.rgb(177, 220, 251);
    const v = chalk.rgb(193, 148, 125);
    const p = chalk.rgb(202, 123, 210);
    const b = chalk.rgb(93, 161, 248);
    const y = chalk.rgb(245, 214, 74);
    const example = `${y(`{`)}
  ...other configs,
  ${k(`"encryptConfigs"`)}: ${p(`{`)}
      ${k(`"exclude"`)}: ${b(`[]`)},
      ${k(`"directory"`)}: ${b(`{`)}
        ${k(`"secret"`)}: ${v(`"secret"`)},
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
      if (!encryptConfigs.exclude) {
        messages.push(
          chalk.red(
            i({
              zh: 'encryptConfigs.exclude未设置，需设置为字符串数组',
              en: 'encryptConfigs.exclude should be an string array',
            })
          )
        );
      }
      if (!encryptConfigs.directory) {
        messages.push(
          chalk.red(
            i({
              zh: 'encryptConfigs.directory未设置',
              en: 'encryptConfigs.directory is not set',
            })
          )
        );
      } else {
        if (!encryptConfigs.directory.secret) {
          messages.push(
            chalk.bgRed(
              i({
                zh: 'encryptConfigs.directory.secret未设置，需设置为字符串',
                en: 'encryptConfigs.directory.secret should be a string',
              })
            )
          );
        }
        if (!encryptConfigs.directory.encrypted) {
          messages.push(
            chalk.bgRed(
              i({
                zh: 'encryptConfigs.directory.encrypted未设置，需设置为字符串',
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
  }

  #getPackageJson() {
    const paths = splitPath(__dirname);
    console.log('paths', paths);
    for (let i = paths.length; i >= 1; i--) {
      const root = path.join(...paths.slice(0, i));
      const p = path.join(root, 'package.json');
      if (fs.existsSync(p)) {
        this.#rootDir = root;
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
  }

  get rootDir() {
    return this.#rootDir;
  }

  get secretDir() {
    return path.join(this.#rootDir, this.#directory.secret);
  }
  get encryptedDir() {
    return path.join(this.#rootDir, this.#directory.encrypted);
  }

  set(key: string, action: string) {
    this.#key = key;
    this.#action = action.replace('--', '');
  }

  excludes(folder: string) {
    return this.#exclude.includes(folder);
  }

  display() {
    const keys = [
      { en: 'root', zh: '根' },
      { en: 'secret', zh: '加密前' },
      { en: 'encrypted', zh: '加密后' },
      { en: 'exclude', zh: '忽略目录' },
      { en: 'action', zh: '操作' },
      { en: 'key', zh: '密钥' },
    ];
    const maxKeyLength = i({
      en: 4 + Math.max(...keys.map((k) => actualWidth(k.en))),
      zh: 2 + Math.max(...keys.map((k) => actualWidth(k.zh))),
    });
    const pk = (key: string) =>
      padAlign(key, maxKeyLength).replace(/^[\w]/, (a) => a.toUpperCase());

    const get = (key: { en: string; zh: string }) => {
      let r = { value: '', key: '', comment: '' };
      switch (key.en) {
        case 'root':
          r.value = path.relative(__dirname, this.#rootDir);
          r.key = chalk.rgb(147, 183, 236)(pk(' ├─ ' + i(key)));
          r.comment = i({
            zh: '笔记的根目录',
            en: 'Root directory of the note',
          });
          break;
        case 'secret':
          r.value = this.#directory.secret;
          r.key = chalk.rgb(147, 183, 236)(pk(' ├─ ' + i(key)));
          r.comment = i({
            zh: '要加密的文件夹',
            en: 'The folder to be encrypted',
          });
          break;
        case 'encrypted':
          r.value = this.#directory.encrypted;
          r.key = chalk.rgb(147, 183, 236)(pk(' └─ ' + i(key)));
          r.comment = i({
            zh: '加密后的文件将放在这个文件夹',
            en: 'Encrypted files will be put in this folder',
          });
          break;
        case 'exclude':
          r.value = `[${this.#exclude.join(', ')}]`;
          r.key = chalk.blue(pk(i(key)));
          r.comment = i({
            zh: '要加密的文件夹下，不加密的文件/文件夹',
            en: 'Folders in secret directory will not be encrypted',
          });
          break;
        case 'action':
          r.value = this.#action;
          r.key = chalk.blue(pk(i(key)));
          break;
        case 'key':
          r.value = this.#key;
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
    const maxValueLength = Math.max(...values.map((v) => actualWidth(v.value)));
    const pv = (v: string) => padAlign(v, maxValueLength);

    console.log(chalk.blue(pk(i({ en: 'Directory', zh: '目录配置' }))));
    const c = chalk.rgb(122, 154, 96);
    for (let i = 0; i < keys.length; i++) {
      const v = values[i];
      console.log(`${v.key} : ${pv(v.value)} ${v.comment ? c('// ' + v.comment) : ''}`);
    }
  }

  getI18N(i18nConfig: any) {
    return i18nConfig[this.#locale];
  }
}
export const config = new Configuration();
