import { ccmd, ccms } from '../misc';

export const findMatch = (str: string, regexes: RegExp[]) => {
  for (let i = 0; i < regexes.length; i++) {
    const m = str.match(regexes[i]);
    if (m) {
      return { value: m[0], index: i };
    }
  }
  return { value: null, index: -1 };
};

export const MATH_KEYWORD_REGEX = {
  theorem: [
    // 历史最高： /(?:\*\*|__)?(?:<theorem[^>]*>)?\**\btheorem\b\**(?:\s+\d+(?:\.\d+)*\.?|\.\**)?(?:<\/theorem>)?(?:\*\*|__)?/i,

    /^[\s]{0,}(?:\*\*|__)?<theorem[^>]*>\**\btheorem\b(?:\s+\d+(?:\.\d+)*\.?|\.\**)?\**<\/theorem>(?:\*\*|__)?/i,
    /^[\s]{0,}(?:\*\*|__)?\btheorem\b(?:\s+\d+(?:\.\d+)*\.?|\.)?(?:\*\*|__)?/i,
  ],
  definition: [],
  axiom: [],
  case: [],
  // 'proof',
  // 'remark',
  // 'assumption',
  // 'summary',
  // 'conclusion',
};

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
      { noun: 'corollary', rule: `Same as theorem. And share serial with it`, detail: `` },
      { noun: 'proposition', rule: `Same as theorem. And share serial with it`, detail: `` },
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
          `Numbering titles, ${MATH_KEYWORD.slice(0, 2).join(', ')}... of files in 'mathstudy'`
        ),
      },
    ],
  },
};
