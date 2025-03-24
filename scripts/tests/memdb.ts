import { DBTable } from '../memdb/table';

const a = new DBTable({
  tableName: 'test',
  fields: [
    { name: 'id', type: 'number', isPrimaryKey: true },
    { name: 'name', type: 'string' },
    { name: 'age', type: 'number', default: () => Math.random() * 20 },
    { name: 'sex', type: 'string', isUnique: true },
  ],
});

a.display();
