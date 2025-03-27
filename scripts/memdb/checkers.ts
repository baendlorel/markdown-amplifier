import { DefaultGetter, FieldDefinition, FieldType, FILED_TYPE } from './types';
import { recreateFunction } from './utils';

export const assertValidTableName = (tableName: string) => {
  const match = tableName.match(/^[a-zA-Z][\w]{0,}$/);
  if (match === null) {
    throw new Error(
      `[SylphDB] Invalid table name detected: ${tableName}, must contain only a-z, A-Z, 0-9, _ and start with a letter`
    );
  }
};

/**
 * 此函数的作用其实是确保defaultGetter返回值符合支持的字段类型且不报错 \
 * 但是，如果函数每次返回值不确定，且存在不符合条件的值，此函数是无法校验的 \
 * The purpose of this function is actually to ensure that the return value of defaultGetter meets the supported field types and does not throw an error
 * However, if the return value varies, and some of them do not meet the supported types, this checker may not be able to detect it
 * @param fn
 */
export const assertValidDefaultGetter = (fn: Function) => {
  const s = fn.toString();
  const r = recreateFunction(s);
  const result = (() => {
    try {
      return r();
    } catch (error) {
      // 如果函数内部有try-catch块消灭了异常也无妨，只要返回值符合支持的字段类型即可
      // It's okay if the try-catch block inside the function eliminates the exception
      // As long as the return value meets the supported field types
      if (error instanceof ReferenceError) {
        throw new Error(
          "[SylphDB] This function uses outer variables or functions, cannot be used as 'defaultGetter'"
        );
      } else {
        // 应该不会有其他情形了
        // There should be no other cases
        throw error;
      }
    }
  })();

  if (result === null) {
    return;
  }

  switch (typeof result) {
    case 'string':
    case 'number':
    case 'boolean':
      return;
    case 'object':
      if (result instanceof Date) {
        return;
      }
    default:
      throw new Error(
        '[SylphDB] Invalid default value getter, must return string, number, boolean or Date'
      );
  }
};

/**
 * 确保字段配置数组有效 \
 * Ensure that the field configuration array is valid
 * @param fieldOptions 待检测配置
 */
export const assureFieldOptionArray = (fieldOptions: FieldDefinition[]) => {
  const fields = [] as string[];
  const types = [] as FieldType[];
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
      throw new Error(`[SylphDB] Non-string item detected, fields: ${o}(${typeof o})`);
    }
    if (!o.name.match(/^[a-zA-Z][\w]{0,}$/)) {
      throw new Error(
        `[SylphDB] Invalid field name detected: ${o.name}, must contain only a-z, A-Z, 0-9, _ and start with a letter`
      );
    }

    // 确保字段类型合法
    if (!FILED_TYPE.includes(o.type)) {
      const v = `${o.type}(${typeof o.type})`;
      const fieldTypes = FILED_TYPE.join(`', '`);
      throw new Error(`[SylphDB] Invalid type '${v}', must be '${fieldTypes}'`);
    }

    // # 逐个检测可选配置项
    const _isNullable = o.isNullable ?? true;
    if (typeof _isNullable !== 'boolean') {
      throw new Error(
        `[SylphDB] Invalid option: ${o.name}${_isNullable}(${typeof _isNullable})`
      );
    }

    if ('default' in o) {
      const _getter = o.default;
      const _defaultValue = (() => {
        if (typeof _getter === 'function') {
          assertValidDefaultGetter(_getter);
          return _getter();
        } else {
          return _getter;
        }
      })();

      if (
        typeof _defaultValue === o.type ||
        _defaultValue instanceof Date ||
        (_isNullable && _defaultValue === null)
      ) {
        // 至此默认值已经限定为string、boolean、number、Date，在可为空时允许为null，不可能是undefined
        // '_defaultValue' has been restricted to string, boolean, number, Date
        // And it can be null when nullable, so it must not be undefined
        defaults[i] = _getter as DefaultGetter;
      } else {
        throw new Error(
          `[SylphDB] Invalid default value getter, index:${i}, type:${o.type}, default:${_getter}`
        );
      }
    }

    const _isIndex = o.isIndex ?? false;
    if (typeof _isIndex !== 'boolean') {
      throw new Error(
        `[SylphDB] Invalid 'isIndex': ${o.name}${_isIndex}(${typeof _isIndex})`
      );
    }

    const _isUnique = o.isUnique ?? false;
    if (typeof _isUnique !== 'boolean') {
      throw new Error(
        `[SylphDB] Invalid 'isUnique': ${o.name}${_isUnique}(${typeof _isUnique})`
      );
    }

    const _isPK = o.isPrimaryKey ?? false;
    if (typeof _isPK !== 'boolean') {
      throw new Error(
        `[SylphDB] Invalid 'isPrimaryKey': ${o.name}${_isPK}(${typeof _isPK})`
      );
    }
    if (_isPK && pk !== undefined) {
      throw new Error(
        `[SylphDB] Duplicate primary key detected, current field: ${o.name}`
      );
    }

    const _isAI = o.isAutoIncrement ?? false;
    if (typeof _isAI !== 'boolean') {
      throw new Error(
        `[SylphDB] Invalid 'isAutoIncrement': ${o.name}${_isAI}(${typeof _isAI})`
      );
    }
    if (_isAI && !_isPK) {
      throw new Error(
        `[SylphDB] Only primary key can be set as auto-increment, current field: ${o.name}`
      );
    }

    // 一些互斥判定
    // 不能同时为索引和唯一索引
    if (_isIndex && _isUnique) {
      throw new Error(
        `[SylphDB] A field cannot be both unique and index, current field: ${o.name}`
      );
    }
    // 主键不能是索引和唯一索引，因为它已经有索引了
    if (_isPK && (_isIndex || _isUnique)) {
      throw new Error(
        `[SylphDB] A primary key cannot be unique or index, current field: ${o.name}`
      );
    }
    // 自增的话type必须为数字
    if (_isAI && o.type !== 'number') {
      throw new Error(
        `[SylphDB] Auto-increment field must be number type, current field: ${o.name}`
      );
    }

    // 赋值部分
    fields[i] = o.name;
    types[i] = o.type;
    nullables[i] = _isNullable;
    _isAI && (isAI = true);
    _isPK && (pk = i);
    _isIndex && indexes.push(o.name);
    _isUnique && uniques.push(o.name);
  }

  // 确保主键不为空
  if (pk === undefined) {
    throw new Error('[SylphDB] Primary key is required');
  }

  assertNoDuplicateFields(fields);
  assertNoDuplicateIndexes(indexes, uniques);
  return { fields, types, defaults, nullables, indexes, uniques, pk, isAI };
};

