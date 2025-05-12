import { startServer } from './server';

const server = startServer(0);
console.log(`SERVER_PORT:${server.port}`); // Used in `native/src/main.rs`
