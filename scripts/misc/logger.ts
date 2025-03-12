/**
 * @name Logger
 * @description
 * 依赖于locale
 */
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);
import stringWidth from 'string-width';
import chalk from 'chalk';
import { i } from './locale';

const createLogger = () => {
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

  const log = ((zh: string, en?: string) => console.log(indent + pdi(zh, en))) as Log;
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

  const lred = (zh: string, en?: string) => console.log(chalk.red(pdi(zh, en)));
  const lbgRed = (zh: string, en?: string) => console.log(chalk.bgRed(pdi(zh, en)));

  const lgreen = (zh: string, en?: string) => console.log(chalk.green(pdi(zh, en)));
  const lbgGreen = (zh: string, en?: string) => console.log(chalk.bgGreen(pdi(zh, en)));

  const lsucc = (zh: string, en?: string) => console.log(chalk.rgb(25, 135, 84)(pdi(zh, en)));
  const lbgSucc = (zh: string, en?: string) =>
    console.log(chalk.bgRgb(25, 135, 84).white(pdi(zh, en)));

  const lgrey = (zh: string, en?: string) => console.log(chalk.grey(pdi(zh, en)));
  const lbgGrey = (zh: string, en?: string) => console.log(chalk.bgGrey(pdi(zh, en)));

  const lblue = (zh: string, en?: string) => console.log(chalk.blue(pdi(zh, en)));
  const lbgBlue = (zh: string, en?: string) => console.log(chalk.bgBlue(pdi(zh, en)));

  const table = (data: any[], props: { index: string; alias?: string }[]) => {
    const nm = (o: { index: string; alias?: string }) => o.alias ?? o.index;
    const pad = (text: string, length: number) => text + ' '.repeat(length - stringWidth(text));
    const logRow0 = (row: string[]) => console.log(`${padLeft}${row.join(gap)}${padRight}`);
    const logRow1 = (row: string[]) =>
      console.log(chalk.bgRgb(44, 44, 54)(`${padLeft}${row.join(gap)}${padRight}`));

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

  return {
    br: () => console.log(),
    log,
    lred,
    lbgRed,
    lgreen,
    lbgGreen,
    lsucc,
    lbgSucc,
    lgrey,
    lbgGrey,
    lblue,
    lbgBlue,
    table,
  };
};

export const {
  br,
  log,
  lred,
  lbgRed,
  lgreen,
  lbgGreen,
  lsucc,
  lbgSucc,
  lgrey,
  lbgGrey,
  lblue,
  lbgBlue,
  table,
} = createLogger();
