import { Table } from '../memdb/table';

console.time('建表');
const a = new Table({
  tableName: 'test_table',
  fields: [
    { name: 'id', type: 'number', isPrimaryKey: true, isAutoIncrement: true },
    { name: 'uuid', type: 'string', default: Table.UUIDv4 },
    { name: 'name', type: 'string', isUnique: true },
    { name: 'age', type: 'number', default: () => Math.ceil(Math.random() * 20) },
    { name: 'rich', type: 'boolean', default: false },
    { name: 'sex', type: 'string' },
    { name: 'createDate', type: 'Date', default: () => new Date() },
  ] as const,
});
console.timeEnd('建表');

const testInsert = (size: number) => {
  const incr = (() => {
    let i = 0;
    return () => (++i).toString(36).padStart(8, '0');
  })();

  let howManyMen = 0;
  console.time(`插表${size}个`);
  for (let i = 0; i < size; i++) {
    if (Math.random() > 0.5) {
      a.insert({ name: incr(), sex: '男' });
      howManyMen++;
    } else {
      a.insert({ name: incr(), sex: '女' });
    }
  }
  console.log('总共男人:' + howManyMen);
  console.timeEnd(`插表${size}个`);
};

const testFind = (times: number) => {
  console.time(`查询无索引${times}次`);
  for (let i = 0; i < times; i++) {
    const t = a.find({ sex: '男' });
    if (i === 0) {
      console.log('性别为男数量:' + t.length);
    }
  }
  console.timeEnd(`查询无索引${times}次`);

  console.time(`有索引${times}次`);
  for (let i = 0; i < times; i++) {
    const t = a.find({ name: '2' });
    if (i === 0) {
      console.log('name记录数量:' + t.length);
    }
  }
  console.timeEnd(`有索引${times}次`);
};

testInsert(10);
a.save('/home/aldia/projects/personal/markdown-amplifier/scripts/tests/db.txt');
// a.load('/home/aldia/projects/personal/markdown-amplifier/scripts/tests/db.txt');
a.display();
