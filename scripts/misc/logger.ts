/**
 * @name Logger
 * @description
 * 依赖于locale
 */
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);
import stringWidth from 'string-width';
import chalk from 'chalk';
import { i } from './locale';

export const log = (zh: string, en?: string) =>
  en === undefined ? console.log(zh) : console.log(i(zh, en));

export const lred = (zh: string, en?: string) =>
  en === undefined ? log(chalk.red(zh)) : log(chalk.red(i(zh, en)));
export const lbgRed = (zh: string, en?: string) =>
  en === undefined ? log(chalk.bgRed(zh)) : log(chalk.bgRed(i(zh, en)));

export const lgrey = (zh: string, en?: string) =>
  en === undefined ? log(chalk.grey(zh)) : log(chalk.grey(i(zh, en)));
export const lbgGrey = (zh: string, en?: string) =>
  en === undefined ? log(chalk.bgGrey(zh)) : log(chalk.bgGrey(i(zh, en)));

export const lblue = (zh: string, en?: string) =>
  en === undefined ? log(chalk.blue(zh)) : log(chalk.blue(i(zh, en)));
export const lbgBlue = (zh: string, en?: string) =>
  en === undefined ? log(chalk.bgBlue(zh)) : log(chalk.bgBlue(i(zh, en)));

export const table = (data: any[], props: { index: string; alias?: string }[]) => {
  const nm = (o: { index: string; alias?: string }) => o.alias ?? o.index;
  const pad = (text: string, length: number) => text + ' '.repeat(length - stringWidth(text));
  const logRow0 = (row: string[]) => log('  ' + row.join('  ') + '  ');
  const logRow1 = (row: string[]) => log(chalk.bgRgb(44, 44, 54)('  ' + row.join('  ') + '  '));

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
