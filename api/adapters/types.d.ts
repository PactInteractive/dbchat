export interface DatabaseStructure {
  tables: Table[];
}

export interface Table {
  table_name: string;
  columns: Column[];
}

export interface Column {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  nullable: 'NOT NULL' | 'NULLABLE';
  constraint_type: 'PRIMARY KEY' | 'FOREIGN KEY' | '';
}
