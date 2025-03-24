// TODO 数据库文件要写成第一行字段名，第二行字段类型，第三行索引，第四行唯一索引，第五行往后是数据
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
