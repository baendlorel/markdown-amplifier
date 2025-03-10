import * as fs from 'fs';
import * as path from 'path';

/**
 * 递归获取文件夹下的所有文件
 * @param dir 目标文件夹路径
 * @param fileList 存储文件路径的数组（用于递归）
 * @returns 文件路径数组
 */
export function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 递归进入子目录
      getAllFiles(filePath, fileList);
    } else {
      // 记录文件路径
      fileList.push(filePath);
    }
  }

  return fileList;
}
