import { DBTable } from '../memdb/table';

const a = new DBTable({
  tableName: 'test',
  fields: [
    { name: 'id', type: 'number', isPrimaryKey: true },
    { name: 'name', type: 'string' },
    { name: 'age', type: 'number' },
    { name: 'sex', type: 'string' },
  ],
});

a.display();
