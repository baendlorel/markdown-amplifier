import { ccmd, ccms } from '../misc';

export type RuleName = 'definition' | 'axiom' | 'case' | 'h' | 'theorem';

type MatchRule = {
  keyword: string;

  /**
   * 用于匹配的关键字的正则表达式 \
   * Regular expression used for keyword matching
   */
  regex: RegExp;

  /**
   * 规则名称 \
   * 一般和keyword相同，但theorem、lemma、corollary、proposition是一个规则 \
   * Rule name \
   * Usually the same as keyword, but theorem, lemma, corollary, proposition share the name ruleName of 'theorem'
   */
  ruleName: RuleName;
};

type MatchResult = {
  /**
   * 正则匹配得到的第一个匹配项 \
   * The first matched string obtained by regular matching
   */
  str: string;

  /**
   * 是匹配的项的下标 \
   * Index of the matched rule
   */
  index: number;

  /**
   * 使用的规则 \
   * Rule used
   */
  rule: MatchRule;
};

/**
 * 最大标题级别，markdown支持的最大标题级别为6 \
 * Maximum heading level, the maximum heading level supported by markdown is 6
 */
export const MAX_H_LEVEL = 6;

/**
 * 创建正则和关键字的组合对象，专用于创建数学关键字 \
 * 需注意，含有标签的在前，不含标签的在后 \
 * Create a combination of regex and keyword objects, specifically for mathematical keywords \
 * Note that those with tags come first, and those without tags come second
 * @param keyword 关键词
 */
const createRegex = (keyword: string): [MatchRule, MatchRule] => [
  {
    keyword,
    ruleName: keyword.toLowerCase() as RuleName,
    regex: new RegExp(
      `^[\\s]{0,}(?:\\*\\*|__)?<${keyword}[^>]*>\\**\\b${keyword}\\b(?:\\s+\\d+(?:\\.\\d+)*\\.?|\\.\\**)?\\**<\\/${keyword}>(?:\\*\\*|__)?`,
      'i'
    ),
  },
  {
    keyword,
    ruleName: keyword.toLowerCase() as RuleName,
    regex: new RegExp(
      `^[\\s]{0,}(?:\\*\\*|__)?\\b${keyword}\\b(?:\\s+\\d+(?:\\.\\d+)*\\.?|\\.)?(?:\\*\\*|__)?`,
      'i'
    ),
  },
];

export const MATCH_RULES = new Array(MAX_H_LEVEL)
  .map((v, i) => ({
    keyword: '#'.repeat(i + 1),
    regex: new RegExp(`^[\\s]{0,}#{${i + 1}}[\\s]{0,}[0-9.]{0,}`, 'i'),
    ruleName: 'h',
  }))
  .concat(
    createRegex('Theorem'),
    createRegex('Lemma'),
    createRegex('Corollary'),
    createRegex('Proposition'),
    createRegex('Definition'),
    createRegex('Axiom'),
    createRegex('Case')
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

// 'proof',
// 'remark',
// 'assumption',
// 'summary',
// 'conclusion',

const MATH_KEYWORD = [
  'theorem',
  'lemma',
  'corollary',
  'proposition',
  'definition',
  'axiom',
  'case',
];

export const HELP = {
  number: {
    supportedWords: MATH_KEYWORD,
    mathRule: [
      {
        noun: 'theorem',
        rule: `Follow the serial of sections. If current section is '1.2', theorems will be numbered as '1.2.x'`,
        detail: `Share the same serial with lemma, corollary, proposition. Like 'Theorem 1.1', then 'Lemma 1.2', 'Lemma 1.3', 'Corollary 1.4'`,
      },
      { noun: 'lemma', rule: `Share the same serial with theorem`, detail: `` },
      {
        noun: 'corollary',
        rule: `Same as theorem. And share serial with it`,
        detail: ``,
      },
      {
        noun: 'proposition',
        rule: `Same as theorem. And share serial with it`,
        detail: ``,
      },
      { noun: 'definition', rule: `Same as theorem. Numbered independently`, detail: `` },
      { noun: 'axiom', rule: `Same as theorem. Numbered independently`, detail: `` },
      {
        noun: 'case',
        rule: `Same as theorem. Numbered independently in section and proof`,
        detail: `When in a proof block, the numbering will be independent of external contents. Begin of a proof will be matched by '*proof*' or '_proof_', and end of a proof will be matched by 'Q.E.D.' or '$\\square$'`,
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
          `Numbering titles, ${MATH_KEYWORD.slice(0, 2).join(
            ', '
          )}... of files in 'mathstudy'`
        ),
      },
    ],
  },
};
