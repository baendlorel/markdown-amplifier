import { decompressSync } from './brotli';
import { assertValidFieldOptionArray, assertValidTableName } from './checkers';
import { Value, Row, MemDBTableCreateOption, DefaultGetter, RowObject } from './types';

export class DBTable {
  // TODO undefined、null、boolean的存储可以缩减为任意字符，并用对应fieldtype加载正确的值
  save: (dbFilePath: string) => void;

  private name: string;

  /**
   * 字段，本可以写成构造器里那样的配置数组，但由于要用到typeof this.fields，所以只能这样写了 \
   * Fields, could be written as a configuration array in the constructor, but because 'typeof this.fields' is used, there is no other way
   */
  private fields: string[];

  /**
   * 字段类型，包含string、number、boolean、Date \
   * Field types, including string, number, boolean, Date
   */
  private types: string[];

  /**
   * 标记是否可为空 \
   * Mark whether it can be null
   */
  private nullables: boolean[];

  /**
   * 字段默认值或默认值获取函数 \
   * Field default value or default value getter function
   */
  private defaults: DefaultGetter[];

  /**
   * 代表主键在fields的下标 \
   * The index of the primary key in fields
   */
  private pk: number;

  /**
   * 是否为自增 \
   * Whether it is auto-increment
   */
  private isAI: boolean;

  /**
   * 获取某个字段的下标在第几位，用来根据字段获取row里对应的字段值 \
   * Get the index of a field, used to get the value of this field from a row
   */
  private fieldIndex: { [key in (typeof this.fields)[number]]: number };

  /**
   * 数据
   */
  private data: Row[];

  /**
   * Map<索引字段名,Map<索引字段值，多个数据行>> \
   * Map<Index Field Name, Map<Index Field Value, Data Rows>>
   */
  private indexMap: Map<string, Map<Value, Row[]>>;

  /**
   * Map<索引字段名,Map<索引字段值，数据行>> \
   * Map<Index Field Name, Map<Index Field Value, Data Row>>
   */
  private uniqueMap: Map<string, Map<Value, Row>>;

  constructor(o: MemDBTableCreateOption) {
    assertValidTableName(o.tableName);
    this.name = o.tableName;

    if (!Array.isArray(o.fields)) {
      throw new Error(
        `[MemDB] Expected 'fields' to be an array, but got '${typeof o.fields}'`
      );
    }
    const { fields, types, defaults, nullables, indexes, uniques, pk, isAI } =
      assertValidFieldOptionArray(Array.from(o.fields));

    this.fields = fields;
    this.types = types;
    this.defaults = defaults;
    this.nullables = nullables;
    this.pk = pk;
    this.isAI = isAI;

    this.data = [];
    this.fieldIndex = {};
    for (let i = 0; i < o.fields.length; i++) {
      this.fieldIndex[o.fields[i].name] = i;
    }
    this.indexMap = new Map();
    this.uniqueMap = new Map();
    this.initIndexes(indexes);
    this.initUniques(uniques);
  }

  /**
   * 初始化索引映射 \
   * 把索引字段转换为索引字段在fields中的位置 \
   * Initialize index mapping \
   * Convert index fields to their positions in fields
   * @param map 可以是indexMap或者uniqueMap
   * @param fields 要初始化的字段列表
   * @returns 从字段名到字段在fields中的位置的映射
   */
  private initIndexMap(
    map: Map<string, Map<Value, Row[]>> | Map<string, Map<Value, Row>>,
    fields: (typeof this.fields)[number][]
  ) {
    const iti = {} as { [k in (typeof this.fields)[number]]: number };
    for (let i = 0; i < fields.length; i++) {
      const idx = fields[i];
      iti[idx] = this.fields.findIndex((f) => f === idx);
      map.set(idx, new Map());
    }
    return iti;
  }

