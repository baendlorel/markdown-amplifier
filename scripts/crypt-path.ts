/**
 * @name cryptPath
 * @description
 * 依赖于locale、configs、logger、utils
 */

import path from 'path';
import { configs, i, lerr, splitPath } from './misc';

const init = (origin: string, from: string, to: string) => {
  const paths = splitPath(origin);
  const cryptIndex = paths.findIndex((p) => p === from);
  if (cryptIndex === -1) {
    const m = i(
      `没有找到待处理文件夹'${from}'`,
      `Cannot find the folder '${from}' to be encrypted`
    );
    lerr(m);
    throw new Error(m);
  }
  paths[cryptIndex] = to;
  return { paths, cryptIndex };
};

const cryptFileName = configs.encryptFileName
  ? (fileName: string, cryptor: (s: string) => string) => cryptor(fileName)
  : (fileName: string, cryptor: (s: string) => string) => fileName;

const cryptFolderName = configs.encryptFolderName
  ? (dir: string[], cryptIndex: number, cryptor: (s: string) => string) => {
      dir = Array.from(dir);
      for (let i = cryptIndex + 1; i < dir.length; i++) {
        dir[i] = cryptor(dir[i]);
      }
      return dir;
    }
  : (dir: string[], cryptIndex: number, cryptor: (s: string) => string) => dir;

/**
 * 加解密文件路径，这一定是文件地址在访问，而非目录
 * @param origin 待加密/解密的文件路径
 * @param from 从哪个文件夹（加密前或加密后）
 * @param to 加解密到哪个文件夹（加密前或加密后）
 * @param cryptor 加解密函数
 */
export const cryptPath = (
  origin: string,
  from: string,
  to: string,
  cryptor: (s: string) => string
) => {
  const { paths, cryptIndex } = init(origin, from, to);
  const oldFileName = paths.pop() as string;
  const dir = cryptFolderName(paths, cryptIndex, cryptor);
  const fileName = cryptFileName(oldFileName, cryptor);
  return path.join(...dir, fileName);
};
