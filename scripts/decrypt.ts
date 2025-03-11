import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { util, i, tab, configs } from './utils';
import { aes, xor } from './cryptor';

const dir = configs.dir;

const decryptFile = (originPath: string) => {
  const parsed = path.parse(originPath);
  const newName = (configs.encryptFolderName ? xor.decrypt(parsed.name) : parsed.name) + parsed.ext;

  // 日志用变量
  const rela1 = path.relative(dir.root, originPath);
  const rela2 = path.relative(dir.root, path.join(parsed.dir, newName));
  console.log(
    i({
      zh: tab`加密 ${rela1} => ${rela2}`,
      en: tab`Encrypting ${rela1} => ${rela2}`,
    })
  );

  // 加密并保存
  const content = util.load(originPath);
  const encryptedContent = aes.encrypt(content);
  util.save(encryptedContent, util.toDecryptedPath(parsed.dir), newName);
};

export const decryption = () => {
  console.log(
    chalk.bgBlue(
      i({
        zh: '加密中',
        en: 'Encrypting',
      })
    )
  );
  const files = util.getAllFiles(dir.encrypted, (f: string) => configs.excludes(f));
  console.log(
    i({
      zh: tab`检测到${files.length}个文件`,
      en: tab`Detected ${files.length} file(s)`,
    })
  );

  fs.rm(dir.decrypted, { recursive: true }, (err) => {
    if (err) {
      console.log(
        chalk.bgRed(
          i({
            zh: tab`清空${dir.decrypted}文件夹出错`,
            en: tab`Error when clearing ${dir.decrypted}`,
          })
        )
      );
      throw err;
    }
  });

  console.log(
    i({
      zh: tab`已清空${dir.decrypted}`,
      en: tab`${dir.decrypted} cleared`,
    })
  );

  for (const f of files) {
    decryptFile(f);
  }
};
