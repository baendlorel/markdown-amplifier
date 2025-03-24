/**
 * 保证数组一定是Array，让后续可以使用Array上的方法 \
 * Ensure that the 'a' is an Array Instance, so that methods of Array.prototype can be used
 * @param a 待检测数组
 * @param variableName 变量名
 * @returns 把a转换为Array实例的结果
 */
export const assertArrayAndCopyToArrayInstance = (a: any, variableName: string) => {
  if (!Array.isArray(a)) {
    throw new Error(`[MemDB] Expected '${variableName}' to be an array, but got: ` + a);
  }
  return Array.from(a);
};

// # 以下涉及的数组已经由上面的函数确保为Array的实例，其上的方法均可无压力使用
// # The following arrays have been ensured to be instances of Array by the above function, and methods on them can be used without any pressure

/**
 * 确保数组是字符串数组，字段名只能是大小写、数字、下划线，必须字母开头 \
 * Ensure that the fields array is a string array
 * @param fields 待检测数组
 */
export const assertToBeAStringArray = (fields: string[]) => {
  if (fields.some((item) => typeof item !== 'string')) {
    throw new Error(
      '[MemDB] Non-string item detected, fields:' +
        fields.map((f) => `${f}(${typeof fields})`).join()
    );
  }
};

/**
 * 确保字段名没有重复的 \
 * Ensure that there are no duplicate field names
 * @param fields
 */
export const assertNoDuplicateFields = (fields: string[]) => {
  const set = new Set(fields);
  if (set.size !== fields.length) {
    throw new Error(
      "[MemDB] Duplicate fields detected in 'fields' for: " + fields.join()
    );
  }
};

export const assertNoDuplicatedIndexes = (indexes: string[], uniques: string[]) => {
  const indexesSet = new Set(indexes);
  const uniqueSet = new Set(uniques);
  const wholeSet = new Set([...indexesSet, ...uniqueSet]);
  if (indexesSet.size !== indexes.length) {
    throw new Error(
      "[MemDB] Duplicate index detected in 'indexes' for: " + indexes.join()
    );
  }

  if (uniqueSet.size !== uniques.length) {
    throw new Error(
      "[MemDB] Duplicate unique index detected in 'uniques' for: " + uniques.join()
    );
  }

  if (wholeSet.size !== indexes.length + uniques.length) {
    throw new Error(
      "[MemDB] 'indexes' and 'uniques' share some same fields, for: " +
        [...indexesSet].filter((i) => uniqueSet.has(i)).join()
    );
  }
};
