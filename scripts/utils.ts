import * as fs from 'fs';
import * as path from 'path';
import { configs } from './configs';

/**
 * 递归获取文件夹下的所有文件
 * @param dir 目标文件夹路径
 * @param fileList 存储文件路径的数组（用于递归）
 * @returns 文件路径数组
 */
export const getAllFiles = (dir: string): string[] => {
  const list = [] as string[];
  const _detect = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (configs.excludes(file)) {
        continue; // 跳过部分文件夹
      }
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      stat.isDirectory() ? _detect(filePath) : list.push(filePath);
    }
  };
  _detect(dir);
  return list;
};

/**
 * 把一个地址拆分成数组
 * @param filePath
 * @returns
 */
export const splitPath = (filePath: string) => {
  const list = [] as string[];
  const _detect = (filePath: string) => {
    const father = path.dirname(filePath);
    const { base } = path.parse(filePath);
    father !== base ? (list.push(base), _detect(father)) : undefined;
  };
  _detect(filePath);
  return list.reverse();
};

export const toEncryptedFolder = (folder: string) => {
  const list = splitPath(folder);

  return path.join(folder, 'encrypted');
};

export const toDecryptedFolder = (folder: string) => {
  return path.join(folder, 'encrypted');
};

/**
 * 读取文件
 * @param filePath  源文件路径
 */
export function load(filePath: string): Buffer {
  // 读取文件内容
  return fs.readFileSync(filePath);
}

export function save(data: string, folder: string, fileName: string) {
  // 创建文件夹
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  // 写入到新文件
  fs.writeFileSync(path.join(folder, fileName), data);
}
