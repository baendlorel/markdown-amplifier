import { existsSync, readFileSync, writeFileSync } from 'fs';
import { decompressSync } from '../brotli';
import { checker } from './checkers';
import { Table } from './types';
import { base64, createDiagnostics, isPermutated, recreateFunction } from '../utils';
import { normalize, filter, initIndexes, initUniques, privatar } from './privates';

const { err, log } = createDiagnostics('<Table>');

const { getPrivates, createPrivates } = privatar();

export class SylphTable<T extends Table.Config> {
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

  constructor(o: T) {
    const privates = createPrivates(this);
    privates.autoIncrementId = 0;
    privates.data = [];

    checker.validTableName(o.tableName);
    privates.name = o.tableName;

    if (!Array.isArray(o.fields)) {
      throw err(
        `Expected 'fields' to be an array, but got '${typeof o.fields}'`,
        'constructor'
      );
    }

    const { fields, types, defaults, nullables, indexes, uniques, pk, isAI } =
      checker.normalizeFieldOptions(Array.from(o.fields));

    privates.fields = fields;
    privates.fieldIndex = {} as Record<string, number>;
    for (let i = 0; i < fields.length; i++) {
      privates.fieldIndex[fields[i]] = i;
    }
    privates.types = types;
    privates.defaults = defaults;
    privates.nullables = nullables;
    privates.pk = pk;
    privates.isAI = isAI;
    privates.indexMap = new Map();
    privates.uniqueMap = new Map();
    privates.pkMap = new Map();
    initIndexes(privates, indexes);
    initUniques(privates, uniques);
    initUniques(privates, [fields[pk]]);
  }

  find(condition: Table.FindCondition<T['fields']>): Table.Entity<T['fields']>[] {
    const privates = getPrivates(this);
    const e = (msg: string) => err(msg, 'find');

    if (!condition || typeof condition !== 'object') {
      throw e('Condition must be an object with fields and values');
    }
    // 校验字段是否可用
    // Check if the fields are available
    const condFields = Object.keys(condition);
    if (condFields.length === 0) {
      throw e('Condition cannot be empty');
    }
    if (condFields.some((k) => !privates.fields.includes(k))) {
      throw e(`Invalid field detected. fields: ${condFields.join()}`);
    }

    // 校验condition字段是否符合设定的字段类型
    // Check if the condition fields are of the correct type
    for (let i = 0; i < condFields.length; i++) {
      const idx = privates.fieldIndex[condFields[i]];
      const v = condition[condFields[i]];
      const t = privates.types[idx];
      if (!privates.nullables[idx] && v === null) {
        throw e(`'${condFields[i]}' cannot be null`);
      }

      if (t === 'Date' && !(v instanceof Date)) {
        const cf = condFields[i];
        const tv = typeof v;
        throw e(`Field ${cf} type mismatch, expected 'Date', got '${tv}'`);
      }

      if (typeof v !== t) {
        throw e(`Field type mismatch, expected '${t}', got '${typeof v}'`);
      }
    }

    // 先试试唯一索引，能找到就轻松了
    // Try unique indexes first, if found, return directly
    const uniques = condFields.filter((k) => privates.uniqueMap.has(k));
    if (uniques.length > 0) {
      for (let i = 0; i < uniques.length; i++) {
        const m = privates.uniqueMap.get(uniques[i])!;
        const vkey = condition[uniques[i]];
        const row = m.get(vkey);
        if (row) {
          return filter(privates, [row], condition);
        }
      }
      // 走完了说明没找到，其实说明就没有了
      return [];
    }

    // 再试普通索引
    // Try the normal indexes
    const indexes = condFields.filter((k) => privates.indexMap.has(k));
    if (indexes.length > 0) {
      let shortestRows = [] as Table.Row[];
      for (let i = 0; i < indexes.length; i++) {
        // 根据字段indexValueMaps[i]找到了此字段索引映射，看看有没有符合的数据行
        // Found the index map of by field indexValueMaps[i], see if there are any matching data rows
        const m = privates.indexMap.get(indexes[i])!;
        const rows = m.get(condition[indexes[i]]);
        if (!rows || rows.length === 0) {
          return [];
        }
        if (rows.length < shortestRows.length || shortestRows.length === 0) {
          shortestRows = rows;
        }
      }
      // 从最小行数组开始找，以求最快速度
      // Searching from the shortest rows array for the fastest speed
      return filter(privates, shortestRows, condition);
    }

    // 只能硬来了
    // Have to try it the hard way
    return filter(privates, privates.data, condition);
  }