export const assertSameDefaultGetter = (d1: DefaultGetter, d2: DefaultGetter) => {
  if (typeof d1 !== typeof d2) {
    throw new Error(
      `[MemDB assertSameDefaultGetter] Types of defaultGetters are different. 'd1': ${typeof d1}, 'd2': ${typeof d2}`
    );
  }

  switch (typeof d1) {
    case 'string':
    case 'number':
    case 'boolean':
      if (d1 !== d2) {
        throw new Error(
          `[MemDB assertSameDefaultGetter] defaultGetters mismatch,'d1': ${d1}, 'd2': ${d2}`
        );
      }
      break;
    case 'object':
      if (d1 instanceof Date && d2 instanceof Date) {
        if (d1.getTime() !== d2.getTime()) {
          throw new Error(
            `[MemDB assertSameDefaultGetter] defaultGetters mismatch,'d1': ${d1}, 'd2': ${d2}`
          );
        }
      } else {
        throw new Error(
          `[MemDB assertSameDefaultGetter] defaultGetters cannot have non-Date object,'d1': ${d1}, 'd2': ${d2}`
        );
      }
    case 'function':
      // d2类型和d1相同，这里肯定是一样的，但是ts不认识，手动标记
      // 'd2' has the same type as 'd1', so they must both be functions
      const _d2 = (d2 as Function).toString().replace(/^[\s]{0,}function\s+/, '');
      const _d1 = d1.toString().replace(/^[\s]{0,}function\s+/, '');
      if (_d1 !== _d2) {
        throw new Error(
          `[MemDB assertSameDefaultGetter] defaultGetters mismatch, d1:${_d1}, d2:${_d2}`
        );
      }

    default:
      break;
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
      "[SylphDB] Duplicate fields detected in 'fields' for: " + fields.join()
    );
  }
};

export const assertNoDuplicateIndexes = (indexes: string[], uniques: string[]) => {
  const indexesSet = new Set(indexes);
  const uniqueSet = new Set(uniques);
  const wholeSet = new Set([...indexesSet, ...uniqueSet]);
  if (indexesSet.size !== indexes.length) {
    throw new Error(
      "[SylphDB] Duplicate index detected in 'indexes' for: " + indexes.join()
    );
  }

  if (uniqueSet.size !== uniques.length) {
    throw new Error(
      "[SylphDB] Duplicate unique index detected in 'uniques' for: " + uniques.join()
    );
  }

  if (wholeSet.size !== indexes.length + uniques.length) {
    throw new Error(
      "[SylphDB] 'indexes' and 'uniques' share some same fields, for: " +
        [...indexesSet].filter((i) => uniqueSet.has(i)).join()
    );
  }
};
