import fs from 'fs';
import path, { join } from 'path';
import { compress, compressSync, decompress, decompressSync } from '../memdb/brotli';

function getDependency() {
  const files = new Set(fs.readdirSync(join(__dirname, 'misc')));
  files.delete('index.ts');

  const list = [] as string[];
  for (const p of files) {
    const content = fs.readFileSync(join(__dirname, 'misc', p)).toString();
    const matched = content.match(/\/\*\*([\s\S]*?)\*\//);

    list.push(matched ? matched[0] : '[ERR]' + p);
  }
  console.log(list.join('\n'));
}

const getAllFiles = (
  dir: string,
  excludes: (dirname: string, fileName: string) => boolean
): string[] => {
  const list = [] as string[];
  const _detect = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = fs.statSync(filePath);
      if (excludes(dir, file)) {
        continue; // 跳过部分文件夹
      }
      stat.isDirectory() ? _detect(filePath) : list.push(filePath);
    }
  };
  _detect(dir);
  return list;
};

function countLines(dir: string) {
  const list = getAllFiles(dir, (dir: string, fp: string) => {
    const stat = fs.statSync(join(dir, fp));
    if (stat.isDirectory()) {
      return ['node_modules', '.git'].includes(fp);
    } else {
      return fp === 'test.ts' || path.extname(fp) !== '.ts';
    }
  });
  let linesCount = 0;
  let width = 0;
  let blankLinesCount = 0;
  let widthList = {} as { [key: number]: number };
  for (const f of list) {
    const content = fs.readFileSync(f).toString();
    const lines = content.split('\n');
    lines.forEach((l) => {
      const len = l.trim().length;
      if (len > 0) {
        widthList[len] ? (widthList[len] += 1) : (widthList[len] = 1);
        width += len;
      }
    });
    linesCount += lines.length;
    blankLinesCount += lines.filter((l) => l.trim() === '').length;
  }

  const reduceWidths = () => {
    const rangeIn = [
      { min: 0, max: 20 },
      { min: 20, max: 40 },
      { min: 40, max: 60 },
      { min: 60, max: 80 },
      { min: 80, max: 100 },
      { min: 100, max: Infinity },
    ];

    const reducedWidthList = Object.keys(widthList).reduce((prev, cur) => {
      const curWidthCount = widthList[cur];
      const rIdx = rangeIn.findIndex((r) => r.min <= Number(cur) && Number(cur) < r.max)!;
      prev[rIdx] ? (prev[rIdx] += curWidthCount) : (prev[rIdx] = curWidthCount);
      return prev;
    }, [] as { [k: number]: number });

    return rangeIn.map((r, idx) => {
      return `${r.min}-${r.max} : ${reducedWidthList[idx] ?? 0}`;
    });
  };

  console.log('lines            : ' + linesCount);
  console.log('none blank lines : ' + (linesCount - blankLinesCount));
  console.log('blank lines      : ' + blankLinesCount);
  console.log(
    'Avg line width   : ' + (width / (linesCount - blankLinesCount)).toFixed(2)
  );
  console.log('width stat       : ' + reduceWidths().join('\n                   '));
}

// countLines(process.cwd());
const brotli = async () => {
  fs.unlinkSync('lupin.txt');
  fs.unlinkSync('lupin.db');
  fs.unlinkSync('lupin2.db');
  console.log('创建10万条数据，每条数据10个长度为15的字符串');
  console.time('createRandom');
  const raw = Array.from({ length: 10_0000 }, () => {
    return Array.from({ length: 10 }, () =>
      Array.from({ length: 15 }, () =>
        String.fromCharCode(
          Math.random() > 0.5
            ? 65 + Math.floor(Math.random() * 26)
            : 97 + Math.floor(Math.random() * 26)
        )
      ).join('')
    );
  });
  const text = JSON.stringify(raw);
  console.timeEnd('createRandom');

  console.time('saveraw');
  fs.writeFileSync('lupin.txt', text);
  console.timeEnd('saveraw');

  console.time('compress');
  await compress(text, 'lupin.db');
  console.timeEnd('compress');

  console.time('decompress');
  await decompress('lupin.db');
  console.timeEnd('decompress');
  console.log();

  console.time('compressSync');
  compressSync(text, 'lupin2.db');
  console.timeEnd('compressSync');

  console.time('decompressSync');
  decompressSync('lupin2.db');
  console.timeEnd('decompressSync');
};

