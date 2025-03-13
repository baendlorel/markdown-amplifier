/**
 * @name Utils
 * @description
 * 无依赖
 */
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);
import fs from 'fs';
import path from 'path';
import stringWidth from 'string-width';

export const tab = (t: TemplateStringsArray, ...values: any[]) =>
  values.reduce((result, str, i) => result + t[i] + String(str), '  ') + t[t.length - 1];

/**
 * 按实际宽度补空格
 * @param text
 * @param length
 * @param direction
 * @returns
 */
export const padAlign = (text: string, length: number, direction: 'left' | 'right' = 'right') => {
  const width = stringWidth(text);
  if (width > length) {
    console.log('padAlign exceed', { text, width, length });
    return text;
  }
  if (direction === 'left') {
    return ' '.repeat(length - width) + text; // 按实际宽度补空格
  }
  if (direction === 'right') {
    return text + ' '.repeat(length - width); // 按实际宽度补空格
  }
  throw new Error("direction should be 'left' or 'right'");
};

/**
 * 递归获取文件夹下的所有文件
 * @param dir 目标文件夹路径
 * @param excludes 用于判断是否不包含这个文件，返回true则跳过该文件
 * @returns 文件路径数组
 */
export const getAllFiles = (
  dir: string,
  excludes: (dir: string, fileName: string) => boolean
): string[] => {
  const list = [] as string[];
  const _detect = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (excludes(dir, file)) {
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
  const { root } = path.parse(filePath);
  let p = filePath;
  while (p !== root) {
    const { base, dir } = path.parse(p);
    p = dir;
    list.unshift(base);
  }
  list.unshift(root);
  return list;
};

/**
 * 读取文件
 * @param filePath 源文件路径
 * @returns 文件内容
 */
export const load = (filePath: string): string => {
  // 读取文件内容
  return fs.readFileSync(filePath, 'utf-8');
};

/**
 * 保存数据到文件
 * @param data 数据内容
 * @param folder 文件夹路径
 * @param fileName 文件名
 */
export const save = (data: string, filePath: string) => {
  const parsed = path.parse(filePath);
  // 创建文件夹
  if (!fs.existsSync(parsed.dir)) {
    fs.mkdirSync(parsed.dir, { recursive: true });
  }
  // 写入到新文件
  fs.writeFileSync(filePath, data);
};

export const formatDatetime = (date: Date): string => {
  const p = (num: number, size: number = 2) => String(num).padStart(size, '0');

  const y = date.getFullYear();
  const m = p(date.getMonth() + 1); // 月份从0开始，需要+1
  const d = p(date.getDate());

  const h = p(date.getHours());
  const mi = p(date.getMinutes());
  const s = p(date.getSeconds());
  const ms = p(date.getMilliseconds(), 3); // 毫秒需要3位数

  return `${y}-${m}-${d} ${h}:${mi}:${s}.${ms}`;
};

type Fn<T extends any[], R> = (...args: T) => R;
/**
 * 缓存函数结果
 * @param fn 要缓存的函数
 * @returns 带缓存功能的函数
 */
export const memoize = <T extends any[], R>(fn: Fn<T, R>): Fn<T, R> => {
  const cache = new Map<string, R>();

  return (...args: T): R => {
    // 将参数序列化以支持多个参数
    const key = args.reduce((prev, current) => prev + '_' + String(current), '');
    if (cache.has(key)) {
      return cache.get(key)!; // `!` 表示断言，告诉 TS 这里一定有值
    } else {
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }
  };
};
