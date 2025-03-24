import { FieldType, FILED_TYPE } from './types';

/**
 * 保证数组一定是一定长度的Array，让后续可以使用Array上的方法 \
 * Ensure that the 'a' is an Array Instance with given length, so that methods of Array.prototype can be used
 * @param arr 待检测数组
 * @param variableName 变量名
 * @param length [可选]数组长度
 * @returns 转换为Array实例的arr
 */
export const assertArrayAndLengthThenCopyToArrayInstance = (
  arr: any,
  variableName: string,
  length?: number
) => {
  if (!Array.isArray(arr)) {
    throw new Error(`[MemDB] Expected '${variableName}' to be an array, but got: ` + arr);
  }
  arr = Array.from(arr);
  if (length !== undefined && length !== arr.length) {
    throw new Error(
      `[MemDB] The length of '${variableName}'(${arr.length}) should be equal to ${length}`
    );
  }
  return arr;
};

// # 以下涉及的数组已经由上面的函数确保为Array的实例，其上的方法均可无压力使用
// # The following arrays have been ensured to be instances of Array by the above function, and methods on them can be used without any pressure

/**
 * 确保数组是字符串数组，字段名只能是大小写、数字、下划线，必须字母开头 \
 * Ensure that the fields array is a string array, and the field name can only contain letters, numbers or underscores, and must start with a letter
 * @param fields 待检测数组
 */
export const assertValidFieldArray = (fields: string[]) => {
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (typeof f !== 'string') {
      throw new Error(`[MemDB] Non-string item detected, fields: ${f}(${typeof f})`);
    }
    if (!f.match(/^[a-zA-Z][\w]{0,}$/)) {
      throw new Error(
        `[MemDB] Invalid field name detected: ${f}, must contain only a-z, A-Z, 0-9, _ and start with a letter`
      );
    }
  }
};

/**
 * 确保IsNullable数组是可用的 \
 * Ensure that the IsNullable array is valid
 * @param isNullable
 */
export const assertValidIsNullableArray = (isNullable: boolean[]) => {
  for (let i = 0; i < isNullable.length; i++) {
    const v = isNullable[i];
    if (typeof v !== 'boolean') {
      throw new Error(`[MemDB] Invalid isNullable detected: ${v}(${typeof v})`);
    }
  }
};

/**
 * 保证字段类型数组记录了有效的类型 \
 * Ensure that the fieldTypes array records valid type
 * @param fieldTypes
 */
export const assertValidFieldTypeArray = (fieldTypes: any[]) => {
  for (let i = 0; i < fieldTypes.length; i++) {
    const f = fieldTypes[i];
    if (!FILED_TYPE.includes(f)) {
      throw new Error(
        `[MemDB] Invalid type '${f}(${typeof f})', must be '${FILED_TYPE.join(`', '`)}'`
      );
    }
  }
};

/**
 * 保证默认值数组记录的默认值是有效的 \
 * fieldTypes的有效性由上面的函数保证 \
 * Ensure that the defaultValue array records valid default values \
 * The validity of fieldTypes is guaranteed by the above function 'assertValidFieldTypeArray'
 * @param defaults
 * @param fieldTypes
 */
export const assertValidDefaultsArray = (
  defaults: any[],
  fieldTypes: FieldType[],
  isNullable: boolean[]
) => {
  for (let i = 0; i < defaults.length; i++) {
    const d = defaults[i];
    // 如果这一格的默认值是空槽，那么免检
    // If the default value of this slot is empty, skip the check
    if (!(i in defaults)) {
      continue;
    }

    const value = typeof d === 'function' ? d() : d;
    // string、boolean、number、Date的情形，允许为空的情况下可以是null
    // The cases of string, boolean, number and Date, if the field is nullable then allow 'null'
    if (
      typeof value === fieldTypes[i] ||
      value instanceof Date ||
      (isNullable[i] && value === null)
    ) {
      continue;
    }

    throw new Error(`[MemDB] Invalid default value, index:${i}, default:${d}`);
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
