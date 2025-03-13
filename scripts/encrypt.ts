import fs from 'fs';
import { configs, load, save, getAllFiles, lbgRed, log, lbgBlue, lgrey } from './misc';
import { aes } from './misc';
import { cryptPath } from './crypt-path';

const dir = configs.directory;

const encryptFile = (originPath: string) => {
  const encryptedPath = cryptPath(originPath, dir.decrypted, dir.encrypted, aes.encrypt);
  // 日志用变量
  lgrey(`加密 ${originPath} => ${encryptedPath}`, `Encrypting ${originPath} => ${encryptedPath}`);
  // 加密并保存
  const origin = load(originPath);
  const encrypted = aes.encrypt(origin);
  save(encrypted, encryptedPath);
};

export const encryption = () => {
  lbgBlue('开始加密', 'Start Encrypting');
  log.incrIndent();

  const files = getAllFiles(dir.decrypted, (f: string) => configs.excludes(f));
  lgrey(`检测到${files.length}个待加密文件`, `Detected ${files.length} file(s) to be ecrypted`);
  try {
    if (fs.existsSync(dir.encrypted)) {
      fs.rmSync(dir.encrypted, { recursive: true });
    } else {
      fs.mkdirSync(dir.encrypted);
    }
  } catch (error) {
    if (error) {
      lbgRed(`清空${dir.encrypted}文件夹出错`, `Error when clearing ${dir.encrypted}`);
      throw error;
    }
  }
  lgrey(`已清空 ${dir.encrypted}`, `${dir.encrypted} cleared`);
  log.decrIndent();

  for (const f of files) {
    encryptFile(f);
  }
};