  insert(row: Table.Entity<T['fields']>) {
    const privates = getPrivates(this);
    const newRow = [] as Table.Row;
    for (let i = 0; i < privates.fields.length; i++) {
      // 逐个字段校验
      newRow[i] = normalize(privates, row[privates.fields[i]], i);

      // 校验是否有重复的主键
      // Check for duplicate primary keys
      if (privates.pkMap.has(privates.fields[i])) {
        const m = privates.pkMap.get(privates.fields[i])!;
        if (m.has(newRow[i])) {
          const f = privates.fields[i];
          const nri = newRow[i];
          throw err(`Duplicate primary key! field:${f} value:${nri}`, 'insert');
        } else {
          m.set(newRow[i], newRow);
        }
      }

      // 校验是否有重复的唯一索引
      // Check for duplicate unique indexes
      if (privates.uniqueMap.has(privates.fields[i])) {
        const m = privates.uniqueMap.get(privates.fields[i])!;
        if (m.has(newRow[i])) {
          const f = privates.fields[i];
          const nri = newRow[i];
          throw err(`Duplicate unique value! field:${f} value:${nri}`, 'insert');
        } else {
          m.set(newRow[i], newRow);
        }
      }

      // 添加索引
      // Add indexes
      if (privates.indexMap.has(privates.fields[i])) {
        const m = privates.indexMap.get(privates.fields[i])!;
        let rows = m.get(newRow[i]);
        rows ? rows.push(newRow) : m.set(newRow[i], [newRow]);
      }
    }
    privates.data.push(newRow);
  }

