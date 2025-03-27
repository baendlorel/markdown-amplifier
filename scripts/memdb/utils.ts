export const base64 =
  typeof Buffer !== 'undefined'
    ? {
        encode: (input: string) => Buffer.from(input, 'utf-8').toString('base64'),
        decode: (base64: string) => Buffer.from(base64, 'base64').toString('utf-8'),
      }
    : {
        encode: (input: string) => btoa(encodeURIComponent(input)),
        decode: (base64: string) => decodeURIComponent(atob(base64)),
      };

/**
 * 从toString后的函数字符串重建函数 \
 * Rebuild the function from the string after toString
 * @param funcStr
 * @returns
 */
export const recreateFunction = (funcStr: string): Function => {
  funcStr = funcStr.trim();
  // 一般函数都这么开头
  // General functions start like this
  if (funcStr.startsWith('(') || funcStr.startsWith('function')) {
    return new Function('return ' + funcStr)();
  }

  // class的静态方法和class实例的方法，需要手动添加function开头
  // The static methods of a class and the instance methods of a class need to be manually prefixed with the function keyword
  if (funcStr.replace(/^\w+/g, '').startsWith('(')) {
    return new Function('return function ' + funcStr)();
  }

  // 目前没有发现函数toString的其他情形，大概率构造不出来
  console.error(
    `[MemDB recreateFunction] Might be an invalid function string: ${funcStr}`
  );
  return new Function('return function ' + funcStr)();
};

/**
 * 对比一个无重复的数组是否由另一个数组重排列得到 \
 * Compare an array without duplicates to see if it is permutated from another array
 * @param arr1
 * @param arr2
 * @param equals
 */
export const isPermutated = (
  arr1: any[],
  arr2: any[],
  equals?: (a: any, b: any) => boolean
) => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  if (arr1.length === 0) {
    return true;
  }
  equals = equals ?? ((a, b) => a === b);
  const length = arr1.length;
  if (length === 1) {
    return equals(arr1[0], arr2[0]);
  }

  // 确保没有重复项
  // Assure no duplicate elements
  for (let i = 0; i < length; i++) {
    for (let j = i; j < length; j++) {
      if (equals(arr1[i], arr1[j])) {
        throw new Error(
          `[MemDB isPermutated] Duplicate elements of 'arr1' found! [${i}] === [${j}]`
        );
      }
      if (equals(arr2[i], arr2[j])) {
        throw new Error(
          `[MemDB isPermutated] Duplicate elements of 'arr2' found! [${i}] === [${j}]`
        );
      }
    }
  }

  for (let i = 0; i < length; i++) {
    let index = -1;
    for (let j = 0; j < length; j++) {
      if (equals(arr1[i], arr2[j])) {
        index = j;
        break;
      }
    }
    if (index === -1) {
      return false;
    }
  }

  return true;
};

/**
 * 创造某个类型的Error对象生成器，旨在格式化报错 \
 * Create an Error object generator for a certain category, aimed at formatting error messages
 * @param category
 * @returns Error message creator
 */
const createErrorMessageCreator =
  (category: string = '') =>
  (message: string, functionName: string = '') => {
    let head = '';
    if (category && functionName) {
      head = `[SylphDB ${category}.${functionName}]`;
    } else if (!category && functionName) {
      head = `[SylphDB function:${functionName}]`;
    } else if (!category && !functionName) {
      head = '[SylphDB]';
    } else if (category && !functionName) {
      head = `[SylphDB ${category}]`;
    }
    return new Error(`${head} ${message}`);
  };

const createLoggerCreator =
  (category: string = '') =>
  (message: string, functionName: string = '') => {
    let head = '';
    if (category && functionName) {
      head = `[SylphDB ${category}.${functionName}]`;
    } else if (!category && functionName) {
      head = `[SylphDB function:${functionName}]`;
    } else if (!category && !functionName) {
      head = '[SylphDB]';
    } else if (category && !functionName) {
      head = `[SylphDB ${category}]`;
    }
    console.log(`${head} ${message}`);
  };

export const createDiagnostics = (category: string = '') => ({
  err: createErrorMessageCreator(category),
  log: createLoggerCreator(category),
});
