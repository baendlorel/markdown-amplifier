import { decompressSync } from './brotli';

type Value = string | number;

export class DBTable {
  save: (dbFilePath: string) => void;

  /**
   * 字段
   */
  private fields: string[];

  /**
   * 数据
   */
  private data: Value[][];

  /**
   * Map<索引字段名,Map<索引字段值，多个数据行>> \
   * Map<Index Field Name, Map<Index Field Value, Data Rows>>
   */
  private indexMap: Map<string, Map<Value, Value[][]>>;

  private uniqueMap: Map<string, Map<Value, Value[]>>;

  constructor(o: any) {
    this.fields = o.fields;
    this.data = o.data;
    this.indexMap = new Map();
    this.uniqueMap = new Map();
  }

  private initIndexes(fields: (typeof this.fields)[number][]) {
    // 首先要校验索引组是否都在fields内
    if (fields.some((idx) => !this.fields.includes(idx))) {
      throw new Error('[MemDB] Index field not found in fields');
    }

    /**
     * 把索引字段转换为索引字段在fields中的位置 \
     * Convert index fields to their positions in fields
     */
    const iti = {} as { [k in (typeof this.fields)[number]]: number };
    for (let i = 0; i < fields.length; i++) {
      const idx = fields[i];
      iti[idx] = this.fields.findIndex((f) => f === idx);
      this.indexMap.set(idx, new Map());
    }

    // 遍历全表，建立索引
    // Traverse the entire table and build indexes
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      for (let j = 0; j < fields.length; j++) {
        // 上面已经初始化过，这里一定是有的
        // As initialized above, 'get' must return a no undefined value here
        const indexValueMap = this.indexMap.get(fields[j]) as Map<Value, Value[][]>;
        const vKey = row[iti[fields[j]]];
        let rows = indexValueMap.get(vKey);
        if (!rows) {
          rows = [] as Value[][];
          indexValueMap.set(vKey, []);
        }
        rows.push(row);
      }
    }
  }

  private initUnique(fields: (typeof this.fields)[number][]) {
    // 首先要校验索引组是否都在fields内
    if (fields.some((idx) => !this.fields.includes(idx))) {
      throw new Error('[MemDB] Index field not found in fields');
    }

    /**
     * 把索引字段转换为索引字段在fields中的位置 \
     * Convert index fields to their positions in fields
     */
    const iti = {} as { [k in (typeof this.fields)[number]]: number };
    for (let i = 0; i < fields.length; i++) {
      const idx = fields[i];
      iti[idx] = this.fields.findIndex((f) => f === idx);
      this.uniqueMap.set(idx, new Map());
    }

    // 遍历全表，建立索引
    // Traverse the entire table and build indexes
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      for (let j = 0; j < fields.length; j++) {
        // 上面已经初始化过，这里一定是有的
        // As initialized above, 'get' must return a no undefined value here
        const uniqueValueMap = this.uniqueMap.get(fields[j]) as Map<Value, Value[]>;
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

  find(condition: { [k in (typeof this.fields)[number]]: Value }): Value[] {
    if (!condition || typeof condition !== 'object') {
      throw new Error('[MemDB] Condition must be an object with fields and values');
    }
    // 校验字段是否可用
    // Check if the fields are available
    const fields = Object.keys(condition);
    if (fields.some((k) => !this.fields.includes(k))) {
      throw new Error(`[MemDB] Invalid field detected. fields: ${fields.join()}`);
    }

    // 把所有的索引字段找到
    // Find all index fields
    const indexFields = fields.filter((k) => this.indexMap.has(k));
    if (indexFields.length > 0) {
    }

    return [];
  }

  insert(row: (string | number)[]): void {
    this.data.push(row);
  }

  static from(dbFilePath: string): DBTable {
    try {
      const str = decompressSync(dbFilePath);
      const o = JSON.parse(str);
      return new DBTable(o);
    } catch (error) {
      console.log('Failed to load DBTable from file:', dbFilePath);
      console.error(error);
      return new DBTable({ fields: [], data: [], indexes: [] });
    }
  }
}
