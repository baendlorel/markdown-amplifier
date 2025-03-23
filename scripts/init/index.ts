import fs from 'fs';
import path from 'path';
import { lerr, lgrey, log } from '../misc';
import { MA_RC, MA_DIR } from '../core';

// TODO 编写初始化脚本，创建文件夹、初始化数据库等
/**
 * 初始化程序 \
 * Initialize the program
 * @returns true表示初始化成功，false表示失败退出
 */
export const init = (): boolean => {
  const cwd = process.cwd();
  lgrey(`当前目录：${cwd}`, `Current working directory: ${cwd}`);
  // 确认目录存在
  const madir = path.join(cwd, MA_DIR);
  if (fs.existsSync(madir)) {
    const stat = fs.statSync(madir);
    if (!stat.isDirectory()) {
      lerr(
        `已存在同名文件而非文件夹：${madir}，请重命名或删除它`,
        `A file with the same name already exists: ${madir}, please rename or delete it`
      );
      return false;
    }
  } else {
    fs.mkdirSync(madir);
    lgrey(`已创建文件夹：${madir}`, `Folder created: ${madir}`);
  }

  // 确认配置文件存在
  const marc = path.join(madir, MA_RC);
  if (fs.existsSync(marc)) {
    const stat = fs.statSync(marc);
    if (stat.isDirectory()) {
      lerr(
        `已存在同名文件而非文件夹：${madir}，请重命名或删除它`,
        `A file with the same name already exists: ${madir}, please rename or delete it`
      );
      return false;
    }
  }
  return true;
};
