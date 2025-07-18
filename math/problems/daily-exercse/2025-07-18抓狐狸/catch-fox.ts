const getPaths = (holeCount: number, maxJumpCount: number) => {
  const path: number[] = [];
  const paths: number[][] = [];
  const jump = (i: number) => {
    if (path.length >= maxJumpCount) {
      return;
    }
    path.push(i);

    if (path.length === maxJumpCount) {
      paths.push([...path]);
    }

    if (i === 0) {
      jump(1);
    } else if (i === holeCount - 1) {
      jump(holeCount - 2);
    } else {
      jump(i + 1);
      jump(i - 1);
    }
    path.pop();
  };

  for (let i = 0; i < holeCount; i++) {
    jump(i);
  }

  return paths;
};

const check = (holeCount: number, pattern: number[]) => {
  if (!Number.isSafeInteger(holeCount) || holeCount < 1) {
    throw new Error('n must be a positive integer');
  }

  const paths = getPaths(holeCount, pattern.length);

  const mismatch: number[][] = [];
  paths.forEach((path) => {
    for (let i = 0; i < path.length; i++) {
      if (path[i] + 1 === pattern[i]) {
        return true;
      }
    }
    mismatch.push([...path]);
  });

  if (mismatch.length > 0) {
    console.log(`${holeCount}->${pattern}. Mismatch found:`);
    mismatch.forEach((m) => console.log(m.map((i) => i + 1).join(' ')));
  } else {
    console.log(`${holeCount}->${pattern}. All paths match the pattern.`);
  }
};

// check(2, [2, 2]);
// check(3, [2, 2]);
// check(4, [2, 2, 3, 3, 2]);
// check(5, [2, 2, 3, 3, 2, 2, 3, 3, 4]);
// check(5, [2, 2, 3, 3, 4, 4, 4, 3, 2]);
const find = (holeCount: number, maxJumpCount: number) => {
  const paths = getPaths(holeCount, maxJumpCount);
  const found: number[][] = [];
  const max = parseInt(
    Array.from({ length: maxJumpCount }, () => holeCount - 1).join(''),
    holeCount
  );
  console.log(`Searching for patterns up to ${max}, loop time: ${max * paths.length}...`);
  let count = 0;
  for (let i = 0; i <= max; i++) {
    const pat = i
      .toString(holeCount)
      .padStart(maxJumpCount, '0')
      .split('')
      .map((c) => parseInt(c, holeCount));

    let valid = false;
    for (let j = 0; j < paths.length; j++) {
      const p = paths[j];
      valid = false;
      for (let k = 0; k < maxJumpCount; k++) {
        if (p[k] === pat[k]) {
          valid = true;
          break;
        }

        count++;
        if (count % 1000000 === 0) {
          console.log(`Checked ${count / 1000000}e6 patterns...`);
        }
      }
      // 如果这一条p不满足，剩下的也不用看了
      if (!valid) {
        break;
      }
    }

    if (valid) {
      found.push(pat.map((t) => t + 1));
    }
  }
  return found;
};

() => {
  const found = find(7, 10);
  if (found.length === 0) {
    console.log('No valid patterns found.');
  } else {
    check(7, found[0]);
    console.log(
      `Found pattern!: \n${found.map((a) => a.join(' ')).join('\n')}\nTotal: ${found.length}`
    );
  }
};

check(8, [2, 3, 4, 5, 6, 7, 7, 6, 5, 4, 3, 2]);
check(9, [2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3, 2]);
check(9, [2, 3, 4, 5, 6, 7, 8, 2, 3, 4, 5, 6, 7, 8]);
check(10, [2, 3, 4, 5, 6, 7, 8, 9, 9, 8, 7, 6, 5, 4, 3, 2]);

// 洞数量和天数只比
// 1 - 1
// 2-2
// 3-2
// 4-4
// 5-6
// 6-8
// 7-？
// 218 9500 0000

// tsx ./math/problems/daily-exercse/2025-07-18抓狐狸/catch-fox.ts
