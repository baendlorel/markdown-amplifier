import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { splitPath } from './utils';

class Configuration {
  #exclude: string[] = [];
  #rootDir: string;
  #directory: {
    secret: string;
    encrypted: string;
  };
  #action: string;
  #key: string;

  constructor() {
    // 寻找配置文件package.json
    const config = this.getPackageJson().encryptConfigs;
    this.check(config);

    this.#exclude = config.exclude;
    this.#directory = {
      secret: config.directory.secret,
      encrypted: config.directory.encrypted,
    };
    this.#action = '';
    this.#key = '';
  }

  private check(encryptConfigs: any) {
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
      messages.push(chalk.red('Cannot find encryptConfigs in package.json'));
    } else {
      if (!encryptConfigs.exclude) {
        messages.push(chalk.red('encryptConfigs.exclude should be an string array'));
      }
      if (!encryptConfigs.directory) {
        messages.push(chalk.red('encryptConfigs.directory is not set'));
      } else {
        if (!encryptConfigs.directory.secret) {
          messages.push(chalk.bgRed('encryptConfigs.directory.secret should be a string'));
        }
        if (!encryptConfigs.directory.encrypted) {
          messages.push(chalk.bgRed('encryptConfigs.directory.encrypted should be a string'));
        }
      }
    }

    // 输出错误信息
    if (messages.length > 0) {
      console.log(chalk.bgRed('Load Configuration Failed'));
      console.log(messages.join('\n'));
      console.log(chalk.bgBlue('An example in package.json should be like this :'));
      console.log(example);
      throw new Error('Invalid encryptConfigs in package.json');
    }
  }

  private getPackageJson() {
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
    console.log(chalk.bgRed('Load Configuration Failed. Cannot find package.json'));
    throw new Error("Can't find package.json");
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
    const TAB = 4;
    const keys = ['root', 'secret', 'encrypted', 'exclude', 'action', 'key'];
    const maxKeyLength = TAB + Math.max(...keys.map((k) => k.length));
    const pk = (key: string) =>
      key.padEnd(maxKeyLength, ' ').replace(/^[\w]/, (a) => a.toUpperCase());

    const get = (key: string) => {
      let r = { value: '', key: '', comment: '' };
      switch (key) {
        case 'root':
          r.value = path.relative(__dirname, this.#rootDir);
          r.key = chalk.rgb(147, 183, 236)(pk(' ├─ ' + key));
          r.comment = 'Root directory of the note';
          break;
        case 'secret':
          r.value = this.#directory.secret;
          r.key = chalk.rgb(147, 183, 236)(pk(' ├─ ' + key));
          r.comment = 'The folder to be encrypted';
          break;
        case 'encrypted':
          r.value = this.#directory.encrypted;
          r.key = chalk.rgb(147, 183, 236)(pk(' └─ ' + key));
          r.comment = 'Encrypted files will be put in this folder';
          break;
        case 'exclude':
          r.value = `[${this.#exclude.join(', ')}]`;
          r.key = chalk.blue(pk(key));
          r.comment = 'Folders in secret directory will not be encrypted';
          break;
        case 'action':
          r.value = this.#action;
          r.key = chalk.blue(pk(key));
          break;
        case 'key':
          r.value = this.#key;
          r.key = chalk.blue(pk(key));
          r.comment = 'Promise you will ' + chalk.bold.underline('remember it');
          break;
        default:
          throw new Error("Can't display this config key = " + key);
      }
      return r;
    };

    const values = keys.map((key) => get(key));
    const maxValueLength = Math.max(...values.map((v) => v.value.length));
    const pv = (v: string) => v.padEnd(maxValueLength, ' ');

    console.log(chalk.blue(pk('Directory')));
    const c = chalk.rgb(122, 154, 96);
    for (let i = 0; i < keys.length; i++) {
      const v = values[i];
      console.log(`${v.key} : ${pv(v.value)} ${v.comment ? c('// ' + v.comment) : ''}`);
    }
  }
}

export const config = new Configuration();
