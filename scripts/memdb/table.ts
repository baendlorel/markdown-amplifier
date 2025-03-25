import fs from 'fs';
import { decompressSync } from './brotli';
import { assureFieldOptionArray, assertValidTableName } from './checkers';
import {
  Value,
  Row,
  TableConfig,
  DefaultGetter,
  FieldType,
  Entity,
  FindCondition,
  Line,
} from './types';

const dbDataSymbol = Symbol('dbData');

export class DBTable<T extends TableConfig> {
  /**
   * 生成一个符合 UUID v4 标准的随机字符串 \
   * Generate a random string that conforms to the UUID v4 standard
   * @returns UUID v4 字符串
   */
  static UUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0; // 生成 0-15 的随机数
      const value = char === 'x' ? random : (random & 0x3) | 0x8; // 确保符合 UUID v4 标准
      return value.toString(16); // 转换为十六进制
    });
  }

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
  private types: FieldType[];

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

  // DEAFULT_GETTER_IS_FUNCTION

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
   * 自增主键到几了 \
   * Current auto-increment primary key
   */
  private autoIncrementId: number;

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

  private pkMap: Map<string, Map<Value, Row>>;

  /**
   * 获取某个字段的下标在第几位，用来根据字段获取row里对应的字段值 \
   * Get the index of a field, used to get the value of this field from a row
   */
  private fieldIndex: Record<string, number>;

  /**
   * 数据
   */
  private data: Row[];

  constructor(o: T) {
    this.autoIncrementId = 0;
    if (dbDataSymbol in o) {
      console.log(`[MemDB] Loading DBTable from file: ${o[dbDataSymbol]}`);
      this.data = o[dbDataSymbol] as Row[];
    } else {
      this.data = [];
    }

    assertValidTableName(o.tableName);
    this.name = o.tableName;

    if (!Array.isArray(o.fields)) {
      throw new Error(
        `[MemDB] Expected 'fields' to be an array, but got '${typeof o.fields}'`
      );
    }
    const { fields, types, defaults, nullables, indexes, uniques, pk, isAI } =
      assureFieldOptionArray(Array.from(o.fields));

    this.fields = fields;
    this.fieldIndex = {} as Record<string, number>;
    for (let i = 0; i < fields.length; i++) {
      this.fieldIndex[fields[i]] = i;
    }
    this.types = types;
    this.defaults = defaults;
    this.nullables = nullables;
    this.pk = pk;
    this.isAI = isAI;
    this.indexMap = new Map();
    this.uniqueMap = new Map();
    this.pkMap = new Map();
    this.initIndexes(this.indexMap, indexes);
    this.initUniques(this.uniqueMap, uniques);
    this.initUniques(this.pkMap, [fields[pk]]);
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
    fields: string[]
  ) {
    const iti = {} as Record<string, number>;
    for (let i = 0; i < fields.length; i++) {
      const idx = fields[i];
      iti[idx] = this.fields.findIndex((f) => f === idx);
      map.set(idx, new Map());
    }
    return iti;
  }

  private initIndexes(map: Map<string, Map<Value, Row[]>>, fields: string[]) {
    // 首先要校验索引组是否都在fields内
    if (fields.some((idx) => !this.fields.includes(idx))) {
      throw new Error('[MemDB] Index field not found in fields');
    }

    const iti = this.initIndexMap(map, fields);

    // 遍历全表，建立索引
    // Traverse the entire table and build indexes
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      for (let j = 0; j < fields.length; j++) {
        // 上面已经初始化过，这里一定是有的
        // As initialized above, 'get' must return a no undefined value here
        const indexValueMap = map.get(fields[j]) as Map<Value, Row[]>;
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

  private initUniques(map: Map<string, Map<Value, Row>>, fields: string[]) {
    // 首先要校验索引组是否都在fields内
    if (fields.some((idx) => !this.fields.includes(idx))) {
      throw new Error('[MemDB] Index field not found in fields');
    }

    const iti = this.initIndexMap(map, fields);

    // 遍历全表，建立索引
    // Traverse the entire table and build indexes
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      for (let j = 0; j < fields.length; j++) {
        // 上面已经初始化过，这里一定是有的
        // As initialized above, 'get' must return a no undefined value here
        const uniqueValueMap = map.get(fields[j]) as Map<Value, Row>;
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
  private filter(data: Row[], condition: FindCondition<T['fields']>) {
    // 能快一点是一点
    // The faster, the better
    if (data.length === 0) {
      return [];
    }

    const fields = Object.keys(condition);
    const result = [] as Entity<T['fields']>[];
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
        const row = {} as Entity<T['fields']>;
        for (let k = 0; k < this.fields.length; k++) {
          row[this.fields[k]] = d[k];
        }
        result.push(row);
      }
    }
    return result;
  }

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
  private assureValue(value: Value | undefined, i: number) {
    // 如果是自增主键，那么不管value给的是多少，都以自增值覆盖
    if (this.isAI && i === this.pk) {
      return ++this.autoIncrementId;
    }

    // 看看是否没给这个值
    if (value === undefined) {
      // 看看是否有默认值
      const d = this.defaults[i];
      if (d) {
        if (typeof d === 'function') {
          return d();
        } else {
          return d;
        }
      }
      // 没有默认值，看看允不允许为空
      if (this.nullables[i]) {
        return null;
      }
      throw new Error(`[MemDB] Field '${this.fields[i]}' is not nullable`);
    }

    if (value === null && this.nullables[i]) {
      return null;
    }

    // 类型校验
    if (
      (this.types[i] === 'Date' && !(value instanceof Date)) ||
      (this.types[i] !== 'Date' && typeof value !== this.types[i])
    ) {
      throw new Error(
        `[MemDB] Field '${this.fields[i]}' type mismatch, expected '${
          this.types[i]
        }', got '${typeof value}'`
      );
    }
    return value;
  }

  find(condition: FindCondition<T['fields']>): Entity<T['fields']>[] {
    if (!condition || typeof condition !== 'object') {
      throw new Error('[MemDB] Condition must be an object with fields and values');
    }
    // 校验字段是否可用
    // Check if the fields are available
    const condFields = Object.keys(condition);
    if (condFields.length === 0) {
      throw new Error('[MemDB] Condition cannot be empty');
    }
    if (condFields.some((k) => !this.fields.includes(k))) {
      throw new Error(`[MemDB] Invalid field detected. fields: ${condFields.join()}`);
    }

    // 校验condition字段是否符合设定的字段类型
    // Check if the condition fields are of the correct type
    for (let i = 0; i < condFields.length; i++) {
      const idx = this.fieldIndex[condFields[i]];
      const v = condition[condFields[i]];
      const t = this.types[idx];
      if (!this.nullables[idx] && v === null) {
        throw new Error(`[MemDB] '${condFields[i]}' cannot be null`);
      }

      if (t === 'Date' && !(v instanceof Date)) {
        throw new Error(
          `[MemDB] Field ${
            condFields[i]
          } type mismatch, expected 'Date', got '${typeof v}'`
        );
      }

      if (typeof v !== t) {
        throw new Error(
          `[MemDB] Field type mismatch, expected '${t}', got '${typeof v}'`
        );
      }
    }

    // 先试试唯一索引，能找到就轻松了
    // Try unique indexes first, if found, return directly
    const uniques = condFields.filter((k) => this.uniqueMap.has(k));
    if (uniques.length > 0) {
      for (let i = 0; i < uniques.length; i++) {
        const m = this.uniqueMap.get(uniques[i]) as Map<Value, Row>;
        const vkey = condition[uniques[i]] as Value;
        const row = m.get(vkey);
        if (row) {
          return this.filter([row], condition);
        }
      }
      // 走完了说明没找到，其实说明就没有了
      return [];
    }

    // 再试普通索引
    // Try the normal indexes
    const indexes = condFields.filter((k) => this.indexMap.has(k));
    if (indexes.length > 0) {
      let shortestRows = [] as Row[];
      for (let i = 0; i < indexes.length; i++) {
        // 根据字段indexValueMaps[i]找到了此字段索引映射，看看有没有符合的数据行
        // Found the index map of by field indexValueMaps[i], see if there are any matching data rows
        const m = this.indexMap.get(indexes[i]) as Map<Value, Row[]>;
        const rows = m.get(condition[indexes[i]] as Value);
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

  insert(row: Entity<T['fields']>) {
    const newRow = [] as Row;
    for (let i = 0; i < this.fields.length; i++) {
      // 逐个字段校验
      newRow[i] = this.assureValue(row[this.fields[i]], i);

      // 校验是否有重复的唯一索引
      // Check for duplicate unique indexes
      if (this.uniqueMap.has(this.fields[i])) {
        const m = this.uniqueMap.get(this.fields[i]) as Map<Value, Row>;
        if (m.has(newRow[i])) {
          throw new Error(
            `[MemDB] Duplicate unique value detected, field:${this.fields[i]} valueKey: ${newRow[i]}`
          );
        } else {
          m.set(newRow[i], newRow);
        }
      }

      // 添加索引
      // Add indexes
      if (this.indexMap.has(this.fields[i])) {
        const m = this.indexMap.get(this.fields[i]) as Map<Value, Row[]>;
        let rows = m.get(newRow[i]);
        rows ? rows.push(newRow) : m.set(newRow[i], [newRow]);
      }
    }
    this.data.push(newRow);
  }

  static from(dbFilePath: string) {
    try {
      const str = decompressSync(dbFilePath);
      const o = JSON.parse(str);
      o[dbDataSymbol] = o.data;
      return new DBTable(o);
    } catch (error) {
      console.log('Failed to load DBTable from file:', dbFilePath);
      console.error(error);
      return new DBTable({ fields: [] as any[], tableName: 'test' });
    }
  }

  // TODO undefined、null、boolean的存储可以缩减为任意字符，并用对应fieldtype加载正确的值
  save(dbFilePath: string) {
    // * 大部分时候字符串相加快于数组join，但此处需要精准按照枚举值DBTableFile排列每一行的内容
    // * Most of the time, adding string is faster than array join, but here we need to accurately arrange the content of each line according to 'DBTableFile'
    const content = [] as string[];
    content[Line.NAME] = 'NAME: ' + this.name;
    content[Line.FIELDS] = 'FIELDS: ' + this.fields.join(',');
    content[Line.TYPES] = 'TYPES: ' + this.types.join(',');
    content[Line.NULLABLES] =
      'NULLABLES: ' + this.nullables.map((n) => (n ? '1' : '0')).join(',');
    content[Line.DEFAULTS] =
      'DEFAULTS: ' +
      '{' +
      this.defaults.reduce((p, c, i) => `${p && p + ','}"${i}":"${String(c)}"`, '') +
      '}';
    content[Line.DEAFULT_GETTER_IS_FUNCTION] =
      'DEAFULT_GETTER_IS_FUNCTION: ' +
      this.defaults.map((d) => (typeof d === 'function' ? '1' : '0')).join(',');
    content[Line.PRIMARY_KEY] = 'PRIMARY_KEY: ' + String(this.pk);
    content[Line.IS_AI] = 'IS_AI: ' + (this.isAI ? '1' : '0');
    content[Line.AUTO_INCREMENT_ID] =
      'AUTO_INCREMENT_ID: ' + String(this.autoIncrementId);
    content[Line.INDEXES] = 'INDEXES: ' + [...this.indexMap.keys()].join();
    content[Line.UNIQUES] = 'UNIQUES: ' + [...this.uniqueMap.keys()].join();

    const total = Line.DATA_START + this.data.length;
    for (let i = Line.DATA_START; i < total; i++) {
      content[i] = JSON.stringify(this.data[i - Line.DATA_START]).slice(1, -1);
    }
    fs.writeFileSync(dbFilePath, content.join('\n'));
  }

  display() {
    console.log('tableName', this.name);
    console.log({ pk: this.pk, isAI: this.isAI });
    console.log('fields  ', this.fields);
    console.log('types   ', this.types);
    console.log('defaults', this.defaults);
    for (const f of this.indexMap.keys()) {
      console.log(`indexes ${f}: ${this.indexMap.get(f)?.size}`);
    }

    for (const f of this.uniqueMap.keys()) {
      console.log(`uniques ${f}: ${this.uniqueMap.get(f)?.size}`);
    }

    if (this.data.length > 15) {
      console.log('data    ', this.data.slice(0, 5), `...${this.data.length - 5} more`);
    } else {
      console.log('data    ', this.data);
    }

    // console.table([this.fields, this.types, this.defaults, this.indexes, this.uniques]);
  }
}
