/**
 * @name HeadingNumbering
 * @description 为markdown的h元素添加自动的编号
 */
import { load, save } from '../misc';
import { GroupName } from './types';
import {
  findMatch,
  LEVEL_CASE,
  LEVEL_SUBCASE,
  LEVEL_SUBSUBCASE,
  MAX_H_LEVEL,
} from './rules';

const createNo = (length: number) => new Array<number>(length).fill(0);

export const numberFile = (filePath: string) => {
  // 编号处理
  const no = {
    h: createNo(MAX_H_LEVEL),
    theorem: createNo(MAX_H_LEVEL + 1),
    definition: createNo(MAX_H_LEVEL + 1),
    axiom: createNo(MAX_H_LEVEL + 1),
    case: [0, 0, 0],
  } as { [key in GroupName]: number[] };

  const lastLevel = {
    h: 0,
    theorem: 0,
    definition: 0,
    axiom: 0,
    case: 0,
  } as { [key in GroupName]: number };

  const initSubGroup = (group: GroupName) => {
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
  let lastGroup = 'h' as GroupName;

  const lines = load(filePath).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const matched = findMatch(line);
    if (!matched) {
      continue;
    }
    const { rule } = matched;
    let currentLevel = 0;

    console.log(`detected: [${rule.tag}] ${rule.keyword}`);

    // * 根据lastIndex和index的关系，控制编号增减
    switch (rule.group) {
      case 'h':
        // 对于h元素而言，层级就是有多少个#号
        currentLevel = rule.keyword.length - 1;
        no.h[currentLevel]++;
        // 基于h的编号则完全清零
        no.theorem.fill(0);
        no.definition.fill(0);
        no.axiom.fill(0);
        no.case.fill(0);
        // 退出本层级h， h元素的后续编号清零
        if (lastLevel.h > currentLevel) {
          // h元素的后续编号清零
          no.h.fill(0, currentLevel + 1);
        }
        break;

      case 'theorem':
      case 'axiom':
      case 'definition':
        if (lastGroup === 'h') {
          initSubGroup(rule.group);
        }
        // '四理'的level永远比h的level深1层
        no[rule.group][lastLevel.h + 1]++;
        break;
      case 'case':
        // 如果是proof下的，那么单独编号
        if (inProof) {
          break;
        }
        switch (rule.tag) {
          case 'case':
            if (lastLevel.case === LEVEL_SUBCASE || lastLevel.case === LEVEL_SUBSUBCASE) {
              no.case[LEVEL_SUBCASE] = 0;
              no.case[LEVEL_SUBSUBCASE] = 0;
            }
            no.case[LEVEL_CASE]++;
            currentLevel = LEVEL_CASE;
            break;
          case 'subcase':
            // 如果没有用过case就直接打了subcase，那么忽略
            if (no.case[LEVEL_CASE] === 0) {
              continue;
            }
            if (lastLevel.case === LEVEL_SUBSUBCASE) {
              no.case[LEVEL_SUBSUBCASE] = 0;
            }
            no.case[LEVEL_SUBCASE]++;
            currentLevel = LEVEL_SUBCASE;
            break;
          case 'subsubcase':
            // 如果没有用过case或subcase就直接打了subsubcase，那么忽略
            if (no.case[LEVEL_CASE] === 0 || no.case[LEVEL_SUBCASE] === 0) {
              continue;
            }
            no.case[LEVEL_SUBSUBCASE]++;
            currentLevel = LEVEL_SUBSUBCASE;
            break;
        }
        break;
      default:
        const x: never = rule.group;
        throw new Error(`Unexpected group: ${x}`);
    }

    lastGroup = rule.group;
    lastLevel[rule.group] = currentLevel;

    // 更新编号
    lines[i] = line.replace(rule.regex, rule.format(no[rule.group]) + '. ');
    console.log('更新后 ', i, ':', lines[i]);
  }
  lines.push('干过了' + new Date().toLocaleString());
  save(lines.join('\n'), filePath);
};
