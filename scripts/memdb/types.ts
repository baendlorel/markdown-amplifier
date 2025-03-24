export type Value = string | number | boolean | null | undefined;

export const FILED_TYPE = ['string', 'number', 'boolean', 'Date'] as const;

export type FieldType = (typeof FILED_TYPE)[number];

export type Row = Value[];

export type RowObject<T extends string[]> = { [k in T[number]]: Value };

export type DefaultGetter = Value | (() => Value);

export type FieldOption = {
  name: string;
  type: FieldType;
  default?: DefaultGetter;
  isNullable?: boolean;
  isIndex?: boolean;
  isUnique?: boolean;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
};

export type MemDBTableCreateOption = {
  tableName: string;
  fields: FieldOption[];
};

/**
 * 数据库文件每一行代表的含义 \
 * The meaning of each line in the database file
 */
export enum Line {
  /**
   * 字段名 \
   * Field name
   */
  FIELD,
  /**
   * 对应字段的默认值，可以是一个无参数函数 \
   * Default value of the field, can be a function without parameters
   */
  DEAFULT_VALUE,
  /**
   * 标记出这个默认值设定是否为一个函数 \
   * Default value of the field, can be a function
   */
  DEAFULT_VALUE_IS_FUNCTION,
  /**
   * 字段类型，加载表文件、更新、插入的时候会检测 \
   * Field type, will be checked when loading, updating and inserting data
   */
  FIELD_TYPE,
  /**
   * 主键 \
   * Primary key
   */
  PRIMARY_KEY,
  /**
   * 索引 \
   * Index
   */
  INDEX,
  /**
   * 唯一索引 \
   * Unique index
   */
  UNIQUE,
  /**
   * 数据开始行数 \
   * Data start line number
   */
  DATA_START,
}
