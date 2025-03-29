import { diagnostics } from '../utils';

export namespace Table {
  // # used for creating

  export type Config = {
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

  // # used for running
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

  export type IndexValueMap = Map<Value, Row[]>;
  export type UniqueValueMap = Map<Value, Row>;
  export type IndexMap = Map<string, IndexValueMap>;
  export type UniqueMap = Map<string, UniqueValueMap>;

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

  export type Private = {
    /**
     * 表名 \
     * Name of this table
     */
    name: string;

    /**
     * 字段名称 \
     * Names of the fields
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
     * Map<Index Field Name, Map<Index Value, Data Rows>>
     */
    indexMap: IndexMap;

    /**
     * Map<索引字段名,Map<索引字段值，数据行>> \
     * Map<Unique Field Name, Map<Unique Value, Data Row>>
     */
    uniqueMap: UniqueMap;

    pkMap: UniqueMap;

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
}

export namespace Query {
  export type Condition<T extends readonly Table.FieldDefinition[]> = {
    [K in T[number]['name']]?: Table.FieldTypeMap[Extract<
      T[number],
      { name: K }
    >['type']];
  };

  export type RawCondition<T extends readonly Table.FieldDefinition[]> = {
    [K in T[number]['name']]?:
      | Table.FieldTypeMap[Extract<T[number], { name: K }>['type']]
      | {
          type: Operator;
          value: Table.FieldTypeMap[Extract<T[number], { name: K }>['type']];
        };
  };

  export type OperatorCondition<T extends readonly Table.FieldDefinition[]> = {
    [K in T[number]['name']]?: {
      type: Operator;
      value: Table.FieldTypeMap[Extract<T[number], { name: K }>['type']];
    };
  };

  export enum Operator {
    EQUAL,
    LIKE,
    IN,
    GREATER_THAN,
    GREATER_THAN_OR_EQUAL,
    LESS_THAN,
    LESS_THAN_OR_EQUAL,
    BETWEEN,
    NOT_EQUAL,
    NOT_LIKE,
    NOT_BETWEEN,
    NOT_IN,
  }

  export type FindOperator<T extends Operator> = {
    type: T;
    value: T extends Operator.IN | Operator.NOT_IN
      ? Table.Value[]
      : T extends
          | Operator.GREATER_THAN
          | Operator.LESS_THAN
          | Operator.GREATER_THAN_OR_EQUAL
          | Operator.LESS_THAN_OR_EQUAL
      ? number | Date
      : T extends Operator.BETWEEN | Operator.NOT_BETWEEN
      ? [Date, Date] | [number, number]
      : Table.Value;
  };
}

const { err } = diagnostics('Table.Type');

/**
 * 支持的值有string、boolean、number、null、Date，返回对应的类型 \
 * Supported values are string, boolean, number, null, Date, return the corresponding type
 * @param value
 * @returns  'string' | 'boolean' | 'number' | 'null' | 'Date'
 */
export const getType = (
  value: Table.Value | Table.Value[]
): 'string' | 'boolean' | 'number' | 'null' | 'Date' => {
  if (value === null) {
    return 'null';
  }

  // TODO 梳理所有需要判定类型的位置，最好能够统一处理方式
  // TODO 这里要考虑到是数组的情形，如果数组每个类型不一致，要报错
  const t = typeof value;
  switch (t) {
    case 'string':
    case 'number':
    case 'boolean':
      return t;
    case 'object':
      if (value instanceof Date) {
        return 'Date';
      }
    default:
      throw err(`Invalid value type: ${value}[${t}]`, 'getType');
  }
};
