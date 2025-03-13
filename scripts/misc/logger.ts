/**
 * @name Logger
 * @description
 * 依赖于locale
 */
//// l(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);
import { log as l } from 'console';
import chalk from 'chalk';
import stringWidth from 'string-width';
import { i } from './locale';

type Log = ((zh: string, en?: string) => void) & {
  incrIndent: () => void;
  decrIndent: () => void;
  setIndent: (n: number) => void;
  setPadding: (left: number, right: number) => void;
};

let indent = '';
let padLeft = ' ';
let padRight = ' ';
let gap = ' ';

// padding i18n
const pdi = (zh: string, en?: string) => padLeft + i(zh, en ?? zh) + padRight;
export const log = ((zh: string, en?: string) => l(indent + pdi(zh, en))) as Log;
Object.defineProperties(log, {
  incrIndent: {
    value: () => (indent += '  '),
  },
  decrIndent: {
    value: () => (indent = indent.replace('  ', '')),
  },
  setIndent: {
    value: (n: number) => (indent = ' '.repeat(n)),
  },
  setPadding: {
    value: (left: number, right: number) => {
      padLeft = ' '.repeat(left);
      padRight = ' '.repeat(right);
      gap = ' '.repeat((left + right) / 2);
    },
  },
});

export const br = () => l();

// # 彩色日志
export const lred = (zh: string, en?: string) => l(indent + chalk.red(pdi(zh, en)));
export const lbgRed = (zh: string, en?: string) => l(indent + chalk.bgRed(pdi(zh, en)));

export const lgreen = (zh: string, en?: string) => l(indent + chalk.green(pdi(zh, en)));
export const lbgGreen = (zh: string, en?: string) => l(indent + chalk.bgGreen(pdi(zh, en)));

export const lsucc = (zh: string, en?: string) => l(indent + chalk.rgb(25, 135, 84)(pdi(zh, en)));
export const lbgSucc = (zh: string, en?: string) =>
  l(indent + chalk.bgRgb(25, 135, 84).white(pdi(zh, en)));

export const lyellow = (zh: string, en?: string) => l(indent + chalk.yellow(pdi(zh, en)));
export const lbgYellow = (zh: string, en?: string) => l(indent + chalk.yellow(pdi(zh, en)));

export const lgrey = (zh: string, en?: string) => l(indent + chalk.grey(pdi(zh, en)));
export const lbgGrey = (zh: string, en?: string) => l(indent + chalk.bgGrey(pdi(zh, en)));

export const lblue = (zh: string, en?: string) => l(indent + chalk.blue(pdi(zh, en)));
export const lbgBlue = (zh: string, en?: string) => l(indent + chalk.bgBlue(pdi(zh, en)));

// # 功能日志
export const lerr = (zh: string, en?: string, title?: string) => {
  const header = ` ${title ?? 'Cryption Error'} `;
  const content = i(zh, en ?? zh);
  l(
    chalk.bgRed(header) +
      chalk.red(' ' + content.replace(/\n/, '\n' + ' '.repeat(stringWidth(header))))
  );
};

export const table = (data: any[], props: { index: string; alias?: string }[]) => {
  const nm = (o: { index: string; alias?: string }) => o.alias ?? o.index;
  const pad = (text: string, length: number) => text + ' '.repeat(length - stringWidth(text));
  const logRow0 = (row: string[]) => l(`${padLeft}${row.join(gap)}${padRight}`);
  const logRow1 = (row: string[]) =>
    l(chalk.bgRgb(44, 44, 54)(`${padLeft}${row.join(gap)}${padRight}`));

  // 以表头文字宽度为初值，用reduce求出每列的最大宽度
  const max = data.reduce(
    (prev, cur) => {
      for (const p of props) {
        prev[p.index] = Math.max(prev[p.index], stringWidth(cur[p.index]));
      }
      return prev;
    },
    props.reduce((prev, cur) => ((prev[cur.index] = stringWidth(nm(cur))), prev), {})
  );

  const header = props.map((p) => pad(nm(p), max[p.index]));
  logRow1(header);
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const row = props.map((p) => pad(d[p.index], max[p.index]));
    if (i % 2 === 0) {
      logRow0(row);
    } else {
      logRow1(row);
    }
  }
};
