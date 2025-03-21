/**
 * @name HeadingNumbering
 * @description 为markdown的h元素添加自动的编号
 */
import { load, save } from '../misc';
import { findMatch, MAX_H_LEVEL, RuleTagName } from './meta';

const createNo = (length: number) => new Array<number>(length).fill(0);
const getNo = (arr: number[]) => arr.join('.').replace(/[0\.]+$/, '');

export const numberFile = (filePath: string) => {
  // 编号处理
  const no = {
    h: createNo(MAX_H_LEVEL),
    theorem: createNo(MAX_H_LEVEL + 1),
    definition: createNo(MAX_H_LEVEL + 1),
    axiom: createNo(MAX_H_LEVEL + 1),
    case: createNo(MAX_H_LEVEL + 1),
  } as { [key in RuleTagName]: number[] };

  const lines = load(filePath).split('\n');
  let lastDigitIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const matched = findMatch(line);
    if (!matched) {
      continue;
    }
    const { index, rule, str } = matched;

    // * 根据lastIndex和index的关系，控制编号增减
    // section同层级变动，编号增加
    if (lastDigitIndex === index) {
      no.h[index]++;
    }
    // 退出本层级section
    else if (lastDigitIndex > index) {
      no.h[index]++;
      // 后续编号清零
      no.h.fill(0, index + 1);
      // 基于section的编号则完全清零
      no.theorem.fill(0);
      no.definition.fill(0);
      no.axiom.fill(0);
      no.case.fill(0);
    }
    // 进入更细一层的section
    else if (lastDigitIndex < index) {
      no.h[index]++;
    }
    lastDigitIndex = index;

    // 更新编号
    lines[i] = line.replace(
      /^[#]+[\s]{0,}[\d\.]{0,}[\s]{0,}/,
      `${'#'.repeat(index + 1)} ${getNo(no.h)} `
    );
    console.log('更新后 ', i, ':', lines[i]);
  }

  save(lines.join('\n'), filePath);
};
