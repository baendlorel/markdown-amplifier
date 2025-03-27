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

export type TablePrivate = {
  name: string;

  /**
   * 字段，本可以写成构造器里那样的配置数组，但由于要用到typeof this.fields，所以只能这样写了 \
   * Fields, could be written as a configuration array in the constructor, but because 'typeof this.fields' is used, there is no other way
   */
  fields: string[];

  /**
   * 字段类型，包含string、number、boolean、Date \
   * Field types, including string, number, boolean, Date
   */
  types: FieldType[];

  /**
   * 标记是否可为空 \
   * Mark whether it can be null
   */
  nullables: boolean[];

  /**
   * 字段默认值或默认值获取函数 \
   * Field default value or default value getter function
   */
  defaults: DefaultGetter[];

  // DEAFULT_GETTER_IS_FUNCTION

  /**
   * 代表主键在fields的下标 \
   * The index of the primary key in fields
   */
  pk: number;

  /**
   * 是否为自增 \
   * Whether it is auto-increment
   */
  isAI: boolean;

  /**
   * 自增主键到几了 \
   * Current auto-increment primary key
   */
  autoIncrementId: number;

  /**
   * Map<索引字段名,Map<索引字段值，多个数据行>> \
   * Map<Index Field Name, Map<Index Field Value, Data Rows>>
   */
  indexMap: Map<string, Map<Value, Row[]>>;

  /**
   * Map<索引字段名,Map<索引字段值，数据行>> \
   * Map<Index Field Name, Map<Index Field Value, Data Row>>
   */
  uniqueMap: Map<string, Map<Value, Row>>;

  pkMap: Map<string, Map<Value, Row>>;

  /**
   * 获取某个字段的下标在第几位，用来根据字段获取row里对应的字段值 \
   * Get the index of a field, used to get the value of this field from a row
   */
  fieldIndex: Record<string, number>;

  /**
   * 数据
   */
  data: Row[];
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
  DEAFULT_GETTER_TYPE,
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