// filter方法最慢
// node环境下，第二种耗时=0.6filter，第三种耗时=0.6
// 浏览器环境下，第二种耗时=第三种耗时=0.35filter
function filterTest() {
  const arr = Array.from({ length: 10_000_000 }, () => Math.random());
  console.time('filter');
  const r1 = arr.filter((v) => v > 0.5);
  console.timeEnd('filter');

  console.time('for');
  const r2 = [] as number[];
  for (let i = 0; i < arr.length; i++) {
    const a = arr[i];
    if (a > 0.5) {
      r2.push(a);
    }
  }
  console.timeEnd('for');

  console.time('for2');
  const r3 = [] as number[];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 0.5) {
      r3.push(arr[i]);
    }
  }
  console.timeEnd('for2');

  console.log({ r1: r1.length, r2: r2.length });
}

// enum确实从0开始
function enumtest() {
  enum Line {
    FIELD,
    FIELD_TYPE,
    PRIMARY_KEY,
    INDEX,
    UNIQUE,
    DATA_START,
  }
  console.log(
    Line.FIELD,
    Line.FIELD_TYPE,
    Line.PRIMARY_KEY,
    Line.INDEX,
    Line.UNIQUE,
    Line.DATA_START,
    [23, 23][Line.FIELD]
  );
}

// 字符串相加是最快的
function testStringConcat() {
  const L = 1000000;
  console.time('join');
  const arr = [] as string[];
  for (let i = L; i < 2 * L; i++) {
    arr.push(i.toString(36));
  }
  arr.join();
  console.timeEnd('join');

  console.time('concat');
  let t = '';
  for (let i = L; i < 2 * L; i++) {
    t = t.concat(i.toString(36));
  }
  console.timeEnd('concat');

  console.time('add');
  let t2 = '';
  for (let i = L; i < 2 * L; i++) {
    t2 += i.toString(36);
  }
  console.timeEnd('add');
}

// ts函数func.toString不会有类型标注
// func.toString后，new Function('return '+str)可以获得一个返回该函数的函数
// new Function('return '+str)() 可以重构出原函数
function functionToString() {
  class A {
    static UUIDv4(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = (Math.random() * 16) | 0; // 生成 0-15 的随机数
        const value = char === 'x' ? random : (random & 0x3) | 0x8; // 确保符合 UUID v4 标准
        return value.toString(16); // 转换为十六进制
      });
    }
    vvid() {
      return 'vvid';
    }
    vvidarrow = () => {
      return 1;
    };
  }
  const uuidv4_a = (...a) => {
    return 'aaa\n\\';
  };
  const uuidv4_f = function () {
    return 'bbb\n\\';
  };
  function uuidv4_f2() {
    return 'cccc\n\\';
  }

  const recreateFunction = (s: string) => {
    s = s.trim();

    if (s.startsWith('(') || s.startsWith('function')) {
      return new Function('return ' + s)();
    }

    if (s.replace(/^\w+/g, '').startsWith('(')) {
      return new Function('return function ' + s)();
    }
  };

  const inst = new A();
  const funcs = {
    uuidv4_a,
    uuidv4_f,
    uuidv4_f2,
    'DBTable.UUIDv4': A.UUIDv4,
    'inst.vvid': inst.vvid,
    'inst.arrow': inst.vvidarrow,
  };

  for (const [name, func] of Object.entries(funcs)) {
    console.log(`----[${name}]--------------`);
    console.log('origin return:', func());
    console.log('toString:', func.toString());
    const re = recreateFunction(func.toString());
    console.log('recreated return:', re());
  }
}

functionToString();
