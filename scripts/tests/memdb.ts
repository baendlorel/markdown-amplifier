import { DBTable } from '../memdb/table';

console.time('建表');
const a = new DBTable({
  tableName: 'test_table',
  fields: [
    { name: 'id', type: 'number', isPrimaryKey: true, isAutoIncrement: true },
    { name: 'uuid', type: 'string' },
    { name: 'name', type: 'string', isUnique: true },
    { name: 'age', type: 'number', default: () => Math.ceil(Math.random() * 20) },
    { name: 'sex', type: 'string' },
  ],
  data: [],
});
console.timeEnd('建表');

const incr = (() => {
  let i = 0;
  return () => (++i).toString(36).padStart(8, '0');
})();

const SIZE = 100_0000;
console.time(`插表${SIZE}个`);
for (let i = 0; i < 100_0000; i++) {
  a.insert({ name: incr(), sex: Math.random() > 0.5 ? '男' : '女' });
}
console.timeEnd(`插表${SIZE}个`);

a.display();
