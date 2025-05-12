import { MySQLAdapter } from "./mysql";
import { PostgreSQLAdapter } from "./postgresql";

export const adapters = {
  mysql: MySQLAdapter,
  postgresql: PostgreSQLAdapter,
};
