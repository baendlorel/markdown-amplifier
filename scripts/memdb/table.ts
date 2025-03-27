import fs from 'fs';
import { decompressSync } from './brotli';
import {
  assureFieldOptionArray,
  assertTableName,
  assertSameDefaultGetter,
} from './checkers';
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
import { base64, createDiagnostics, isPermutated, recreateFunction } from './utils';

const { err, log } = createDiagnostics('<Table>');

export class Table<T extends TableConfig> {
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
    this.data = [];

    assertTableName(o.tableName);
    this.name = o.tableName;

    if (!Array.isArray(o.fields)) {
      throw err(
        `Expected 'fields' to be an array, but got '${typeof o.fields}'`,
        'constructor'
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
      throw err('Index field not found in fields', 'initIndexes');
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
      throw err('Unique field not found in fields', 'initUniques');
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
          throw err(
            `Duplicate unique value detected, field:${fields[j]} valueKey: ${vKey} data index: ${i}`,
            'initUniques'
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
      throw err(`Field '${this.fields[i]}' is not nullable`, 'assureValue');
    }

    if (value === null && this.nullables[i]) {
      return null;
    }

    // 类型校验
    if (
      (this.types[i] === 'Date' && !(value instanceof Date)) ||
      (this.types[i] !== 'Date' && typeof value !== this.types[i])
    ) {
      const f = this.fields[i];
      const t = this.types[i];
      const tv = typeof value;
      throw err(
        `Field '${f}' type mismatch, expected '${t}', got '${tv}'`,
        'assureValue'
      );
    }
    return value;
  }

  find(condition: FindCondition<T['fields']>): Entity<T['fields']>[] {
    if (!condition || typeof condition !== 'object') {
      throw err('Condition must be an object with fields and values', 'find');
    }
    // 校验字段是否可用
    // Check if the fields are available
    const condFields = Object.keys(condition);
    if (condFields.length === 0) {
      throw err('Condition cannot be empty', 'find');
    }
    if (condFields.some((k) => !this.fields.includes(k))) {
      throw err(`Invalid field detected. fields: ${condFields.join()}`, 'find');
    }

    // 校验condition字段是否符合设定的字段类型
    // Check if the condition fields are of the correct type
    for (let i = 0; i < condFields.length; i++) {
      const idx = this.fieldIndex[condFields[i]];
      const v = condition[condFields[i]];
      const t = this.types[idx];
      if (!this.nullables[idx] && v === null) {
        throw err(`'${condFields[i]}' cannot be null`, 'find');
      }

      if (t === 'Date' && !(v instanceof Date)) {
        const cf = condFields[i];
        const tv = typeof v;
        throw err(`Field ${cf} type mismatch, expected 'Date', got '${tv}'`, 'find');
      }

      if (typeof v !== t) {
        throw err(`Field type mismatch, expected '${t}', got '${typeof v}'`, 'find');
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
          const f = this.fields[i];
          const nri = newRow[i];
          throw err(`Duplicate unique value! field:${f} value:${nri}`, 'insert');
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

  /**
   * 保存数据库结构、内容到文件中 \
   * 主要是内容，结构只是为了调用load的时候进行对比校验 \
   * Save the database structure and content to a file \
   * Content is the main point, saving structure is just for validation when calling 'load'
   * @param dbFilePath
   */
  save(dbFilePath: string) {
    // * 大部分时候字符串相加快于数组join，但此处需要精准按照枚举值Line排列每一行的内容
    // * Most of the time, adding string is faster than array join, but here we need to accurately arrange the content of each line according to 'DBTableFile'
    const lines = [] as string[];
    lines[Line.NAME] = 'NAME: ' + this.name;
    lines[Line.FIELDS] = 'FIELDS: ' + this.fields.join(',');
    lines[Line.TYPES] = 'TYPES: ' + this.types.join(',');
    lines[Line.NULLABLES] =
      'NULLABLES: ' + this.nullables.map((n) => (n ? '1' : '0')).join(',');

    // * 全部字符串化并转换为base64编码，防止出现换行符影响split
    // * Convert all defaultGetters to string and encode with base64 to prevent line breaks from affecting 'split'
    // 首尾加上大括号可以变成对象
    // Add braces at the beginning and end to make it an object
    lines[Line.DEFAULTS] =
      'DEFAULTS: ' +
      this.defaults.reduce((prev, getter, i) => {
        let v = '';
        switch (typeof getter) {
          case 'string':
            v = getter;
            break;
          case 'number':
            v = String(getter);
            break;
          case 'boolean':
            v = getter ? '1' : '0';
            break;
          case 'function':
            v = getter.toString();
            break;
          case 'object':
            if (getter instanceof Date) {
              v = getter.getTime().toString();
              break;
            }
          default:
            throw err(
              'Invalid default value getter, must be string, number, boolean, Date or a function',
              'save'
            );
        }
        return `${prev && prev + ','}"${i}":"${base64.encode(v)}"`;
      }, '');
    // 首尾加上大括号可以变成对象
    // Add braces at the beginning and end to make it an object
    lines[Line.DEAFULT_GETTER_TYPE] =
      'DEAFULT_GETTER_TYPE: ' +
      this.defaults.reduce((prev, getter, i) => {
        let v = '';
        switch (typeof getter) {
          case 'string':
          case 'number':
          case 'boolean':
          case 'function':
            v = typeof getter;
            break;
          case 'object':
            if (getter instanceof Date) {
              v = 'Date';
              break;
            }
          default:
            throw err(
              `Invalid default value getter, must return string, number, boolean or Date`,
              'save'
            );
        }
        return `${prev && prev + ','}"${i}":"${v}"`;
      }, '');
    lines[Line.PRIMARY_KEY] = 'PRIMARY_KEY: ' + String(this.pk);
    lines[Line.IS_AI] = 'IS_AI: ' + (this.isAI ? '1' : '0');
    lines[Line.AUTO_INCREMENT_ID] = 'AUTO_INCREMENT_ID: ' + String(this.autoIncrementId);
    lines[Line.INDEXES] = 'INDEXES: ' + [...this.indexMap.keys()].join();
    lines[Line.UNIQUES] = 'UNIQUES: ' + [...this.uniqueMap.keys()].join();

    // 开始保存数据
    for (let i = 0; i < this.data.length; i++) {
      // 删除首尾的方括号，boolean转换为0或1，以达到节省空间的目的
      // Remove the brackets at the two sides, convert boolean to 0 or 1 to save space
      lines[i + Line.DATA_START] = JSON.stringify(this.data[i], (key, value) => {
        switch (this.types[key]) {
          case 'boolean':
            return value ? '1' : '0';
          case 'Date':
            return new Date(value).getTime();
          default:
            return value;
        }
      }).slice(1, -1);
    }
    fs.writeFileSync(dbFilePath, lines.join('\n'), { encoding: 'utf-8' });
  }

  load(dbFilePath: string) {
    // 如果不存在就不加载了，作为一个空表
    if (!fs.existsSync(dbFilePath)) {
      console.log(`[SylphDB] File not found: '${dbFilePath}'. Loading as empty table`);
      return this;
    }

    const content = fs.readFileSync(dbFilePath, { encoding: 'utf-8' });
    const lines = content.split('\n');
    // 开始对比表结构。可能改代码时会调整字段顺序，故此处要做成映射再行对比
    // Start comparison of table structure. The field order may be adjusted when coding, so map it to an object for comparison
    const name = lines[Line.NAME].replace('NAME: ', '');
    if (name !== this.name) {
      throw err(`Table name mismatch, expected '${this.name}', got '${name}'`, 'load');
    }
    const fields = lines[Line.FIELDS].replace('FIELDS: ', '').split(',');
    if (this.fields.length !== fields.length) {
      const used = `[${this.fields.join()}](${this.fields.length})`;
      const loaded = `[${fields.join()}](${fields.length})`;
      throw err(`Field count mismatch, expected '${used}', loaded '${loaded}'`, 'load');
    }

    // 下面开始考虑fields和this.field的内容是否一致
    // get函数能够顺利生成说明两者只是调换了顺序或原本就是一致的
    // Now consider whether the elements of 'fields' and 'this.field' are the same
    // If 'get' can be generated, the two arrays are only in different order or are the same
    /**
     * 用于以arr的下标来访问this.arr中对应的元素 \
     * Access the corresponding element in 'this.arr' using the index of 'arr'
     * @param i 元素在arr中的下标
     */
    const toThisIndex = {} as Record<number, number>;
    let permutated = false;
    for (let i = 0; i < fields.length; i++) {
      const index = this.fields.findIndex((f) => f === fields[i]);
      if (index === -1) {
        const f = fields[i];
        const flds = this.fields.join();
        throw err(`Loaded field '${f}' is not found in '${flds}'`, 'load');
      }
      toThisIndex[i] = index;
      if (i !== index) {
        permutated = true;
      }
    }

    if (permutated) {
      log(`Field order permutated ${toThisIndex}`, 'load');
    } else {
      log(`Field order preserved`, 'load');
    }

    const readArray = (lineType: keyof typeof Line) =>
      lines[Line[lineType]]
        .replace(lineType + ': ', '')
        .split(',')
        .filter(Boolean);

    const read = (lineType: keyof typeof Line) =>
      lines[Line[lineType]].replace(lineType + ': ', '');

    // 逐个字段对比
    // Compare each configuration
    const types = readArray('TYPES');
    const nullables = readArray('NULLABLES').map((n) => n === '1');
    const defaults = (() => {
      const _default = JSON.parse(`{${lines[Line.DEFAULTS].replace('DEFAULTS: ', '')}}`);
      const _defaultGetterType = JSON.parse(
        `{${lines[Line.DEAFULT_GETTER_TYPE].replace('DEAFULT_GETTER_TYPE: ', '')}}`
      );
      const result = [] as DefaultGetter[];
      for (const i in _default) {
        switch (_defaultGetterType[i]) {
          case 'string':
            result[i] = base64.decode(_default[i]);
            break;
          case 'number':
            result[i] = Number(base64.decode(_default[i]));
            break;
          case 'boolean':
            result[i] = base64.decode(_default[i]) === '1';
            break;
          case 'function':
            result[i] = recreateFunction(base64.decode(_default[i]));
            break;
          case 'Date':
            result[i] = new Date(base64.decode(_default[i]));
            break;
          default:
            const di = _defaultGetterType[i];
            throw err(`Invalid default value getter type: ${di}`, 'load');
        }
      }
      return result;
    })();
    const pk = Number(read('PRIMARY_KEY'));
    const isAI = read('IS_AI') === '1';
    const autoIncrementId = Number(read('AUTO_INCREMENT_ID'));
    const indexes = readArray('INDEXES');
    const uniques = readArray('UNIQUES');

    const mismatch = (prop: string, i: number, ti: number, expected: any, got: any) =>
      err(
        `'${prop}[${i}]->[${ti}]' mismatch, expected '${expected}', got '${got}'`,
        'load'
      );

    // # compare types, nullables, defaults
    for (let i = 0; i < fields.length; i++) {
      const ii = toThisIndex[i];

      if (types[i] !== this.types[ii]) {
        mismatch('types', i, ii, this.types[ii], types[i]);
      }

      if (nullables[i] !== this.nullables[ii]) {
        mismatch('nullables', i, ii, this.nullables[ii], nullables[i]);
      }

      // defaultGetter的对比相对复杂一些
      assertSameDefaultGetter(this.defaults[ii], defaults[i]);
    }

    // # compare isAI and pk
    if (isAI !== this.isAI) {
      throw err(`'isAI' mismatch, expected '${this.isAI}', got '${isAI}'`, 'load');
    }

    if (toThisIndex[pk] !== this.pk) {
      const tpk = toThisIndex[pk];
      throw err(`'pk' mismatch, expected '${this.pk}', got '${pk}->${tpk}'`, 'load');
    }

    // # compare indexes and uniques
    const thisIndexes = [...this.indexMap.keys()];
    if (!isPermutated(indexes, thisIndexes)) {
      const ti = thisIndexes;
      throw err(`'indexes' mismatch, expected '${ti}', got '${indexes}'`, 'load');
    }

    const thisUniques = [...this.uniqueMap.keys()];
    if (!isPermutated(uniques, thisUniques)) {
      const tu = thisUniques;
      throw err(`'uniques' mismatch, expected '${tu}', got '${uniques}'`, 'load');
    }

    if (Number.isNaN(autoIncrementId)) {
      throw err(`Loaded 'autoIncrementId' is NaN`, 'load');
    }

    this.autoIncrementId = autoIncrementId;

    // 开始加载数据
    // Start loading data from file

    for (let i = Line.DATA_START; i < lines.length; i++) {
      // 删除首尾的方括号
      const l = JSON.parse('[' + lines[i] + ']');
      const row = [] as Row;
      for (let j = 0; j < l.length; j++) {
        // string、boolean、number、Date的正确处理
        switch (types[j]) {
          case 'string':
          case 'number':
            row[toThisIndex[j]] = l[j];
            break;
          case 'boolean':
            row[toThisIndex[j]] = l[j] === '1';
          case 'Date':
            row[toThisIndex[j]] = new Date(l[j]);
            break;
          default:
            throw err(`Invalid field type: ${types[j]}`, 'load');
        }
      }
      this.data.push(row);
    }
    return this;
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
