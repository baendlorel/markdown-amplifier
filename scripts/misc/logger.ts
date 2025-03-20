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

type Logger = ((zh: string, en?: string) => void) & {
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
export const pdi = (zh: string, en?: string) => padLeft + i(zh, en ?? zh) + padRight;
export const log = ((zh: string, en?: string) => l(indent + pdi(zh, en))) as Logger;
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

export const br = l;

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
export const lflag = (zh: string, en?: string) =>
  l(chalk.bgRgb(65, 65, 65).white(' Note ') + chalk.bgRgb(23, 53, 137)(pdi(zh, en)));

export const lerr = (zh: string, en?: string, title?: string) => {
  const header = ` ${title ?? 'Note Error'} `;
  const content = i(zh, en ?? zh);
  l(
    chalk.bgRed(header) +
      chalk.red(' ' + content.replace(/\n/, '\n' + ' '.repeat(stringWidth(header))))
  );
};

// # 表格函数
const nm = (o: { index: string; alias?: string }) => o.alias ?? o.index;
const pad = (text: string, length: number) => text + ' '.repeat(length - stringWidth(text));
const joinRow = (row: string[], colWidth: number[]) => {
  if (row.some((t) => t.includes('\n'))) {
    // 把本行每一列按换行符分割
    const linedRow = row.map((t) => t.split('\n'));
    // 找出最大行数
    const maxLineCount = Math.max(...linedRow.map((lr) => lr.length));

    let inlineRows = [] as string[];
    for (let i = 0; i < maxLineCount; i++) {
      // linedRow[0-length][i] pad to colWidth
      const curInlineRow = linedRow.map((lr, colIndex) => pad(lr[i] ?? '', colWidth[colIndex]));
      inlineRows.push(`${padLeft}${curInlineRow.join(gap)}${padRight}`);
    }
    return inlineRows.join('\n');
  }
  // 如果r的每一项都没有换行符，那么直接如下操作
  else {
    const paddedRow = row.map((r, i) => pad(r, colWidth[i]));
    return `${padLeft}${paddedRow.join(gap)}${padRight}`;
  }
};
/**
 * 将字符串按指定长度自动添加换行符
 * @param str 要处理的字符串
 * @param maxLength 每行的最大长度
 * @returns 添加换行符后的字符串
 */
const wrap = (str: string, maxLength: number) => {
  let result = '';
  let currentLine = '';
  let lastEolIsManuallyAdded = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '\n') {
      // 如果上一个字符不是换行符，那么正常加上
      if (!lastEolIsManuallyAdded) {
        lred(`i=${i} r:${result.replaceAll('\n', '_')}`);
        result += currentLine + '\n';
        currentLine = '';
      }
      // 如果上一个字符是换行符，而且是手动加的，说明重复了，这里跳过
      lastEolIsManuallyAdded = false;
      continue;
    }
    currentLine += char;
    if (stringWidth(currentLine) >= maxLength) {
      // 已经是最后一个字，那么不用加了
      if (i === str.length - 1) {
        continue;
      }
      result += currentLine + '\n';
      currentLine = '';
    }
    lastEolIsManuallyAdded = true;
  }

  // 添加剩余的字符
  if (currentLine) {
    result += currentLine;
  }

  lgreen(`result:${result.replaceAll('\n', '_')}`);
  return result;
};
const initTableData = (
  data: any[],
  properties?: { index: string; alias?: string; maxWidth?: number }[] | string[]
) => {
  // 归一化props
  let props: { index: string; alias: string; maxWidth: number }[];
  if (properties) {
    props = properties.map((p) => {
      if (typeof p === 'string') {
        return { index: p, alias: p, maxWidth: Infinity };
      }
      if (p.index && !p.alias) {
        return { index: p.index, alias: p.index, maxWidth: p.maxWidth ?? Infinity };
      }
      return { index: p.index, alias: p.alias, maxWidth: p.maxWidth ?? Infinity };
    }) as { index: string; alias: string; maxWidth: number }[];
  } else {
    props = data.reduce((prev, cur) => {
      for (const key in cur) {
        if (!prev.find((o) => o.index === key)) {
          prev.push({ index: key, alias: key, maxWidth: Infinity });
        }
      }
      return prev;
    }, [] as { index: string; alias: string; maxWidth: number }[]);
  }

  // 以表头文字宽度为初值，用reduce求出每列的最大宽度
  const max = data.reduce(
    (prev, cur) => {
      for (const p of props) {
        const text = cur[p.index];
        if (text.includes('\n')) {
          const maxLineWidth = Math.max(...text.split('\n').map((l) => stringWidth(l)));
          prev[p.index] = Math.max(prev[p.index], maxLineWidth);
        } else {
          prev[p.index] = Math.max(prev[p.index], stringWidth(cur[p.index]));
        }
        // 如果超过了最大行数，那么要对本行进行分割
        if (prev[p.index] > p.maxWidth) {
          cur[p.index] = wrap(text, p.maxWidth); // 这里添加换行符的行为实际上改动了data
          prev[p.index] = p.maxWidth;
        }
      }
      return prev;
    },
    props.reduce((prev, cur) => ((prev[cur.index] = stringWidth(nm(cur))), prev), {})
  );

  return { data, props, max };
};

export const table = (
  data: any[],
  properties?: { index: string; alias?: string; maxWidth?: number }[] | string[]
) => {
  const logRow0 = (row: string[], colWidth: number[]) => l(joinRow(row, colWidth));
  const logRow1 = (row: string[], colWidth: number[]) =>
    l(chalk.bgRgb(44, 44, 54)(joinRow(row, colWidth)));

  const { max, props } = initTableData(data, properties);

  // 由max计算列宽
  const colWidth = props.map((p) => max[p.index]);

  const header = props.map((p) => pad(nm(p), max[p.index]));
  logRow1(header, colWidth);
  for (let i = 0; i < data.length; i++) {
    const row = props.map((p) => data[i][p.index]);
    i % 2 === 0 ? logRow0(row, colWidth) : logRow1(row, colWidth);
  }
};

export const aligned = (
  data: any[],
  properties?: { index: string; alias?: string; maxWidth?: number }[] | string[]
) => {
  const logRow = (row: string[], colWidth: number[]) => l(joinRow(row, colWidth));
  const { max, props } = initTableData(data, properties);

  // 由max计算列宽
  const colWidth = props.map((p) => max[p.index]);
  for (let i = 0; i < data.length; i++) {
    const row = props.map((p) => data[i][p.index]);
    logRow(row, colWidth);
  }
};
