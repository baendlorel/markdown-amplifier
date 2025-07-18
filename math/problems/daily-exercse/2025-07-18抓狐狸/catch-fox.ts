const check = (n: number, pattern: number[]) => {
  if (!Number.isSafeInteger(n) || n < 1) {
    throw new Error('n must be a positive integer');
  }

  const maxJumpCount = pattern.length;
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

    if (i === 1) {
      jump(2);
    } else if (i === n) {
      jump(n - 1);
    } else {
      jump(i + 1);
      jump(i - 1);
    }
    path.pop();
  };

  for (let i = 1; i <= n; i++) {
    jump(i);
  }

  const match = (pattern: number[]) => {
    const mismatch: number[][] = [];
    paths.forEach((path) => {
      for (let i = 0; i < path.length; i++) {
        if (path[i] === pattern[i]) {
          return true;
        }
      }
      mismatch.push([...path]);
    });
    return mismatch;
  };

  const mismatch = match(pattern);
  if (mismatch.length > 0) {
    console.log(`${n}->${pattern}. Mismatch found:`);
    mismatch.forEach((m) => console.log(m.join(' ')));
  } else {
    console.log(`${n}->${pattern}. All paths match the pattern.`);
  }
};

check(2, [2, 2]);
check(3, [2, 2]);
check(4, [2, 2, 3, 3, 2]);
check(5, [2, 2, 3, 3, 2, 2, 3, 3, 4]);
check(5, [2, 2, 3, 3, 4, 4, 4, 3, 2]);