  private initIndexes(fields: (typeof this.fields)[number][]) {
    // 首先要校验索引组是否都在fields内
    if (fields.some((idx) => !this.fields.includes(idx))) {
      throw new Error('[MemDB] Index field not found in fields');
    }

    const iti = this.initIndexMap(this.indexMap, fields);

    // 遍历全表，建立索引
    // Traverse the entire table and build indexes
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      for (let j = 0; j < fields.length; j++) {
        // 上面已经初始化过，这里一定是有的
        // As initialized above, 'get' must return a no undefined value here
        const indexValueMap = this.indexMap.get(fields[j]) as Map<Value, Row[]>;
        const vKey = row[iti[fields[j]]];
        let rows = indexValueMap.get(vKey);
        if (!rows) {
          rows = [] as Row[];
          indexValueMap.set(vKey, []);
        }
        rows.push(row);
      }
    }
  }

  private initUniques(fields: (typeof this.fields)[number][]) {
    // 首先要校验索引组是否都在fields内
    if (fields.some((idx) => !this.fields.includes(idx))) {
      throw new Error('[MemDB] Index field not found in fields');
    }

    const iti = this.initIndexMap(this.indexMap, fields);

    // 遍历全表，建立索引
    // Traverse the entire table and build indexes
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      for (let j = 0; j < fields.length; j++) {
        // 上面已经初始化过，这里一定是有的
        // As initialized above, 'get' must return a no undefined value here
        const uniqueValueMap = this.uniqueMap.get(fields[j]) as Map<Value, Row>;
        const vKey = row[iti[fields[j]]];
        // 唯一索引不能有重复数据
        // Unique indexes must not have duplicated data
        if (uniqueValueMap.has(vKey)) {
          throw new Error(
            `[MemDB] Duplicate unique value detected, field:${fields[j]} valueKey: ${vKey} data index: ${i}`
          );
        }
        uniqueValueMap.set(vKey, row);
      }
    }
  }

  /**
   * 不使用索引的直接搜索 \
   * Search without using indexes
   * @param data 局部数据
   * @param condition 条件（已校验）
   */
  private filter(data: Row[], condition: RowObject<typeof this.fields>) {
    // 能快一点是一点
    // The faster, the better
    if (data.length === 0) {
      return [];
    }

    const fields = Object.keys(condition);
    const result = [] as RowObject<typeof this.fields>[];
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      let match = true;
      for (let j = 0; j < fields.length; j++) {
        if (d[this.fieldIndex[fields[j]]] !== condition[fields[j]]) {
          // 这一行不符合
          // This row does not match
          match = false;
          break;
        }
      }
      if (match) {
        // 这里要把数据组合成对象数组
        // Here, the data must be combined into an array of objects
        const row = {} as RowObject<typeof this.fields>;
        for (let k = 0; k < this.fields.length; k++) {
          row[this.fields[k]] = d[k];
        }
        result.push(row);
      }
    }
    return result;
  }

  find(
    condition: Partial<RowObject<typeof this.fields>>
  ): RowObject<typeof this.fields>[] {
    if (!condition || typeof condition !== 'object') {
      throw new Error('[MemDB] Condition must be an object with fields and values');
    }
    // 校验字段是否可用
    // Check if the fields are available
    const fields = Object.keys(condition);
    if (fields.some((k) => !this.fields.includes(k))) {
      throw new Error(`[MemDB] Invalid field detected. fields: ${fields.join()}`);
    }

    // 先试试唯一索引，能找到就轻松了
    // Try unique indexes first, if found, return directly
    const uniqueFields = fields.filter((k) => this.uniqueMap.has(k));
    if (uniqueFields.length > 0) {
      const uniqueValueMap = this.uniqueMap.get(uniqueFields[0]) as Map<Value, Row>;
      const vKey = condition[uniqueFields[0]];
      const row = uniqueValueMap.get(vKey);
      if (row) {
        return this.filter([row], condition);
      } else {
        return [];
      }
    }

    // 再试普通索引
    // Try the normal indexes
    const indexFields = fields.filter((k) => this.indexMap.has(k));
    if (indexFields.length > 0) {
      let shortestRows = [] as Row[];
      for (let i = 0; i < indexFields.length; i++) {
        // 根据字段indexValueMaps[i]找到了此字段索引映射，看看有没有符合的数据行
        // Found the index map of by field indexValueMaps[i], see if there are any matching data rows
        const map = this.indexMap.get(indexFields[i]) as Map<Value, Row[]>;
        const rows = map.get(condition[indexFields[i]]);
        if (!rows || rows.length === 0) {
          return [];
        }
        if (rows.length < shortestRows.length || shortestRows.length === 0) {
          shortestRows = rows;
        }
      }
      // 从最小行数组开始找，以求最快速度
      // Searching from the shortest rows array for the fastest speed
      return this.filter(shortestRows, condition);
    }

    // 只能硬来了
    // Have to try it the hard way
    return this.filter(this.data, condition);
  }

  private validRow(row: Partial<RowObject<typeof this.fields>>) {}

  insert(row: Partial<RowObject<typeof this.fields>>) {
    for (let i = 0; i < this.fields.length; i++) {
      // 逐个字段校验
      const value = row[this.fields[i]];
    }
  }

  static from(dbFilePath: string): DBTable {
    try {
      const str = decompressSync(dbFilePath);
      const o = JSON.parse(str);
      return new DBTable(o);
    } catch (error) {
      console.log('Failed to load DBTable from file:', dbFilePath);
      console.error(error);
      return new DBTable({ fields: [] as any[], tableName: 'test' });
    }
  }

  display() {
    console.log('tableName', this.name);
    console.log({ pk: this.pk, isAI: this.isAI });
    console.log('fields  ', this.fields);
    console.log('types   ', this.types);
    console.log('defaults', this.defaults);
    console.log('indexes ', this.indexMap.keys());
    console.log('uniques ', this.uniqueMap.keys());

    // console.table([this.fields, this.types, this.defaults, this.indexes, this.uniques]);
  }
}
