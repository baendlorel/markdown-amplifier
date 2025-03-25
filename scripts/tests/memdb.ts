import { DBTable } from '../memdb/table';

const a = new DBTable({
  tableName: 'test_table',
  fields: [
    { name: 'id', type: 'number', isPrimaryKey: true, isAutoIncrement: true },
    { name: 'uuid', type: 'string' },
    { name: 'name', type: 'string', isUnique: true },
    { name: 'age', type: 'number', default: () => Math.random() * 20 },
    { name: 'sex', type: 'string' },
  ],
});

a.insert({ name: 'asd', sex: '男' });
a.insert({ name: 'asd2', sex: '男' });
a.insert({ name: 'asd4', sex: '男' });

a.display();
