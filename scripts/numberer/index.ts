/**
 * @name HeadingNumbering
 * @description 为markdown的h元素添加自动的编号
 */
import { load, save } from '../misc';
import { findMatch, MAX_H_LEVEL, RuleGroupName, RuleTagName } from './meta';

const createNo = (length: number) => new Array<number>(length).fill(0);

export const numberFile = (filePath: string) => {
  // 编号处理
  const no = {
    h: createNo(MAX_H_LEVEL),
    theorem: createNo(MAX_H_LEVEL + 1),
    definition: createNo(MAX_H_LEVEL + 1),
    axiom: createNo(MAX_H_LEVEL + 1),
    case: createNo(MAX_H_LEVEL + 1),
  } as { [key in RuleGroupName]: number[] };

  const lastDigitIndex = {
    h: 0,
    theorem: 0,
    definition: 0,
    axiom: 0,
    case: 0,
  } as { [key in RuleGroupName]: number };

  const initSubGroup = (group: RuleGroupName) => {
    const g = no[group];
    for (let i = 0; i < no.h.length; i++) {
      g[i] = no.h[i];
    }
    g.fill(0, no.h.length);
  };

  /**
   * 是否在证明过程中，证明过程中的case单独编号 \
   * Whether in the proof process, if so, 'case' shall be numbered independently from outer section
   */
  let inProof = false;
  let lastGroup = 'h' as RuleGroupName;

  const lines = load(filePath).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const matched = findMatch(line);
    if (!matched) {
      continue;
    }
    const { rule } = matched;
    const digitIndex = rule.keyword.length;

    // * 根据lastIndex和index的关系，控制编号增减
    switch (rule.group) {
      case 'h':
        // 对于h元素而言
        no.h[digitIndex]++;
        // 基于section的编号则完全清零
        no.theorem.fill(0);
        no.definition.fill(0);
        no.axiom.fill(0);
        no.case.fill(0);
        // 退出本层级section， h元素的后续编号清零
        if (lastDigitIndex.h > digitIndex) {
          // h元素的后续编号清零
          no.h.fill(0, digitIndex + 1);
        }
        break;

      case 'theorem':
      case 'axiom':
      case 'definition':
        if (lastGroup === 'h') {
          initSubGroup(rule.group);
        }
        // '四理'的位索引永远比section的位索引大1
        no[rule.group][lastDigitIndex.h + 1]++;
        break;
      case 'case':
        // 如果是proof下的，那么单独编号
        if (inProof) {
          break;
        }
        break;
      default:
        const n: never = rule.group;
        break;
    }

    lastGroup = rule.group;
    lastDigitIndex[rule.group] = digitIndex;

    // 更新编号
    lines[i] = line.replace(rule.regex, rule.format(no[rule.group]));
    console.log('更新后 ', i, ':', lines[i]);
  }

  save(lines.join('\n'), filePath);
};
