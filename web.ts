import { spawn } from 'child_process';
import { join } from 'path';
import { createServer } from 'vite';

import { startServer } from './server';

const isProduction = process.env.NODE_ENV === 'production';

async function startDevServer(port: number) {
  if (isProduction) {
    startServer(port);
  } else {
    // Development: start backend as a child process
    const api = spawn('bun', ['run', 'web.ts', '--backend-only'], {
      env: { ...process.env, BACKEND_ONLY: 'true' },
      stdio: 'inherit', // Share console output
    });

    // Development: start Vite
    const vite = await createServer({
      configFile: join(process.cwd(), 'vite.config.ts'),
    });
    await vite.listen();
    console.log(`[VITE] Dev server running at http://localhost:${port}`);

    // Cleanup on exit
    process.on('SIGINT', () => {
      api.kill();
      vite.close();
      process.exit();
    });
  }
}

if (process.env.BACKEND_ONLY === 'true') {
  startServer(3001);
} else {
  startDevServer(3000);
}
