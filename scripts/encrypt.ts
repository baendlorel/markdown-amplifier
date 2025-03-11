import chalk from 'chalk';
import { getAllFiles } from './utils';
import { config, i } from './configs';

export const encrypt = () => {
  console.log(
    chalk.bgBlue(
      i({
        zh: '加密中',
        en: 'Encrypting',
      })
    )
  );
  const files = getAllFiles(config.secretDir, (f: string) => config.excludes(f));
  console.log(
    i({
      zh: ` 检测到${files.length}个文件`,
      en: ` Detected ${files.length} file(s)`,
    })
  );
};
