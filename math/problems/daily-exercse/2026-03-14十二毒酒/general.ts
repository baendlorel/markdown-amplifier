class Vector {
  data: boolean[];
  dimension: number;
  constructor(arg: number | boolean[]) {
    if (typeof arg === 'number') {
      this.dimension = arg;
      this.data = new Array(arg).fill(false); // 0,0,0,...,0
    }
    if (Array.isArray(arg)) {
      this.dimension = arg.length;
      this.data = arg.map((x) => !!x); // [0,1,0,1] => [false,true,false,true]
    }
    throw new Error('Invalid argument');
  }

  not(): Vector {
    return new Vector(this.data.map((x) => !x));
  }

  and(other: Vector): Vector {
    if (this.dimension !== other.dimension) {
      throw new Error('Dimension mismatch');
    }
    return new Vector(this.data.map((x, i) => x && other.data[i]));
  }
}

/**
 * 罗列所有可能的试纸滴了哪几杯酒的可能性
 * - 每个试纸至少滴一杯酒
 * - 每种可能性里的滴法不重复
 */
function createTissuePosibilities(tissueCount: number, cupCount: number): number[][] {
  const result: number[][] = [Array.from({ length: tissueCount }, () => 0)];

  const getNext = (current: number[] | null): number[] | null => {
    if (!current) {
      return null;
    }
    const next = [...current];
    for (let i = 0; i < next.length; i++) {
      const n = next[i];
      if (n + 1 < cupCount) {
        next[i] = n + 1;
        return next;
      } else {
        next[i] = 0;
      }
    }
    console.log('到头了');
    return null;
  };

  let next: number[] | null = result[0];
  while ((next = getNext(next))) {
    result.push(next);
  }
  console.log(result.map((r) => r.map((x) => x.toString(2).padStart(tissueCount, '0'))));
  return result;
}

// createTissuePosibilities(2, 3);

/**
 * 毒酒只有一杯
 * 试纸只能用一次
 */
export function solve(tissueCount: number, cupCount: number) {
  const a = 0;
  const b = 0;
  const c = 0;
  const d = 0;
}

declare global {
  let a: number;
  let b: number;
  let c: number;
  let bitRev: (n: number) => number;
}

function test() {
  a = 0b10101010;
  b = 0b11001100;
  c = 0b11110000;

  bitRev = (n: number) =>
    parseInt(
      n
        .toString(2)
        .padStart(8, '0')
        .split('')
        .map((x) => (x === '0' ? '1' : '0'))
        .join(''),
      2,
    );

  const equals = (expr: string, expected: number) => {
    const originalExpr = expr;
    expr = originalExpr.replace(/\~([a-z])/g, (_, v) => `bitRev(${v})`);
    const result = new Function(`return ${expr}`)();
    console.log(`${originalExpr} = ${result} (${result === expected ? 'OK' : 'FAIL, expected ' + expected})`);
  };
  equals('a & b & c', 0b10000000);
  equals('~a & b & c', 0b01000000);
  equals('a & ~b & c', 0b00100000);
  equals('~a & ~b & c', 0b00010000);
  equals('a & b & ~c', 0b00001000);
  equals('~a & b & ~c', 0b00000100);
  equals('a & ~b & ~c', 0b00000010);
  equals('~a & ~b & ~c', 0b00000001);
}
test();
