import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { util, i, tab, configs } from './misc';
import { aes, xor } from './cryptor';

const dir = configs.dir;

let getNewFileName = (parsed: path.ParsedPath) => {
  if (configs.encryptFolderName) {
    getNewFileName = (parsed: path.ParsedPath) => xor.encrypt(parsed.name) + parsed.ext;
  } else {
    getNewFileName = (parsed: path.ParsedPath) => parsed.base;
  }
  return getNewFileName(parsed);
};

const encryptFile = (originPath: string) => {
  const encryptedPath = util.toEncryptedPath(originPath);

  // 日志用变量
  console.log(
    i({
      zh: tab`加密 ${originPath} => ${encryptedPath}`,
      en: tab`Encrypting ${originPath} => ${encryptedPath}`,
    })
  );

  // 加密并保存
  const origin = util.load(originPath);
  const encrypted = aes.encrypt(origin);
  util.save(encrypted, encryptedPath);
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
  const files = util.getAllFiles(dir.decrypted, (f: string) => configs.excludes(f));
  console.log(
    i({
      zh: tab`检测到${files.length}个文件`,
      en: tab`Detected ${files.length} file(s)`,
    })
  );

  fs.rm(dir.encrypted, { recursive: true }, (err) => {
    if (err) {
      console.log(
        chalk.bgRed(
          i({
            zh: tab`清空${dir.encrypted}文件夹出错`,
            en: tab`Error when clearing ${dir.encrypted}`,
          })
        )
      );
      throw err;
    }
  });

  console.log(
    i({
      zh: tab`已清空${dir.encrypted}`,
      en: tab`${dir.encrypted} cleared`,
    })
  );

  for (const f of files) {
    encryptFile(f);
  }
};
