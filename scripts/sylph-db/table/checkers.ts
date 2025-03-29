import { Table } from './types';
import { diagnostics, recreateFn } from '../utils';

const { err, log } = diagnostics('ensure');

export const ensure = {
  validTableName(tableName: string) {
    const match = tableName.match(/^[a-zA-Z][\w]{0,}$/);
    if (match === null) {
      throw err(
        `Invalid table name detected: ${tableName}, must contain only a-z, A-Z, 0-9 and start with a letter `,
        'validTableName'
      );
    }
  },

  /**
   * 此函数的作用其实是确保defaultGetter返回值符合支持的字段类型且不报错 \
   * 但是，如果函数每次返回值不确定，且存在不符合条件的值，此函数是无法校验的 \
   * The purpose of this function is actually to ensure that the return value of defaultGetter meets the supported field types and does not throw an error
   * However, if the return value varies, and some of them do not meet the supported types, this checker may not be able to detect it
   * @param fn
   */
  validDefaultGetter(fn: Function) {
    const e = (msg: string) => err(msg, 'validDefaultGetter');
    const s = fn.toString();
    const r = recreateFn(s);
    const result = (() => {
      try {
        return r();
      } catch (error) {
        // 如果函数内部有try-catch块消灭了异常也无妨，只要返回值符合支持的字段类型即可
        // It's okay if the try-catch block inside the function eliminates the exception
        // As long as the return value meets the supported field types
        if (error instanceof ReferenceError) {
          throw e('Given getter uses outer variables or functions');
        } else {
          // 应该不会有其他情形了
          // There should be no other cases
          throw error;
        }
      }
    })();

    if (ensure.isValue(result)) {
      return;
    }

    throw e(`Invalid getter, must return string, number, boolean or Date`);
  },

  /**
   * 确保字段配置数组有效 \
   * Ensure that the field configuration array is valid
   * @param fieldOptions 待检测配置
   */
  normalizeFieldOptions(fieldOptions: Table.FieldDefinition[]) {
    const e = (msg: string) => err(msg, 'normalizeFieldOptions');

    const fields = [] as string[];
    const types = [] as Table.FieldType[];
    const defaults = [] as Table.DefaultGetter[];
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
        throw e(`Non-string item detected, fields: ${o}(${typeof o})`);
      }
      if (!o.name.match(/^[a-zA-Z][\w]{0,}$/)) {
        throw e(
          `Invalid field name detected: ${o.name}, must contain only a-z, A-Z, 0-9 and start with a letter`
        );
      }

      // 确保字段类型合法
      if (!Table.FILED_TYPE.includes(o.type)) {
        const v = `${o.type}(${typeof o.type})`;
        const fieldTypes = Table.FILED_TYPE.join(`', '`);
        throw e(`Invalid type '${v}', must be '${fieldTypes}'`);
      }

      // # 逐个检测可选配置项
      const _isNullable = o.isNullable ?? true;
      if (typeof _isNullable !== 'boolean') {
        const opt = `${o.name}${_isNullable}(${typeof _isNullable})`;
        throw e(`Invalid option: ${opt}`);
      }

      if ('default' in o) {
        const _getter = o.default;
        const _dv = (() => {
          if (typeof _getter === 'function') {
            ensure.validDefaultGetter(_getter);
            return _getter();
          } else {
            return _getter;
          }
        })();

        if (!_isNullable && _dv === null) {
          throw e(`Default value cannot be null when 'isNullable' is false`);
        }

        // 只在type相同，或为Date时再保存defaultGetter
        // Only save defaultGetter when the type is the same or it is Date
        if (typeof _dv === o.type || (o.type === 'Date' && _dv instanceof Date)) {
          // 至此默认值已经限定为string、boolean、number、Date，在可为空时允许为null，不可能是undefined
          // '_defaultValue' has been restricted to string, boolean, number, Date
          // And it can be null when nullable, so it must not be undefined
          defaults[i] = _getter as Table.DefaultGetter;
        } else {
          throw e(`Invalid defaultGetter, i:${i}, type:${o.type}, getter:${_getter}`);
        }
      }

      const _isIndex = o.isIndex ?? false;
      if (typeof _isIndex !== 'boolean') {
        const idx = `${o.name}[${_isIndex}](${typeof _isIndex})`;
        throw e(`Invalid 'isIndex': ${idx}`);
      }

      const _isUnique = o.isUnique ?? false;
      if (typeof _isUnique !== 'boolean') {
        const u = `${o.name}[${_isUnique}](${typeof _isUnique})`;
        throw e(`Invalid 'isUnique': ${u}`);
      }

      const _isPK = o.isPrimaryKey ?? false;
      if (typeof _isPK !== 'boolean') {
        const p = `${o.name}[${_isPK}](${typeof _isPK})`;
        throw e(`Invalid 'isPrimaryKey': ${p}`);
      }
      if (_isPK && pk !== undefined) {
        throw e(`Duplicate primary key, current field: ${o.name}`);
      }

      const _isAI = o.isAutoIncrement ?? false;
      if (typeof _isAI !== 'boolean') {
        const a = `${o.name}[${_isAI}](${typeof _isAI})`;
        throw e(`Invalid 'isAutoIncrement': ${a}`);
      }
      if (_isAI && !_isPK) {
        throw e(`Only primary key can be auto-increment, current field: ${o.name}`);
      }

      // 一些互斥判定
      // 不能同时为索引和唯一索引
      if (_isIndex && _isUnique) {
        throw e(`A field cannot be both unique and index, current field: ${o.name}`);
      }
      // 主键不能是索引和唯一索引，因为它已经有索引了
      if (_isPK && (_isIndex || _isUnique)) {
        throw e(`A primary key cannot be unique or index, current field: ${o.name}`);
      }
      // 自增的话type必须为数字
      if (_isAI && o.type !== 'number') {
        throw e(`Auto-increment field must be number type, current field: ${o.name}`);
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
      throw e('Primary key is required');
    }

    ensure.noDuplicateFields(fields);
    ensure.noDuplicateIndexes(indexes, uniques);
    return { fields, types, defaults, nullables, indexes, uniques, pk, isAI };
  },

  /**
   * 对比两个defaultGetter，在它俩不同的任何情况下都报错 \
   * Compare two defaultGetters, and throw an error in any case where they are different
   * @param d1
   * @param d2
   */
  sameDefaultGetter(d1: Table.DefaultGetter, d2: Table.DefaultGetter) {
    const e = (msg: string) => err(msg, 'sameDefaultGetter');
    const d = `'d1'-${String(d1)}(${typeof d1}), 'd2'-${String(d2)}(${typeof d2})`;

    if (typeof d1 !== typeof d2) {
      throw e(`defaultGetters' type mismatch: ${d}`);
    }

    // string、number、boolean、null可以直接对比，Date可以getTime后对比
    switch (typeof d1) {
      case 'string':
      case 'number':
      case 'boolean':
        if (d1 !== d2) {
          throw e(`defaultGetters mismatch: ${d}`);
        }
        break;
      case 'object':
        if (d1 === null && d2 === null) {
          break;
        } else if (d1 instanceof Date && d2 instanceof Date) {
          if (d1.getTime() !== d2.getTime()) {
            throw e(`defaultGetters mismatch: ${d}`);
          }
        } else {
          throw e(`defaultGetters cannot have non-Date object: ${d}`);
        }
        break;
      case 'function':
        // d2类型和d1相同，这里肯定是一样的，但是ts不认识，手动断言
        // 'd2' has the same type as 'd1', so they must both be functions
        const _d2 = (d2 as Function).toString().replace(/^[\s]{0,}function\s+/, '');
        const _d1 = d1.toString().replace(/^[\s]{0,}function\s+/, '');
        if (_d1 !== _d2) {
          throw e(`defaultGetters mismatch, d1:${_d1}, d2:${_d2}`);
        }
      default:
        log(`defaultGetters' type not supported: ${d}`, 'sameDefaultGetter');
        break;
    }
  },

  /**
   * 确保字段名没有重复的 \
   * Ensure that there are no duplicate field names
   * @param fields
   */
  noDuplicateFields(fields: string[]) {
    const set = new Set(fields);
    if (set.size !== fields.length) {
      throw err(
        "Duplicate fields detected in 'fields' for: " + fields.join(),
        'noDuplicateFields'
      );
    }
  },

  noDuplicateIndexes(indexes: string[], uniques: string[]) {
    const e = (msg: string) => err(msg, 'noDuplicateIndexes');

    const indexesSet = new Set(indexes);
    const uniqueSet = new Set(uniques);
    const wholeSet = new Set([...indexesSet, ...uniqueSet]);
    if (indexesSet.size !== indexes.length) {
      throw e("Duplicate index detected in 'indexes' for: " + indexes.join());
    }

    if (uniqueSet.size !== uniques.length) {
      throw e("Duplicate unique index detected in 'uniques' for: " + uniques.join());
    }

    if (wholeSet.size !== indexes.length + uniques.length) {
      const s = [...indexesSet].filter((i) => uniqueSet.has(i)).join();
      throw e(`'indexes' and 'uniques' share some same fields, for: ${s}`);
    }
  },

  comparable(a: Table.Value): a is Date | number {
    if (typeof a === 'number' || a instanceof Date) {
      return true;
    }
    throw err(
      `Value is not comparable: ${a}(${typeof a}). Consider 'number' and 'Date' as comparable types.`,
      'comparable'
    );
  },

  validInterval(a: Table.Value, b: Table.Value) {
    if (!ensure.comparable(a) || !ensure.comparable(b)) {
      return;
    }

    if (typeof a !== typeof b) {
      throw err(
        `Two types are different, cannot form an interval: ${a}(${typeof a}), ${b}(${typeof b})`,
        'validInterval'
      );
    }

    if (a > b) {
      throw err(
        `Left is greater than right: ${a}(${typeof a}), ${b}(${typeof b})`,
        'validInterval'
      );
    }
  },

  /**
   * 检测是否是支持的值类型 \
   * Check if it is a supported field type
   * @param value
   */
  isValue(value: Table.Value) {
    switch (typeof value) {
      case 'string':
      case 'number':
      case 'boolean':
        return true;
      case 'object':
        if (value === null || value instanceof Date) {
          return true;
        }
      default:
        return false;
    }
  },

  isString(a: Table.Value) {
    if (typeof a !== 'string') {
      throw err(`Value is not string: ${a}(${typeof a})`, 'isString');
    }
  },

  /**
   * 确保值是数组，并返回副本 \
   * Ensure that the value is an array and return a copy
   * @param a 待检测值
   * @param options [可选] 进一步精确的选项
   */
  isArray(
    a: Table.Value[],
    options?: { length?: number; notEmpty?: boolean; sameType?: boolean }
  ) {
    if (!Array.isArray(a)) {
      throw err(`Value is not array: ${a}(${typeof a})`, 'isArray');
    }

    const aa = Array.from(a);

    const { length, notEmpty, sameType } = options ?? {};

    if (length !== undefined && aa.length !== length) {
      throw err(`Array length mismatch: ${a.length} != ${length}`, 'isArray');
    }

    if (notEmpty && aa.length === 0) {
      throw err(`Array is not expected to be empty`, 'isArray');
    }

    if (sameType) {
      const types = new Set(aa.map((i) => typeof i));
      // 也可能空数组，为0
      if (types.size > 1) {
        throw err(`Array contains different types: ${types}`, 'isArray');
      }
    }

    return aa;
  },
};
