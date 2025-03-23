import { decompressSync } from './brotli';

export class DBTable {
  save: (dbFilePath: string) => void;
  private fields: string[];
  private data: (string | number)[][];
  private indexes: { [key: string]: number[] } = {};

  constructor(fields: string[], data: (string | number)[][]) {
    this.fields = fields;
    this.data = data;
  }

  insert(row: (string | number)[]): void {
    this.data.push(row);
  }

  static from(dbFilePath: string): DBTable {
    const str = decompressSync(dbFilePath);
    const obj = JSON.parse(str);
    return new DBTable(obj.fields, obj.data);
  }
}
