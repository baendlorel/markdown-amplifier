import { lgrey, log } from '../misc';

// TODO 编写初始化脚本，创建文件夹、初始化数据库等
export const init = () => {
  const cwd = process.cwd();
  lgrey(`Current working directory: ${cwd}`);
};
