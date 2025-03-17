/**
 * @name HeadingNumbering
 * @description 为markdown的h元素添加自动的编号
 */

import fs from 'fs';
import path from 'path';

const load = (filePath: string): string => {
  // 读取文件内容
  return fs.readFileSync(filePath, 'utf-8');
};
const save = (data: string, filePath: string) => {
  const parsed = path.parse(filePath);
  // 创建文件夹
  if (!fs.existsSync(parsed.dir)) {
    fs.mkdirSync(parsed.dir, { recursive: true });
  }
  // 写入到新文件
  fs.writeFileSync(filePath, data);
};

export const numberingHead = (filePath: string) => {
  // 编号处理
  const no = [0, 0, 0, 0, 0, 0];
  const findIndex = (line: string) => {
    const match = line.match(/^[#]+[\s]/);
    return match ? match[0].length - 2 : null;
  };
  const getNo = () => no.join('.').replace(/[0\.]+$/, '');

  const lines = load(filePath).split('\n');
  let lastIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const index = findIndex(line);
    console.log('line', i, line);
    if (index === null) {
      continue;
    }

    // 根据lastIndex和index的关系，控制编号增减
    if (lastIndex === index) {
      no[index]++;
    }
    if (lastIndex > index) {
      no[index]++;
      no.fill(0, index + 1);
    }
    if (lastIndex < index) {
      no[index]++;
    }
    lastIndex = index;

    console.log('有标题', index, no);

    // 更新编号
    lines[i] = line.replace(/^[#]+[\s]+[\d\.]+/, '#'.repeat(index + 1) + ' ' + getNo());
  }

  save(lines.join('\n'), filePath);
};

numberingHead('/home/aldia/note/decrypted/passwords.md');
