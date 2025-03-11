import fs from 'fs';
import { util, tab, configs, lbgRed, log, lbgBlue } from './misc';
import { aes } from './cryptor';

const dir = configs.dir;

const encryptFile = (originPath: string) => {
  // TODO 记录、更新.history-keys文件，此文件必须加入.gitignore

  const encryptedPath = util.toEncryptedPath(originPath);

  // 日志用变量
  log(
    tab`加密 ${originPath} => ${encryptedPath}`,
    tab`Encrypting ${originPath} => ${encryptedPath}`
  );

  // 加密并保存
  const origin = util.load(originPath);
  const encrypted = aes.encrypt(origin);
  util.save(encrypted, encryptedPath);
};

export const encryption = () => {
  lbgBlue('开始加密', 'Start Encrypting');
  const files = util.getAllFiles(dir.decrypted, (f: string) => configs.excludes(f));

  log(tab`检测到${files.length}个文件`, tab`Detected ${files.length} file(s)`);

  fs.rm(dir.encrypted, { recursive: true }, (err) => {
    if (err) {
      lbgRed(tab`清空${dir.encrypted}文件夹出错`, tab`Error when clearing ${dir.encrypted}`);
      throw err;
    }
  });

  log(tab`已清空${dir.encrypted}`, tab`${dir.encrypted} cleared`);

  for (const f of files) {
    encryptFile(f);
  }
};
