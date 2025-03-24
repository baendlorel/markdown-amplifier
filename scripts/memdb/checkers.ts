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
 * 确保字段配置数组有效 \
 * Ensure that the field configuration array is valid
 * @param fieldOptions 待检测配置
 */
export const assertValidFieldOptionArray = (fieldOptions: FieldOption[]) => {
  const fields = [] as string[];
  const types = [] as string[];
  const defaults = [] as DefaultGetter[];
  const nullables = [] as boolean[];
  const indexes = [] as string[];
  const uniques = [] as string[];
  let pk = undefined as undefined | number;
  let isAI = false;

  // 保证有空槽比较好
  // It's better to have empty slots
  defaults.length = fieldOptions.length;

  for (let i = 0; i < fieldOptions.length; i++) {
    const o = fieldOptions[i];

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
    const _isNullable = o.isNullable ?? true;
    if (typeof _isNullable !== 'boolean') {
      throw new Error(
        `[MemDB] Invalid option: ${o.name}${_isNullable}(${typeof _isNullable})`
      );
    }

    if ('default' in o) {
      const _default = o.default;
      const _value = typeof _default === 'function' ? _default() : _default;
      // string、boolean、number、Date的情形，允许为空的情况下可以是null
      // The cases of string, boolean, number and Date, if the field is nullable then allow 'null'
      if (
        typeof _value === o.type ||
        (_value as any) instanceof Date ||
        (_isNullable && _value === null)
      ) {
        defaults[i] = _default;
      } else {
        throw new Error(
          `[MemDB] Invalid default value getter, index:${i} default:${_default}`
        );
      }
    }

    const _isIndex = o.isIndex ?? false;
    if (typeof _isIndex !== 'boolean') {
      throw new Error(
        `[MemDB] Invalid 'isIndex': ${o.name}${_isIndex}(${typeof _isIndex})`
      );
    }

    const _isUnique = o.isUnique ?? false;
    if (typeof _isUnique !== 'boolean') {
      throw new Error(
        `[MemDB] Invalid 'isUnique': ${o.name}${_isUnique}(${typeof _isUnique})`
      );
    }

    const _isPK = o.isPrimaryKey ?? false;
    if (typeof _isPK !== 'boolean') {
      throw new Error(
        `[MemDB] Invalid 'isPrimaryKey': ${o.name}${_isPK}(${typeof _isPK})`
      );
    }
    if (_isPK) {
      if (pk !== undefined) {
        throw new Error(
          `[MemDB] Duplicate primary key detected, current field: ${o.name}`
        );
      }
      pk = i;
    }

    const _isAI = o.isAutoIncrement ?? false;
    if (typeof _isAI !== 'boolean') {
      throw new Error(
        `[MemDB] Invalid 'isAutoIncrement': ${o.name}${_isAI}(${typeof _isAI})`
      );
    }
    if (_isAI && !_isPK) {
      throw new Error(
        `[MemDB] Only primary key can be set as auto-increment, current field: ${o.name}`
      );
    }
    if (_isAI) {
      isAI = true;
    }

    fields[i] = o.name;
    types[i] = o.type;
    nullables[i] = _isNullable;
    _isIndex && indexes.push(o.name);
    _isUnique && uniques.push(o.name);
  }

  // 确保主键不为空
  if (pk === undefined) {
    throw new Error('[MemDB] Primary key is required');
  }

  assertNoDuplicateFields(fields);

  assertNoDuplicateIndexes(indexes, uniques);

  return { fields, types, defaults, nullables, indexes, uniques, pk, isAI };
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

export const assertNoDuplicateIndexes = (indexes: string[], uniques: string[]) => {
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
