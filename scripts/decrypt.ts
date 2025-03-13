import fs from 'fs';
import {
  configs,
  load,
  save,
  getAllFiles,
  lbgRed,
  log,
  lbgBlue,
  lgrey,
  xor,
  aes,
  lgreen,
} from './misc';
import { cryptPath, relaPath } from './crypt-path';
import path from 'path';

const { decrypted, encrypted } = configs.directory;

const decryptFile = (originPath: string) => {
  const decryptedPath = cryptPath(originPath, encrypted, decrypted, xor.decrypt);
  // 日志用变量
  lgrey(
    `加密 ${relaPath(encrypted, originPath)} => ${relaPath(decrypted, decryptedPath)}`,
    `Decrypting ${relaPath(encrypted, originPath)} => ${relaPath(decrypted, decryptedPath)}`
  );
  // 加密并保存
  const origin = load(originPath);
  const decryptedContent = aes.decrypt(origin);
  save(decryptedContent, decryptedPath);
};

export const decryption = () => {
  lbgBlue('开始解密', 'Start Decrypting');
  log.incrIndent();

  const files = getAllFiles(path.join(configs.root, encrypted), (f: string) => configs.excludes(f));
  lgrey(`检测到${files.length}个待解密文件`, `Detected ${files.length} file(s) to be derypted`);

  try {
    if (fs.existsSync(decrypted)) {
      fs.rmSync(decrypted, { recursive: true });
    } else {
      fs.mkdirSync(decrypted);
    }
  } catch (error) {
    if (error) {
      lbgRed(`清空${decrypted}文件夹出错`, `Error when clearing ${decrypted}`);
      throw error;
    }
  }
  lgrey(`已清空'${decrypted}'`, `'${decrypted}' cleared`);

  for (const f of files) {
    decryptFile(f);
  }

  lgreen('解密完成', 'Decryption completed');
  log.decrIndent();
};
