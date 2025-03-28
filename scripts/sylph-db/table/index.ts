import { existsSync, readFileSync, writeFileSync } from 'fs';
import { decompressSync } from '../brotli';
import { ensure } from './checkers';
import { Query, Table } from './types';
import { base64, diagnostics, isPermutated, recreateFn } from '../utils';
import { normalize, filter, initializer, privatar } from './privates';

const { err, log } = diagnostics('<Table>');

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
    const priv = createPrivates(this);
    priv.autoIncrementId = 0;
    priv.data = [];

    ensure.validTableName(o.tableName);
    priv.name = o.tableName;

    if (!Array.isArray(o.fields)) {
      throw err(
        `Expected 'fields' to be an array, but got '${typeof o.fields}'`,
        'constructor'
      );
    }

    const { fields, types, defaults, nullables, indexes, uniques, pk, isAI } =
      ensure.normalizeFieldOptions(Array.from(o.fields));

    priv.fields = fields;
    priv.fieldIndex = {} as Record<string, number>;
    for (let i = 0; i < fields.length; i++) {
      priv.fieldIndex[fields[i]] = i;
    }
    priv.types = types;
    priv.defaults = defaults;
    priv.nullables = nullables;
    priv.pk = pk;
    priv.isAI = isAI;
    priv.indexMap = new Map();
    priv.uniqueMap = new Map();
    priv.pkMap = new Map();
    initializer.indexes(priv, indexes);
    initializer.uniques(priv, uniques);
    initializer.pk(priv, fields[pk]);
  }

  find(condition: Query.Condition<T['fields']>): Table.Entity<T['fields']>[] {
    const priv = getPrivates(this);
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
    if (condFields.some((k) => !priv.fields.includes(k))) {
      throw e(`Invalid field detected. fields: ${condFields.join()}`);
    }

    // 校验condition字段是否符合设定的字段类型
    // Check if the condition fields are of the correct type
    for (let i = 0; i < condFields.length; i++) {
      const idx = priv.fieldIndex[condFields[i]];
      const v = condition[condFields[i]];
      const t = priv.types[idx];
      if (!priv.nullables[idx] && v === null) {
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
    const uniques = condFields.filter((k) => priv.uniqueMap.has(k));
    if (uniques.length > 0) {
      for (let i = 0; i < uniques.length; i++) {
        const m = priv.uniqueMap.get(uniques[i])!;
        const vkey = condition[uniques[i]];
        const row = m.get(vkey);
        if (row) {
          return filter(priv, [row], condition);
        }
      }
      // 走完了说明没找到，其实说明就没有了
      return [];
    }

    // 再试普通索引
    // Try the normal indexes
    const indexes = condFields.filter((k) => priv.indexMap.has(k));
    if (indexes.length > 0) {
      let shortestRows = [] as Table.Row[];
      for (let i = 0; i < indexes.length; i++) {
        // 根据字段indexValueMaps[i]找到了此字段索引映射，看看有没有符合的数据行
        // Found the index map of by field indexValueMaps[i], see if there are any matching data rows
        const m = priv.indexMap.get(indexes[i])!;
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
      return filter(priv, shortestRows, condition);
    }

    // 只能硬来了
    // Have to try it the hard way
    return filter(priv, priv.data, condition);
  }

  insert(row: Table.Entity<T['fields']>) {
    const priv = getPrivates(this);
    const newRow = [] as Table.Row;
    for (let i = 0; i < priv.fields.length; i++) {
      // 逐个字段校验
      newRow[i] = normalize(priv, row[priv.fields[i]], i);

      // 校验是否有重复的主键
      // Check for duplicate primary keys
      if (priv.pkMap.has(priv.fields[i])) {
        const m = priv.pkMap.get(priv.fields[i])!;
        if (m.has(newRow[i])) {
          const f = priv.fields[i];
          const nri = newRow[i];
          throw err(`Duplicate primary key! field:${f} value:${nri}`, 'insert');
        } else {
          m.set(newRow[i], newRow);
        }
      }

      // 校验是否有重复的唯一索引
      // Check for duplicate unique indexes
      if (priv.uniqueMap.has(priv.fields[i])) {
        const m = priv.uniqueMap.get(priv.fields[i])!;
        if (m.has(newRow[i])) {
          const f = priv.fields[i];
          const nri = newRow[i];
          throw err(`Duplicate unique value! field:${f} value:${nri}`, 'insert');
        } else {
          m.set(newRow[i], newRow);
        }
      }

      // 添加索引
      // Add indexes
      if (priv.indexMap.has(priv.fields[i])) {
        const m = priv.indexMap.get(priv.fields[i])!;
        let rows = m.get(newRow[i]);
        rows ? rows.push(newRow) : m.set(newRow[i], [newRow]);
      }
    }
    priv.data.push(newRow);
  }

  /**
   * 保存数据库结构、内容到文件中 \
   * 主要是内容，结构只是为了调用load的时候进行对比校验 \
   * Save the database structure and content to a file \
   * Content is the main point, saving structure is just for validation when calling 'load'
   * @param dbFilePath
   */
  save(dbFilePath: string) {
    const priv = getPrivates(this);
    // * 大部分时候字符串相加快于数组join，但此处需要精准按照枚举值Line排列每一行的内容
    // * Most of the time, adding string is faster than array join, but here we need to accurately arrange the content of each line according to 'DBTableFile'
    const lines = [] as string[];
    lines[Table.Line.NAME] = 'NAME: ' + priv.name;
    lines[Table.Line.FIELDS] = 'FIELDS: ' + priv.fields.join(',');
    lines[Table.Line.TYPES] = 'TYPES: ' + priv.types.join(',');
    lines[Table.Line.NULLABLES] =
      'NULLABLES: ' + priv.nullables.map((n) => (n ? '1' : '0')).join(',');

    // * 全部字符串化并转换为base64编码，防止出现换行符影响split
    // * Convert all defaultGetters to string and encode with base64 to prevent line breaks from affecting 'split'
    // 首尾加上大括号可以变成对象
    // Add braces at the beginning and end to make it an object
    lines[Table.Line.DEFAULTS] =
      'DEFAULTS: ' +
      priv.defaults.reduce((prev, getter, i) => {
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
      priv.defaults.reduce((prev, getter, i) => {
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
    lines[Table.Line.PRIMARY_KEY] = 'PRIMARY_KEY: ' + String(priv.pk);
    lines[Table.Line.IS_AI] = 'IS_AI: ' + (priv.isAI ? '1' : '0');
    lines[Table.Line.AUTO_INCREMENT_ID] =
      'AUTO_INCREMENT_ID: ' + String(priv.autoIncrementId);
    lines[Table.Line.INDEXES] = 'INDEXES: ' + [...priv.indexMap.keys()].join();
    lines[Table.Line.UNIQUES] = 'UNIQUES: ' + [...priv.uniqueMap.keys()].join();

    // 开始保存数据
    const DATA_START = Table.Line.DATA_START;
    for (let i = 0; i < priv.data.length; i++) {
      // 删除首尾的方括号，boolean转换为0或1，以达到节省空间的目的
      // Remove the brackets at the two sides, convert boolean to 0 or 1 to save space
      lines[i + DATA_START] = JSON.stringify(priv.data[i], (key, value) => {
        switch (priv.types[key]) {
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
    const priv = getPrivates(this);

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
    if (name !== priv.name) {
      throw e(`Table name mismatch, expected '${priv.name}', got '${name}'`);
    }
    const fields = lines[Table.Line.FIELDS].replace('FIELDS: ', '').split(',');
    if (priv.fields.length !== fields.length) {
      const used = `[${priv.fields.join()}](${priv.fields.length})`;
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
      const index = priv.fields.findIndex((f) => f === fields[i]);
      if (index === -1) {
        const f = fields[i];
        const flds = priv.fields.join();
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
            result[i] = recreateFn(base64.decode(_default[i]));
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

      if (types[i] !== priv.types[ii]) {
        mismatch('types', i, ii, priv.types[ii], types[i]);
      }

      if (nullables[i] !== priv.nullables[ii]) {
        mismatch('nullables', i, ii, priv.nullables[ii], nullables[i]);
      }

      // defaultGetter的对比相对复杂一些
      ensure.sameDefaultGetter(priv.defaults[ii], defaults[i]);
    }

    // # compare isAI and pk
    if (isAI !== priv.isAI) {
      throw e(`'isAI' mismatch, expected '${priv.isAI}', got '${isAI}'`);
    }

    if (toThisIndex[pk] !== priv.pk) {
      const tpk = toThisIndex[pk];
      throw e(`'pk' mismatch, expected '${priv.pk}', got '${pk}->${tpk}'`);
    }

    // # compare indexes and uniques
    const thisIndexes = [...priv.indexMap.keys()];
    if (!isPermutated(indexes, thisIndexes)) {
      const ti = thisIndexes;
      throw e(`'indexes' mismatch, expected '${ti}', got '${indexes}'`);
    }

    const thisUniques = [...priv.uniqueMap.keys()];
    if (!isPermutated(uniques, thisUniques)) {
      const tu = thisUniques;
      throw e(`'uniques' mismatch, expected '${tu}', got '${uniques}'`);
    }

    if (Number.isNaN(autoIncrementId)) {
      throw e(`Loaded 'autoIncrementId' is NaN`);
    }

    priv.autoIncrementId = autoIncrementId;

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
      priv.data.push(row);
    }
    return this;
  }

  display() {
    const priv = getPrivates(this);
    console.log('tableName', priv.name);
    console.log({ pk: priv.pk, isAI: priv.isAI });
    console.log('fields  ', priv.fields);
    console.log('types   ', priv.types);
    console.log('defaults', priv.defaults);
    for (const f of priv.indexMap.keys()) {
      console.log(`indexes ${f}: ${priv.indexMap.get(f)?.size}`);
    }

    for (const f of priv.uniqueMap.keys()) {
      console.log(`uniques ${f}: ${priv.uniqueMap.get(f)?.size}`);
    }

    if (priv.data.length > 15) {
      console.log('data    ', priv.data.slice(0, 5), `...${priv.data.length - 5} more`);
    } else {
      console.log('data    ', priv.data);
    }
  }
}
