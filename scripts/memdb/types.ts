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

export type DefaultGetter = Value | (() => Value);

export type TableConfig = {
  tableName: string;
  fields: FieldDefinition[];
};

export type FieldDefinition = {
  name: string;
  type: FieldType;
  default?: DefaultGetter;
  isNullable?: boolean;
  isIndex?: boolean;
  isUnique?: boolean;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
};

export type FindCondition<T extends readonly FieldDefinition[]> = {
  [K in T[number]['name']]?: FieldTypeMap[Extract<T[number], { name: K }>['type']];
};

export type Entity<T extends readonly FieldDefinition[]> = {
  // 可选项
  [K in T[number]['name']]?: FieldTypeMap[Extract<T[number], { name: K }>['type']];
} & {
  // 这些是必选
  [K in T[number]['name'] as Extract<T[number], { name: K }> extends
    | {
        isPrimaryKey: true;
        isAutoIncrement?: false;
      }
    | { isNullable: false; default?: undefined }
    ? K
    : never]: FieldTypeMap[Extract<T[number], { name: K }>['type']];
};

/**
 * 数据库文件每一行代表的含义 \
 * The meaning of each line in the database file
 */
export enum Line {
  /**
   * 表名
   */
  NAME,
  /**
   * 字段名
   */
  FIELDS,
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
  DEFAULTS,
  /**
   * 标记出这个默认值设定是否为一个函数 \
   * Default value of the field, can be a function
   */
  DEAFULT_GETTER_IS_FUNCTION,
  /**
   * 主键在fields数组的下标 \
   * The index of the primary key in the fields array
   */
  PRIMARY_KEY,
  /**
   * 是否自增主键 \
   * Whether it is an auto-increment primary key
   */
  IS_AI,
  /**
   * 记载自增主键加到哪里了 \
   * Now what id is
   */
  AUTO_INCREMENT_ID,
  /**
   * 索引字段名列表 \
   * Index field name list
   */
  INDEXES,
  /**
   * 唯一约束字段名列表 \
   * Unique constraint field name list
   */
  UNIQUES,
  /**
   * 数据开始行数 \
   * Data start line number
   */
  DATA_START,
}
