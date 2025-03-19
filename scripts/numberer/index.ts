/**
 * @name HeadingNumbering
 * @description 为markdown的h元素添加自动的编号
 */
import { load, save } from '../misc';

export const numberFile = (filePath: string) => {
  // 编号处理
  const no = [0, 0, 0, 0, 0, 0];
  const findIndex = (line: string) => {
    const match = line.match(/^[#]+[\s]{0,}/);
    return match ? match[0].length - 2 : null;
  };
  const getNo = () => no.join('.').replace(/[0\.]+$/, '');

  const lines = load(filePath).split('\n');
  let lastIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const index = findIndex(line);
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

    // 更新编号
    lines[i] = line.replace(
      /^[#]+[\s]{0,}[\d\.]{0,}[\s]{0,}/,
      `${'#'.repeat(index + 1)} ${getNo()} `
    );
    console.log('更新后 ', i, ':', lines[i]);
  }

  save(lines.join('\n'), filePath);
};
