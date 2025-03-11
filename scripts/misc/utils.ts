import fs from 'fs';
import path from 'path';
import stringWidth from 'string-width';

export const tab = (t: TemplateStringsArray, ...values: any[]) =>
  values.reduce((result, str, i) => result + t[i] + String(str), '  ') + t[t.length - 1];

// 工具函数
export const util = {
  /**
   * 返回文本的实际宽度
   * @param text
   * @returns
   */
  actualWidth(text: string) {
    return stringWidth(text);
  },

  /**
   * 按实际宽度补空格
   * @param text
   * @param length
   * @param direction
   * @returns
   */
  padAlign(text: string, length: number, direction: 'left' | 'right' = 'right') {
    const width = stringWidth(text);
    if (direction === 'left') {
      return ' '.repeat(length - width) + text; // 按实际宽度补空格
    }
    if (direction === 'right') {
      return text + ' '.repeat(length - width); // 按实际宽度补空格
    }
    throw new Error("direction should be 'left' or 'right'");
  },

  /**
   * 递归获取文件夹下的所有文件
   * @param dir 目标文件夹路径
   * @param excludes 用于判断是否不包含这个文件，返回true则跳过该文件
   * @returns 文件路径数组
   */
  getAllFiles(dir: string, excludes: (fileName: string) => boolean): string[] {
    const list = [] as string[];
    const _detect = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (excludes(path.join(dir, file))) {
          continue; // 跳过部分文件夹
        }
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        stat.isDirectory() ? _detect(filePath) : list.push(filePath);
      }
    };
    _detect(dir);
    return list;
  },

  /**
   * 把一个地址拆分成数组
   * @param filePath
   * @returns
   */
  splitPath(filePath: string) {
    const list = [] as string[];
    const { root } = path.parse(filePath);
    let p = filePath;
    while (p === root) {
      const { base, dir } = path.parse(p);
      p = dir;
      list.unshift(base);
    }
    list.unshift(root);
    return list;
  },

  // /**
  //  * 将路径转换为加密路径，如果encryptFolderName为false那么不会加密目录
  //  * @param p 原路径
  //  * @returns 加密路径
  //  */
  // toEncryptedPath(p: string) {
  //   const getChangedFolder = (p: string) => {
  //     const pathSplit = util.splitPath(p);
  //     const index = pathSplit.findIndex((p) => p === privates.directory.decrypted);
  //     if (index === -1) {
  //       throw new Error(
  //         ii({
  //           zh: '找不到需要加密的文件夹',
  //           en: 'Cannot find the folder to be encrypted',
  //         })
  //       );
  //     }
  //     pathSplit[index] = privates.directory.encrypted;
  //     return { pathSplit, index };
  //   };

  //   // OL 此处进行懒重载
  //   if (configs.encryptFolderName) {
  //     util.toEncryptedPath = (p: string) => path.join(...getChangedFolder(p).pathSplit);
  //   } else {
  //     util.toEncryptedPath = (p: string) => {
  //       const { pathSplit, index } = getChangedFolder(p);
  //       for (let i = index + 1; i < pathSplit.length; i++) {
  //         pathSplit[i] = xor.encrypt(pathSplit[i]);
  //       }
  //       path.join(...pathSplit);
  //     };
  //   }

  //   // 如果需要加密文件夹名，那么还要进一步加密
  //   return util.toEncryptedPath(p);
  // },

  // /**
  //  * 将路径转换为解密路径
  //  * @param p 原路径
  //  * @returns 解密路径
  //  */
  // toDecryptedPath(p: string) {
  //   const getChangedFolder = (p: string) => {
  //     const pathSplit = util.splitPath(p);
  //     const index = pathSplit.findIndex((p) => p === privates.directory.encrypted);
  //     if (index === -1) {
  //       throw new Error(
  //         ii({
  //           zh: '找不到需要解密的文件夹',
  //           en: 'Cannot find the folder to be decrypted',
  //         })
  //       );
  //     }
  //     pathSplit[index] = privates.directory.decrypted;
  //     return { pathSplit, index };
  //   };

  //   // OL 此处进行懒重载
  //   if (configs.encryptFolderName) {
  //     util.toDecryptedPath = (p: string) => path.join(...getChangedFolder(p).pathSplit);
  //   } else {
  //     util.toDecryptedPath = (p: string) => {
  //       const { pathSplit, index } = getChangedFolder(p);
  //       for (let i = index + 1; i < pathSplit.length; i++) {
  //         pathSplit[i] = xor.decrypt(pathSplit[i]);
  //       }
  //       path.join(...pathSplit);
  //     };
  //   }

  //   // 如果需要加密文件夹名，那么还要进一步加密
  //   return util.toDecryptedPath(p);
  // },

  // TODO 完成此函数
  /**
   * 加解密文件路径，这一定是文件地址在访问，而非目录
   * @param origin 原路径
   * @param form 从哪个文件夹
   * @param to 加解密到哪个文件夹
   * @param cryptor 加解密函数
   */
  cryptFilePath(origin: string, form: string, to: string, cryptor: (s: string) => string) {},

  /**
   * 读取文件
   * @param filePath 源文件路径
   * @returns 文件内容
   */
  load(filePath: string): string {
    // 读取文件内容
    return fs.readFileSync(filePath).toString();
  },

  /**
   * 保存数据到文件
   * @param data 数据内容
   * @param folder 文件夹路径
   * @param fileName 文件名
   */
  save(data: string, filePath: string) {
    const parsed = path.parse(filePath);
    // 创建文件夹
    if (!fs.existsSync(parsed.dir)) {
      fs.mkdirSync(parsed.dir, { recursive: true });
    }
    // 写入到新文件
    fs.writeFileSync(filePath, data);
  },
};
