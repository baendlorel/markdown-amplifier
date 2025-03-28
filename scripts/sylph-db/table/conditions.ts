import { ensure } from './checkers';
import { Query, Table } from './types';

export const ensureFindOperator = (o: any): o is Query.FindOperator<Query.Operator> => {
  if (!o || typeof o !== 'object') {
    return false;
  }

  if (Query.Operator[o.type] === undefined) {
    return false;
  }

  if (Table.FILED_TYPE.includes(typeof o.value as Table.FieldType)) {
    return true;
  }

  if (typeof o.value === 'object' && (o.value instanceof Date || o.value === null)) {
    return true;
  }

  return false;
};

/** 等于（=）*/
export const Equal = (value: Table.Value) =>
  ({ type: Query.Operator.EQUAL, value } as Query.FindOperator<Query.Operator.EQUAL>);

/** 不等于（≠）*/
export const NotEqual = (value: Table.Value) =>
  ({
    type: Query.Operator.NOT_EQUAL,
    value,
  } as Query.FindOperator<Query.Operator.NOT_EQUAL>);

/** 大于（>）*/
export const GreaterThan = (value: Table.Value) => {
  ensure.comparable(value);
  return {
    type: Query.Operator.GREATER_THAN,
    value,
  } as Query.FindOperator<Query.Operator.GREATER_THAN>;
};

/** 小于（<）*/
export const LessThan = (value: Table.Value) => {
  ensure.comparable(value);
  return {
    type: Query.Operator.LESS_THAN,
    value,
  } as Query.FindOperator<Query.Operator.LESS_THAN>;
};

/** 大于等于（≥）*/
export const GreaterThanOrEqual = (value: Table.Value) => {
  ensure.comparable(value);
  return {
    type: Query.Operator.GREATER_THAN_OR_EQUAL,
    value,
  } as Query.FindOperator<Query.Operator.GREATER_THAN_OR_EQUAL>;
};

/** 小于等于（≤）*/
export const LessThanOrEqual = (value: Table.Value) => {
  ensure.comparable(value);
  return {
    type: Query.Operator.LESS_THAN_OR_EQUAL,
    value,
  } as Query.FindOperator<Query.Operator.LESS_THAN_OR_EQUAL>;
};

/** 在两个值之间 */
export const Between = (a: Table.Value, b: Table.Value) => {
  ensure.validInterval(a, b);
  return {
    type: Query.Operator.BETWEEN,
    value: [a, b],
  } as Query.FindOperator<Query.Operator.BETWEEN>;
};

/** 不在两个值之间 */
export const NotBetween = (a: Table.Value, b: Table.Value) => {
  ensure.validInterval(a, b);
  return {
    type: Query.Operator.NOT_BETWEEN,
    value: [a, b],
  } as Query.FindOperator<Query.Operator.NOT_BETWEEN>;
};

/** 模糊匹配（SQL LIKE 语法，支持 % 通配符）*/
export const Like = (value: Table.Value) => {
  ensure.isString(value);
  return { type: Query.Operator.LIKE, value } as Query.FindOperator<Query.Operator.LIKE>;
};

/** 在某个集合内 */
export const In = (value: Table.Value[]) => {
  return {
    type: Query.Operator.IN,
    value: ensure.isArray(value, { notEmpty: true, sameType: true }),
  } as Query.FindOperator<Query.Operator.IN>;
};

/** 不在某个集合内*/
export const NotIn = (value: Table.Value[]) => {
  return {
    type: Query.Operator.NOT_IN,
    value: ensure.isArray(value, { notEmpty: true, sameType: true }),
  } as Query.FindOperator<Query.Operator.NOT_IN>;
};
