import fs from 'fs';
import path from 'path';
import { configs, load, save, getAllFiles, lbgRed, log, lgrey, lgreen, lflag, br } from '../misc';
import { cryptPath, relaPath } from './crypt-path';
import { aes, xor } from './cryptor';

const { decrypted, encrypted } = configs.directory;

const encryptFile = (originPath: string) => {
  const encryptedPath = cryptPath(originPath, decrypted, encrypted, xor.encrypt);
  // 日志用变量
  lgrey(
    `加密 ${relaPath(decrypted, originPath)} => ${relaPath(encrypted, encryptedPath)}`,
    `Encrypting ${relaPath(decrypted, originPath)} => ${relaPath(encrypted, encryptedPath)}`
  );
  // 加密并保存
  const origin = load(originPath);
  const encryptedContent = aes.encrypt(origin);
  save(encryptedContent, encryptedPath);
};

export const encryption = (key: string) => {
  configs.setKey(key);
  br();

  lflag('开始加密', 'Start Encrypting');
  log.incrIndent();

  const files = getAllFiles(path.join(configs.root, decrypted), configs.excludes);
  lgrey(`检测到${files.length}个待加密文件`, `Detected ${files.length} file(s) to be ecrypted`);

  try {
    if (fs.existsSync(encrypted)) {
      fs.rmSync(encrypted, { recursive: true });
    } else {
      fs.mkdirSync(encrypted);
    }
  } catch (error) {
    if (error) {
      lbgRed(`清空${encrypted}文件夹出错`, `Error when clearing ${encrypted}`);
      throw error;
    }
  }
  lgrey(`已清空 ${encrypted}`, `${encrypted} cleared`);

  for (const f of files) {
    encryptFile(f);
  }

  lgreen('加密完成', 'Encryption completed');
  log.decrIndent();
};
