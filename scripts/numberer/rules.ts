import { ccmd, ccms } from '../misc';
import { MatchRule, MatchResult } from './types';

/**
 * 最大标题级别，markdown支持的最大标题级别为6 \
 * Maximum heading level, the maximum heading level supported by markdown is 6
 */
export const MAX_H_LEVEL = 6;

/**
 * 最大case级别 \
 * Maximum case level
 */
export const MAX_CASE_LEVEL = 3;

export const LEVEL_CASE = 0;
export const LEVEL_SUBCASE = 1;
export const LEVEL_SUBSUBCASE = 2;

/**
 * 创建正则和关键字的组合对象，专用于创建数学关键字 \
 * 需注意，含有标签的在前，不含标签的在后 \
 * Create a combination of regex and keyword objects, specifically for mathematical keywords \
 * Note that those with tags come first, and those without tags come second
 * @param keyword 关键词，中文或英文
 */
const createRegex = (o: Omit<MatchRule, 'regex' | 'idRegex' | 'format'>) =>
  [
    {
      ...o,
      regex: o.keyword.match(/^[a-zA-Z]+$/) // 区分中英文，英文需要\b来匹配单词边界
        ? new RegExp(
            `^[\\s]{0,}(?:\\*\\*|__)?<${o.tag}[^>]*>\\**\\b${o.keyword}\\b(?:\\s+\\d+(?:\\.\\d+)*\\.?|\\.\\**)?\\**<\\/${o.tag}>(?:\\*\\*|__)?[\\s]{0,}`,
            'i'
          )
        : new RegExp(
            `^[\\s]{0,}(?:\\*\\*|__)?<${o.tag}[^>]*>\\**${o.keyword}(?:\\s+\\d+(?:\\.\\d+)*\\.?|\\.\\**)?\\**<\\/${o.tag}>(?:\\*\\*|__)?[\\s]{0,}`,
            'i'
          ),
      idRegex: new RegExp(`<${o.tag}[^>]*id="([^"]+)"[^>]*>`, 'i'),
      format: (no: number[]) => {
        const _no = no.join('.').replace(/[0\.]+$/, '');
        return `<${o.tag} id="${o.tag}${_no}">${o.keyword} ${_no}</${o.tag}>`;
      },
    },
    {
      ...o,
      regex: o.keyword.match(/^[a-zA-Z]+$/) // 区分中英文，英文需要\b来匹配单词边界
        ? new RegExp(
            `^[\\s]{0,}(?:\\*\\*|__)?\\b${o.keyword}\\b(?:\\s+\\d+(?:\\.\\d+)*\\.?|\\.)?(?:\\*\\*|__)?[\\s]{0,}`,
            'i'
          )
        : new RegExp(
            `^[\\s]{0,}(?:\\*\\*|__)?${o.keyword}(?:\\s+\\d+(?:\\.\\d+)*\\.?|\\.)?(?:\\*\\*|__)?[\\s]{0,}`,
            'i'
          ),
      idRegex: new RegExp(`<${o.tag}[^>]*id="([^"]+)"[^>]*>`, 'i'),
      format: (no: number[]) => {
        const _no = no.join('.').replace(/[0\.]+$/, '');
        return `<${o.tag} id="${o.tag}${_no}">${o.keyword} ${_no}</${o.tag}> `;
      },
    },
  ] as MatchRule[];

