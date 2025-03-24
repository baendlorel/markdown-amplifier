import { DefaultGetter, FieldOption, FieldType, FILED_TYPE } from './types';

export const assertValidTableName = (tableName: string) => {
  const match = tableName.match(/^[a-zA-Z][\w]{0,}$/);
  if (match === null) {
    throw new Error(
      `[MemDB] Invalid table name detected: ${tableName}, must contain only a-z, A-Z, 0-9, _ and start with a letter`
    );
  }
};

/**
 * 保证数组一定是一定长度的Array，让后续可以使用Array上的方法 \
 * Ensure that the 'a' is an Array Instance with given length, so that methods of Array.prototype can be used
 * @param arr 待检测数组
 * @param variableName 变量名
 * @param length [可选]数组长度
 * @returns 转换为Array实例的arr
 */
export const assertValidFieldArrayThenCopyToArrayInstance = (arr: any) => {
  if (!Array.isArray(arr)) {
    throw new Error(`[MemDB] Expected 'fields' to be an array, but got: ` + arr);
  }
  return Array.from(arr);
};

// # 以下涉及的数组已经由上面的函数确保为Array的实例，其上的方法均可无压力使用
// # The following arrays have been ensured to be instances of Array by the above function, and methods on them can be used without any pressure

/**
 * 确保数组是字符串数组，字段名只能是大小写、数字、下划线，必须字母开头 \
 * Ensure that the fields array is a string array, and the field name can only contain letters, numbers or underscores, and must start with a letter
 * @param fields 待检测数组
 */
export const assertValidFieldArray = (fields: FieldOption[]) => {
  const defaults = [] as DefaultGetter[];
  const nullables = [] as boolean[];
  const indexes = [] as string[];
  const uniques = [] as string[];

  for (let i = 0; i < fields.length; i++) {
    const o = fields[i];

    // 确保字段名称合法
    // Ensure that the field name is valid
    if (typeof o.name !== 'string') {
      throw new Error(`[MemDB] Non-string item detected, fields: ${o}(${typeof o})`);
    }
    if (!o.name.match(/^[a-zA-Z][\w]{0,}$/)) {
      throw new Error(
        `[MemDB] Invalid field name detected: ${o.name}, must contain only a-z, A-Z, 0-9, _ and start with a letter`
      );
    }

    // 确保字段类型合法
    if (!FILED_TYPE.includes(o.type)) {
      throw new Error(
        `[MemDB] Invalid type '${o.type}(${typeof o.type})', must be '${FILED_TYPE.join(
          `', '`
        )}'`
      );
    }

    // # 逐个检测可选配置项
    const isNullable = o.isNullable ?? true;
    if (typeof isNullable !== 'boolean') {
      throw new Error(
        `[MemDB] Invalid option: ${o.name}${isNullable}(${typeof isNullable})`
      );
    }
    nullables[i] = isNullable;

    if ('default' in o) {
      const d = o.default;
      const dv = typeof d === 'function' ? d() : d;
      // string、boolean、number、Date的情形，允许为空的情况下可以是null
      // The cases of string, boolean, number and Date, if the field is nullable then allow 'null'
      if (
        typeof dv === o.type ||
        (dv as any) instanceof Date ||
        (isNullable && dv === null)
      ) {
        defaults[i] = d;
      } else {
        throw new Error(`[MemDB] Invalid default value getter, index:${i} default:${d}`);
      }
    }

    const isIndex = o.isIndex ?? false;
    if (typeof isIndex !== 'boolean') {
      throw new Error(
        `[MemDB] Invalid 'isIndex': ${o.name}${isIndex}(${typeof isIndex})`
      );
    }

    const isUnique = o.isUnique ?? false;
    if (typeof isUnique !== 'boolean') {
      throw new Error(
        `[MemDB] Invalid 'isUnique': ${o.name}${isUnique}(${typeof isUnique})`
      );
    }

    const isPK = o.isPrimaryKey ?? false;
    if (typeof isPK !== 'boolean') {
      throw new Error(`[MemDB] Invalid 'isPrimaryKey': ${o.name}${isPK}(${typeof isPK})`);
    }
  }

  return { defaults, nullables, indexes, uniques };
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