  /**
   * 保存数据库结构、内容到文件中 \
   * 主要是内容，结构只是为了调用load的时候进行对比校验 \
   * Save the database structure and content to a file \
   * Content is the main point, saving structure is just for validation when calling 'load'
   * @param dbFilePath
   */
  save(dbFilePath: string) {
    const privates = getPrivates(this);
    // * 大部分时候字符串相加快于数组join，但此处需要精准按照枚举值Line排列每一行的内容
    // * Most of the time, adding string is faster than array join, but here we need to accurately arrange the content of each line according to 'DBTableFile'
    const lines = [] as string[];
    lines[Table.Line.NAME] = 'NAME: ' + privates.name;
    lines[Table.Line.FIELDS] = 'FIELDS: ' + privates.fields.join(',');
    lines[Table.Line.TYPES] = 'TYPES: ' + privates.types.join(',');
    lines[Table.Line.NULLABLES] =
      'NULLABLES: ' + privates.nullables.map((n) => (n ? '1' : '0')).join(',');

    // * 全部字符串化并转换为base64编码，防止出现换行符影响split
    // * Convert all defaultGetters to string and encode with base64 to prevent line breaks from affecting 'split'
    // 首尾加上大括号可以变成对象
    // Add braces at the beginning and end to make it an object
    lines[Table.Line.DEFAULTS] =
      'DEFAULTS: ' +
      privates.defaults.reduce((prev, getter, i) => {
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
    lines[Table.Line.DEAFULT_GETTER_TYPE] =
      'DEAFULT_GETTER_TYPE: ' +
      privates.defaults.reduce((prev, getter, i) => {
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
    lines[Table.Line.PRIMARY_KEY] = 'PRIMARY_KEY: ' + String(privates.pk);
    lines[Table.Line.IS_AI] = 'IS_AI: ' + (privates.isAI ? '1' : '0');
    lines[Table.Line.AUTO_INCREMENT_ID] =
      'AUTO_INCREMENT_ID: ' + String(privates.autoIncrementId);
    lines[Table.Line.INDEXES] = 'INDEXES: ' + [...privates.indexMap.keys()].join();
    lines[Table.Line.UNIQUES] = 'UNIQUES: ' + [...privates.uniqueMap.keys()].join();

    // 开始保存数据
    const DATA_START = Table.Line.DATA_START;
    for (let i = 0; i < privates.data.length; i++) {
      // 删除首尾的方括号，boolean转换为0或1，以达到节省空间的目的
      // Remove the brackets at the two sides, convert boolean to 0 or 1 to save space
      lines[i + DATA_START] = JSON.stringify(privates.data[i], (key, value) => {
        switch (privates.types[key]) {
          case 'boolean':
            return value ? '1' : '0';
          case 'Date':
            return new Date(value).getTime();
          default:
            return value;
        }
      }).slice(1, -1);
    }
    writeFileSync(dbFilePath, lines.join('\n'), { encoding: 'utf-8' });
  }

  load(dbFilePath: string) {
    const privates = getPrivates(this);

    // 如果不存在就不加载了，作为一个空表
    if (!existsSync(dbFilePath)) {
      log(`File not found: '${dbFilePath}'. Loading as empty table`, 'load');
      return this;
    }

    const e = (msg: string) => err(msg, 'load');
    const content = readFileSync(dbFilePath, { encoding: 'utf-8' });
    const lines = content.split('\n');
    // 开始对比表结构。可能改代码时会调整字段顺序，故此处要做成映射再行对比
    // Start comparison of table structure. The field order may be adjusted when coding, so map it to an object for comparison
    const name = lines[Table.Line.NAME].replace('NAME: ', '');
    if (name !== privates.name) {
      throw e(`Table name mismatch, expected '${privates.name}', got '${name}'`);
    }
    const fields = lines[Table.Line.FIELDS].replace('FIELDS: ', '').split(',');
    if (privates.fields.length !== fields.length) {
      const used = `[${privates.fields.join()}](${privates.fields.length})`;
      const loaded = `[${fields.join()}](${fields.length})`;
      throw e(`Field count mismatch, expected '${used}', loaded '${loaded}'`);
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
      const index = privates.fields.findIndex((f) => f === fields[i]);
      if (index === -1) {
        const f = fields[i];
        const flds = privates.fields.join();
        throw e(`Loaded field '${f}' is not found in '${flds}'`);
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

    const readArray = (lineType: keyof typeof Table.Line) =>
      lines[Table.Line[lineType]]
        .replace(lineType + ': ', '')
        .split(',')
        .filter(Boolean);

    const read = (lineType: keyof typeof Table.Line) =>
      lines[Table.Line[lineType]].replace(lineType + ': ', '');

    // 逐个字段对比
    // Compare each configuration
    const types = readArray('TYPES');
    const nullables = readArray('NULLABLES').map((n) => n === '1');
    const defaults = (() => {
      const _default = JSON.parse(
        `{${lines[Table.Line.DEFAULTS].replace('DEFAULTS: ', '')}}`
      );
      const _defaultGetterType = JSON.parse(
        `{${lines[Table.Line.DEAFULT_GETTER_TYPE].replace('DEAFULT_GETTER_TYPE: ', '')}}`
      );
      const result = [] as Table.DefaultGetter[];
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
            throw e(`Invalid default value getter type: ${di}`);
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
      e(`'${prop}[${i}]->[${ti}]' mismatch, expected '${expected}', got '${got}'`);

    // # compare types, nullables, defaults
    for (let i = 0; i < fields.length; i++) {
      const ii = toThisIndex[i];

      if (types[i] !== privates.types[ii]) {
        mismatch('types', i, ii, privates.types[ii], types[i]);
      }

      if (nullables[i] !== privates.nullables[ii]) {
        mismatch('nullables', i, ii, privates.nullables[ii], nullables[i]);
      }

      // defaultGetter的对比相对复杂一些
      checker.sameDefaultGetter(privates.defaults[ii], defaults[i]);
    }

    // # compare isAI and pk
    if (isAI !== privates.isAI) {
      throw e(`'isAI' mismatch, expected '${privates.isAI}', got '${isAI}'`);
    }

    if (toThisIndex[pk] !== privates.pk) {
      const tpk = toThisIndex[pk];
      throw e(`'pk' mismatch, expected '${privates.pk}', got '${pk}->${tpk}'`);
    }

    // # compare indexes and uniques
    const thisIndexes = [...privates.indexMap.keys()];
    if (!isPermutated(indexes, thisIndexes)) {
      const ti = thisIndexes;
      throw e(`'indexes' mismatch, expected '${ti}', got '${indexes}'`);
    }

    const thisUniques = [...privates.uniqueMap.keys()];
    if (!isPermutated(uniques, thisUniques)) {
      const tu = thisUniques;
      throw e(`'uniques' mismatch, expected '${tu}', got '${uniques}'`);
    }

    if (Number.isNaN(autoIncrementId)) {
      throw e(`Loaded 'autoIncrementId' is NaN`);
    }

    privates.autoIncrementId = autoIncrementId;

    // 开始加载数据
    // Start loading data from file

    for (let i = Table.Line.DATA_START; i < lines.length; i++) {
      // 删除首尾的方括号
      const l = JSON.parse('[' + lines[i] + ']');
      const row = [] as Table.Row;
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
            throw e(`Invalid field type: ${types[j]}`);
        }
      }
      privates.data.push(row);
    }
    return this;
  }

  display() {
    const privates = getPrivates(this);
    console.log('tableName', privates.name);
    console.log({ pk: privates.pk, isAI: privates.isAI });
    console.log('fields  ', privates.fields);
    console.log('types   ', privates.types);
    console.log('defaults', privates.defaults);
    for (const f of privates.indexMap.keys()) {
      console.log(`indexes ${f}: ${privates.indexMap.get(f)?.size}`);
    }

    for (const f of privates.uniqueMap.keys()) {
      console.log(`uniques ${f}: ${privates.uniqueMap.get(f)?.size}`);
    }

    if (privates.data.length > 15) {
      console.log(
        'data    ',
        privates.data.slice(0, 5),
        `...${privates.data.length - 5} more`
      );
    } else {
      console.log('data    ', privates.data);
    }
  }
}
