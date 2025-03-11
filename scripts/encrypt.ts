import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { util, i } from './utils';
import { aes, xor } from './cryptor';

const encryptFile = (filePath: string) => {
  const parsed = path.parse(filePath);
  const newName = xor.encrypt(parsed.name) + '.' + parsed.ext;
  const rela1 = path.relative(util.rootDir, filePath);
  const rela2 = path.relative(util.rootDir, path.join(parsed.dir, newName));
  console.log(
    i({
      zh: ` 加密 ${rela1} => ${rela2}`,
      en: ` Encrypting ${rela1} => ${rela2}`,
    })
  );
  const encryptedContent = aes.encrypt(util.load(filePath));
  util.save(encryptedContent, parsed.dir, newName);
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
      zh: ` 检测到${files.length}个文件`,
      en: ` Detected ${files.length} file(s)`,
    })
  );
  for (const f of files) {
    encryptFile(f);
  }
};
