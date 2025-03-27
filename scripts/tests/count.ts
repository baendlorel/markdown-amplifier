import fs from 'fs';
import path from 'path';

const getAllFiles = (
  dir: string,
  excludes: (dirname: string, fileName: string) => boolean
): string[] => {
  const list = [] as string[];
  const _detect = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
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
  console.log('dir :', path.relative(__dirname, dir));
  const list = getAllFiles(dir, (dir: string, fp: string) => {
    const stat = fs.statSync(path.join(dir, fp));
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

countLines(path.join(__dirname, '../'));
console.log('----------------');
countLines(path.join(__dirname, '../memdb'));
