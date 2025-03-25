import { DBTable } from '../memdb/table';

console.time('建表');
const a = new DBTable({
  tableName: 'test_table',
  fields: [
    { name: 'id', type: 'number', isPrimaryKey: true, isAutoIncrement: true },
    { name: 'uuid', type: 'string', default: DBTable.UUIDv4 },
    { name: 'name', type: 'string', isUnique: true },
    { name: 'age', type: 'number', default: () => Math.ceil(Math.random() * 20) },
    { name: 'sex', type: 'string' },
    { name: 'createDate', type: 'Date', default: () => new Date() },
  ] as const,
});
console.timeEnd('建表');

const incr = (() => {
  let i = 0;
  return () => (++i).toString(36).padStart(8, '0');
})();

const SIZE = 100;
let howManyMen = 0;
console.time(`插表${SIZE}个`);
for (let i = 0; i < SIZE; i++) {
  if (Math.random() > 0.5) {
    a.insert({ name: incr(), sex: '男' });
    howManyMen++;
  } else {
    a.insert({ name: incr(), sex: '女' });
  }
}
console.log('总共男人:' + howManyMen);
console.timeEnd(`插表${SIZE}个`);

const TIMES = 10;
console.time(`查询无索引${TIMES}次`);
for (let i = 0; i < TIMES; i++) {
  const t = a.find({ sex: '男' });
  if (i === 0) {
    console.log('性别为男数量:' + t.length);
  }
}
console.timeEnd(`查询无索引${TIMES}次`);

console.time(`有索引${TIMES}次`);
for (let i = 0; i < TIMES; i++) {
  const t = a.find({ name: '2' });
  if (i === 0) {
    console.log('name记录数量:' + t.length);
  }
}
console.timeEnd(`有索引${TIMES}次`);

a.save('/home/aldia/projects/personal/markdown-amplifier/scripts/tests/db.txt');
a.display();
