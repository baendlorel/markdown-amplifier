import fs from 'fs';
import path from 'path';
import { u, tab, configs, i, lbgRed, lbgBlue } from './misc';
import { aes, xor } from './misc/cryptor';

const dir = configs.dir;

const decryptFile = (originPath: string) => {
  const parsed = path.parse(originPath);
  const newName = (configs.encryptFolderName ? xor.decrypt(parsed.name) : parsed.name) + parsed.ext;

  // 日志用变量
  const rela1 = path.relative(dir.root, originPath);
  const rela2 = path.relative(dir.root, path.join(parsed.dir, newName));
  console.log(i(tab`加密 ${rela1} => ${rela2}`, tab`Encrypting ${rela1} => ${rela2}`));

  // 加密并保存
  const content = u.load(originPath);
  const encryptedContent = aes.encrypt(content);
  u.save(encryptedContent, u.toDecryptedPath(parsed.dir), newName);
};

export const decryption = () => {
  lbgBlue('加密中', 'Encrypting');
  const files = u.getAllFiles(dir.encrypted, (f: string) => configs.excludes(f));
  console.log(i(tab`检测到${files.length}个文件`, tab`Detected ${files.length} file(s)`));

  fs.rm(dir.decrypted, { recursive: true }, (err) => {
    if (err) {
      lbgRed(tab`清空${dir.decrypted}文件夹出错`, tab`Error when clearing ${dir.decrypted}`);
      throw err;
    }
  });

  console.log(i(tab`已清空${dir.decrypted}`, tab`${dir.decrypted} cleared`));

  for (const f of files) {
    decryptFile(f);
  }
};
