import fs from 'fs';
import { tab, configs, lbgRed, log, lbgBlue, argv } from './misc';
import { aes } from './misc/cryptor';

const dir = configs.directory;

const encryptFile = (originPath: string) => {
  const encryptedPath = u.cryptFilePath(originPath);

  // 日志用变量
  log(
    tab`加密 ${originPath} => ${encryptedPath}`,
    tab`Encrypting ${originPath} => ${encryptedPath}`
  );

  // 加密并保存
  const origin = u.load(originPath);
  const encrypted = aes.encrypt(origin);
  u.save(encrypted, encryptedPath);
};

export const encryption = () => {
  lbgBlue('开始加密', 'Start Encrypting');
  const files = u.getAllFiles(dir.decrypted, (f: string) => configs.excludes(f));

  log(tab`检测到${files.length}个文件`, tab`Detected ${files.length} file(s)`);

  try {
    fs.rmSync(dir.encrypted, { recursive: true });
  } catch (error) {
    if (error) {
      lbgRed(tab`清空${dir.encrypted}文件夹出错`, tab`Error when clearing ${dir.encrypted}`);
      throw error;
    }
  }

  log(tab`已清空${dir.encrypted}`, tab`${dir.encrypted} cleared`);

  for (const f of files) {
    encryptFile(f);
  }
};
