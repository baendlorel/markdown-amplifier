import { ccmd, ccms } from '../misc';

const MATH_KEYWORD = {
  theorem: { regex: /^theorem/i },
  lemma: { regex: /^lemma/i },
  corollary: { regex: /^corollary/i },
  proposition: { regex: /^proposition/i },
  definition: { regex: /^definition/i },
  axiom: { regex: /^axiom/i },
  case: { regex: /^case/i },
  // 'proof',
  // 'remark',
  // 'assumption',
  // 'summary',
  // 'conclusion',
};

const WORDS_SUPPORTED_BY_NUMBERER = Object.keys(MATH_KEYWORD);

export const HELP = {
  number: {
    supportedWords: WORDS_SUPPORTED_BY_NUMBERER,
    mathRule: [
      {
        noun: 'theorem',
        rule: `Follow the serial of sections. If current section is '1.2', theorems will be numbered as '1.2.x'`,
        detail: `Share the same serial with lemma, corollary, proposition. Like 'Theorem 1.1', then 'Lemma 1.2', 'Lemma 1.3', 'Corollary 1.4'`,
      },
      { noun: 'lemma', rule: `Same as theorem. And share serial with it`, detail: `` },
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
      cmd: `${ccmd('$')} note number --math rule `,
      comment: ccms(`Display detailed rules of numbering mathematical keywords`),
    },
    example: [
      {
        cmd: `${ccmd('$')} note number --dir myfolder`,
        comment: ccms(`Numbering titles of files in myfolder`),
      },
      {
        cmd: `${ccmd('$')} note number --dir myfolder --anchor`,
        comment: ccms(`Numbering titles of files in 'myfolder'`),
      },
      {
        cmd: `${ccmd('$')} note number --dir mathstudy --math`,
        comment: ccms(
          `Numbering titles, ${WORDS_SUPPORTED_BY_NUMBERER.slice(0, 2).join(
            ', '
          )}... of files in 'mathstudy'`
        ),
      },
    ],
  },
  encrypt: {
    example: [
      {
        cmd: `${ccmd('$')} note encrypt 123456`,
        comment: ccms(`Encrypt with key 123456, log language is same as system`),
      },
      {
        cmd: `${ccmd('$')} note encrypt 123456 -z`,
        comment: ccms(`Encrypt with key 123456, log language is Chinese`),
      },
      {
        cmd: `${ccmd('$')} note encrypt 123456 --en`,
        comment: ccms(`Encrypt with key 123456, log language is English`),
      },
    ],
  },
  decrypt: {
    example: [
      {
        cmd: `${ccmd('$')} note decrypt 123456`,
        comment: ccms(`Decrypt with key 123456, log language is same as system`),
      },
      {
        cmd: `${ccmd('$')} note decrypt 123456 -z`,
        comment: ccms(`Decrypt with key 123456, log language is Chinese`),
      },
      {
        cmd: `${ccmd('$')} note decrypt 123456 --en`,
        comment: ccms(`Decrypt with key 123456, log language is English`),
      },
    ],
  },
};