export const MATCH_RULES = Array.from({ length: MAX_H_LEVEL }, (v, i) => ({
  keyword: '#'.repeat(MAX_H_LEVEL - i),
  tag: 'h',
  group: 'h',
  regex: new RegExp(`^[\\s]{0,}#{${MAX_H_LEVEL - i}}[\\s]{0,}[0-9.]{0,}[\\s]{0,}`, 'i'),
  idRegex: new RegExp(`<h[1-${MAX_H_LEVEL}][^>]*id="([^"]+)"[^>]*>`, 'i'),
  format: (no: number[]) => {
    const _no = no.join('.').replace(/[0\.]+$/, '');
    return `${'#'.repeat(MAX_H_LEVEL - i)} ${_no}`;
  },
})).concat(
  createRegex({ keyword: 'Theorem', tag: 'theorem', group: 'theorem' }),
  createRegex({ keyword: '定理', tag: 'theorem', group: 'theorem' }),
  createRegex({ keyword: 'Lemma', tag: 'lemma', group: 'theorem' }),
  createRegex({ keyword: '引理', tag: 'lemma', group: 'theorem' }),
  createRegex({ keyword: 'Corollary', tag: 'corollary', group: 'theorem' }),
  createRegex({ keyword: '推论', tag: 'corollary', group: 'theorem' }),
  createRegex({ keyword: 'Proposition', tag: 'proposition', group: 'theorem' }),
  createRegex({ keyword: '命题', tag: 'proposition', group: 'theorem' }),
  createRegex({ keyword: 'Definition', tag: 'definition', group: 'definition' }),
  createRegex({ keyword: '定义', tag: 'definition', group: 'definition' }),
  createRegex({ keyword: 'Axiom', tag: 'axiom', group: 'axiom' }),
  createRegex({ keyword: '公理', tag: 'axiom', group: 'axiom' }),
  createRegex({ keyword: 'Case', tag: 'case', group: 'case' }),
  createRegex({ keyword: 'Subcase', tag: 'subcase', group: 'case' }),
  createRegex({ keyword: 'Subsubcase', tag: 'subsubcase', group: 'case' })
) as MatchRule[];

/**
 * 从上方的规则组查找可匹配的项 \
 * Find a matched item from the rules above
 * @param str 待匹配字符串
 * @returns 匹配结果，如果没有匹配项则返回undefined
 */
export const findMatch = (str: string): MatchResult | undefined => {
  for (let i = 0; i < MATCH_RULES.length; i++) {
    const rule = MATCH_RULES[i];
    const m = str.match(rule.regex);
    if (m) {
      return {
        str: m[0],
        index: i,
        rule,
      };
    }
  }
  return undefined;
};

/**
 * HELP对象写在里面是为了方便和其他HELP对象Assign在一起 \
 * The HELP object is written inside to facilitate assignment with other HELP objects
 */
export const HELP = {
  number: {
    mathRule: [
      {
        noun: 'theorem',
        rule: `Follow the serial of sections. If current section is '1.2', theorems will be numbered as '1.2.x'`,
        detail: `Share the same serial with lemma, corollary, proposition. Like 'Theorem 1.1', then 'Lemma 1.2', 'Lemma 1.3', 'Corollary 1.4'`,
      },
      { noun: 'lemma', rule: `Uses the same numbering scheme as theorem`, detail: `` },
      {
        noun: 'corollary',
        rule: `Uses the same numbering scheme as theorem`,
        detail: ``,
      },
      {
        noun: 'proposition',
        rule: `Uses the same numbering scheme as theorem`,
        detail: ``,
      },
      { noun: 'definition', rule: `Same as theorem. Numbered independently`, detail: `` },
      { noun: 'axiom', rule: `Same as theorem. Numbered independently`, detail: `` },
      {
        noun: 'case',
        rule: `Comes without prefix of section number. Numbered independently in proof`,
        detail: `If now we enter 'section 2.3', 'case' will be numbered as 'case 1',not 'case 2.3.1'. When in a proof block, the numbering will be independent of external contents. Begin of a proof will be matched by '*proof*' or '_proof_', and end of a proof will be matched by 'Q.E.D.' or '$\\square$'`,
      },
    ],
    exampleMathRule: {
      cmd: `${ccmd('$')} ma number --math rule `,
      comment: ccms(`Display detailed rules of numbering mathematical keywords`),
    },
    example: [
      {
        cmd: `${ccmd('$')} ma number --dir myfolder`,
        comment: ccms(`Numbering titles of files in myfolder`),
      },
      {
        cmd: `${ccmd('$')} ma number --dir myfolder --anchor`,
        comment: ccms(`Numbering titles of files in 'myfolder'`),
      },
      {
        cmd: `${ccmd('$')} ma number --dir mathstudy --math`,
        comment: ccms(
          `Numbering titles, theorems, axioms and other mathematical keywords of files in 'mathstudy'`
        ),
      },
    ],
  },
};
