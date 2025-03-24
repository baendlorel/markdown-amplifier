export type Value = string | number | boolean | Date | null;

export const FILED_TYPE = ['string', 'number', 'boolean', 'Date'] as const;

export type FieldTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  Date: Date;
};

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
export enum DBFileLine {
  /**
   * 表名
   */
  TABLE_NAME,
  /**
   * 字段名
   */
  FIELD,
  /**
   * 字段类型，加载表文件、更新、插入的时候会检测 \
   * Field type, will be checked when loading, updating and inserting
   */
  TYPES,
  /**
   * 记录是否可为空 \
   * Whether the field can be null
   */
  NULLABLES,
  /**
   * 对应字段的默认值，可以是一个无参数函数 \
   * Default value of the field, can be a function without parameters
   */
  DEAFULTS,
  /**
   * 标记出这个默认值设定是否为一个函数 \
   * Default value of the field, can be a function
   */
  DEAFULT_GETTER_IS_FUNCTION,
  PRIMARY_KEY,
  IS_AUTO_INCREMENT,
  /**
   * 记载自增主键加到哪里了 \
   * Now what id is
   */
  AUTO_INCREMENT_ID,
  INDEXES,
  UNIQUES,
  /**
   * 数据开始行数 \
   * Data start line number
   */
  DATA_START,
}
