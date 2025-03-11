import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { util, i, tab } from './utils';
import { aes, xor } from './cryptor';

const encryptFile = (originPath: string) => {
  const parsed = path.parse(originPath);
  const newName = xor.encrypt(parsed.name) + parsed.ext;

  // 日志用变量
  const rela1 = path.relative(util.rootDir, originPath);
  const rela2 = path.relative(util.rootDir, path.join(parsed.dir, newName));
  console.log(
    i({
      zh: tab`加密 ${rela1} => ${rela2}`,
      en: tab`Encrypting ${rela1} => ${rela2}`,
    })
  );

  // 加密并保存
  const encryptedContent = aes.encrypt(util.load(originPath));
  util.save(encryptedContent, util.toEncryptedPath(parsed.dir), newName);
};

export const encryption = () => {
  console.log(
    chalk.bgBlue(
      i({
        zh: '加密中',
        en: 'Encrypting',
      })
    )
  );
  const files = util.getAllFiles(util.decryptedDir, (f: string) => util.excludes(f));
  console.log(
    i({
      zh: tab`检测到${files.length}个文件`,
      en: tab`Detected ${files.length} file(s)`,
    })
  );

  fs.rm(util.encryptedDir, { recursive: true }, (err) => {
    if (err) {
      console.log(
        chalk.bgRed(
          i({
            zh: tab`清空${util.encryptedDir}文件夹出错`,
            en: tab`Error when clearing ${util.encryptedDir}`,
          })
        )
      );
      throw err;
    }
  });

  console.log(
    i({
      zh: tab`已清空${util.encryptedDir}`,
      en: tab`${util.encryptedDir} cleared`,
    })
  );

  for (const f of files) {
    encryptFile(f);
  }
};
