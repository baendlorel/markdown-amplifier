import { DBTable } from '../memdb/table';

const a = new DBTable({
  tableName: 'test_table',
  fields: [
    { name: 'id', type: 'number' },
    { name: 'uuid', type: 'string', isPrimaryKey: true, isAutoIncrement: true },
    { name: 'name', type: 'string' },
    { name: 'age', type: 'number', default: () => Math.random() * 20 },
    { name: 'sex', type: 'string', isUnique: true },
  ],
});

a.display();
