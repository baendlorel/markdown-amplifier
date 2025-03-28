import { createDiagnostics } from '../utils';
import { Table } from './types';

const { err } = createDiagnostics('<Table.private>');

/**
 * 初始化索引映射 \
 * 把索引字段转换为索引字段在fields中的位置 \
 * Initialize index mapping \
 * Convert index fields to their positions in fields
 * @param map 可以是indexMap或者uniqueMap
 * @param fields 要初始化的字段列表
 * @returns 从字段名到字段在fields中的位置的映射
 */
export const initIndexMap = (
  privates: Table.Private,
  map: Table.IndexMap | Table.UniqueMap,
  fields: string[]
) => {
  const iti = {} as Record<string, number>;
  for (let i = 0; i < fields.length; i++) {
    const idx = fields[i];
    iti[idx] = privates.fields.findIndex((f) => f === idx);
    map.set(idx, new Map());
  }
  return iti;
};

export const initIndexes = (privates: Table.Private, fields: string[]) => {
  // 首先要校验索引组是否都在fields内
  if (fields.some((idx) => !privates.fields.includes(idx))) {
    throw err('Index field not found in fields', 'initIndexes');
  }

  const map = privates.indexMap;

  const iti = initIndexMap(privates, map, fields);

  // 遍历全表，建立索引
  // Traverse the entire table and build indexes
  for (let i = 0; i < privates.data.length; i++) {
    const row = privates.data[i];
    for (let j = 0; j < fields.length; j++) {
      // 上面已经初始化过，这里一定是有的
      // As initialized above, 'get' must return a no undefined value here
      const indexValueMap = map.get(fields[j])!;
      const vKey = row[iti[fields[j]]];
      let rows = indexValueMap.get(vKey);
      if (!rows) {
        rows = [] as Table.Row[];
        indexValueMap.set(vKey, []);
      }
      rows.push(row);
    }
  }
};

export const initUniques = (privates: Table.Private, fields: string[]) => {
  // 首先要校验索引组是否都在fields内
  if (fields.some((idx) => !privates.fields.includes(idx))) {
    throw err('Unique field not found in fields', 'initUniques');
  }

  const map = privates.uniqueMap;

  const iti = initIndexMap(privates, map, fields);

  // 遍历全表，建立索引
  // Traverse the entire table and build indexes
  for (let i = 0; i < privates.data.length; i++) {
    const row = privates.data[i];
    for (let j = 0; j < fields.length; j++) {
      // 上面已经初始化过，这里一定是有的
      // As initialized above, 'get' must return a no undefined value here
      const uniqueValueMap = map.get(fields[j])!;
      const vKey = row[iti[fields[j]]];
      // 唯一索引不能有重复数据
      // Unique indexes must not have duplicated data
      if (uniqueValueMap.has(vKey)) {
        throw err(
          `Duplicate unique value detected, field:${fields[j]} valueKey: ${vKey} data index: ${i}`,
          'initUniques'
        );
      }
      uniqueValueMap.set(vKey, row);
    }
  }
};

/**
 * 不使用索引的直接搜索 \
 * Search without using indexes
 * @param data 局部数据
 * @param condition 条件（已校验）
 */
export const filter = <T extends Table.Config>(
  privates: Table.Private,
  data: Table.Row[],
  condition: Table.FindCondition<T['fields']>
) => {
  // 能快一点是一点
  // The faster, the better
  if (data.length === 0) {
    return [];
  }

  const fields = Object.keys(condition);
  const result = [] as Table.Entity<T['fields']>[];
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    let match = true;
    for (let j = 0; j < fields.length; j++) {
      if (d[privates.fieldIndex[fields[j]]] !== condition[fields[j]]) {
        // 这一行不符合
        // This row does not match
        match = false;
        break;
      }
    }
    if (match) {
      // 这里要把数据组合成对象数组
      // Here, the data must be combined into an array of objects
      const row = {} as Table.Entity<T['fields']>;
      for (let k = 0; k < privates.fields.length; k++) {
        row[privates.fields[k]] = d[k];
      }
      result.push(row);
    }
  }
  return result;
};

/**
 * 如果没给值（为undefined），那么先看默认值再看是否可为空 \
 * 如果为null，那么只看是否可为空 \
 * 如果为其他值，那么对比类型是否符合 \
 * If no value is given (undefined), first check the default value and then see if it can be null \
 * If it is null, only check if it is nullable \
 * If it is other value, compare the type to see if it matches
 * @param value
 * @param i
 * @returns
 */
export const normalize = (
  privates: Table.Private,
  value: Table.Value | undefined,
  i: number
) => {
  // 如果是自增主键，那么不管value给的是多少，都以自增值覆盖
  if (privates.isAI && i === privates.pk) {
    return ++privates.autoIncrementId;
  }

  // 看看是否没给这个值
  if (value === undefined) {
    // 看看是否有默认值
    const d = privates.defaults[i];
    if (d) {
      if (typeof d === 'function') {
        return d();
      } else {
        return d;
      }
    }
    // 没有默认值，看看允不允许为空
    if (privates.nullables[i]) {
      return null;
    }
    throw err(`Field '${privates.fields[i]}' is not nullable`, 'assureValue');
  }

  if (value === null && privates.nullables[i]) {
    return null;
  }

  // 类型校验
  if (
    (privates.types[i] === 'Date' && !(value instanceof Date)) ||
    (privates.types[i] !== 'Date' && typeof value !== privates.types[i])
  ) {
    const f = privates.fields[i];
    const t = privates.types[i];
    const tv = typeof value;
    throw err(`Field '${f}' type mismatch, expected '${t}', got '${tv}'`, 'assureValue');
  }
  return value;
};

export const privatar = <T extends object>() => {
  const p = new WeakMap<T, Table.Private>();
  return {
    getPrivates: (table: T) => p.get(table)!,
    createPrivates: (table: T) => {
      const privates = {} as Table.Private;
      p.set(table, privates);
      return privates;
    },
  };
};
