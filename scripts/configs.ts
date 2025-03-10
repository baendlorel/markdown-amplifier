import chalk from 'chalk';
import { encryptConfigs } from '../package.json';

export const configs = {
  exclude: encryptConfigs.exclude as string[],
  secretFolder: encryptConfigs.secretFolder,
  encryptedFolder: encryptConfigs.encryptedFolder,
  action: '',
  key: '',
  excludes(folder: string) {
    return configs.exclude.includes(folder);
  },
  display() {
    const keys = Object.keys(configs).filter(
      (k) => k !== 'display' && k !== 'excludes'
    ) as any as (keyof typeof configs)[];

    const maxKeyLength = Math.max(...keys.map((k) => k.length));

    const getConfig = (key: keyof typeof configs) => {
      const v = configs[key];
      if (typeof v === 'string') {
        return v;
      }
      if (Array.isArray(v)) {
        return `[${v.join(', ')}]`;
      }
      throw new Error("Can't display this config");
    };

    const values = keys.map((key) => getConfig(key));
    const maxValueLength = Math.max(...values.map((v) => v.length));

    const comment = {
      exclude: 'Folders in secretFolder will not be encrypted',
      secretFolder: 'The folder to be encrypted',
      encryptedFolder: 'Encrypted files will be put in this folder',
      key: 'Promise you will ' + chalk.bold.underline('remember it'),
    };

    for (let i = 0; i < keys.length; i++) {
      const rawK = keys[i];
      const k = chalk.blue(rawK.padEnd(maxKeyLength, ' ').replace(/^[\w]/, (a) => a.toUpperCase()));
      const v =
        rawK === 'key'
          ? chalk.redBright(values[i].padEnd(maxValueLength, ' '))
          : values[i].padEnd(maxValueLength, ' ');
      const c = chalk.rgb(122, 154, 96)(comment[rawK] ? '// ' + comment[rawK] : '');
      console.log(`  ${k} : ${v} ${c}`);
    }
  },
};
