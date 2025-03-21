/**
 * @name HeadingNumbering
 * @description 为markdown的h元素添加自动的编号
 */
import { load, save } from '../misc';

const MAX_H_LEVEL = 6;
const createNo = (length: number) => Array.from({ length }, () => 0);
export const numberFile = (filePath: string) => {
  // 编号处理
  const no = {
    h: createNo(MAX_H_LEVEL),
    theorem: createNo(MAX_H_LEVEL + 1),
    definition: createNo(MAX_H_LEVEL + 1),
    axiom: createNo(MAX_H_LEVEL + 1),
    case: createNo(MAX_H_LEVEL + 1),
  };
  const findIndex = (line: string) => {
    const match = line.match(/^[#]+[\s]{0,}/);
    return match ? match[0].length - 2 : null;
  };
  const getNo = () => no.h.join('.').replace(/[0\.]+$/, '');

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
      no.h[index]++;
    }
    if (lastIndex > index) {
      no.h[index]++;
      no.h.fill(0, index + 1);
    }
    if (lastIndex < index) {
      no.h[index]++;
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
