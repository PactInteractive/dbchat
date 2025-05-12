import { file, serve } from 'bun';
import { join } from 'path';
import * as pathern from 'pathern';
import { ZodError } from 'zod';

import * as apiKeys from './api/apiKeys';
import * as chats from './api/chats';
import * as databases from './api/databases';
import { BadRequestError, MethodNotAllowedError, NotFoundError } from './api/errors';
import * as ping from './api/ping';
import * as query from './api/query';
import * as settings from './api/settings';
import { Handler } from './api/types';

// Environment
const isProduction = process.env.NODE_ENV === 'production';
const root = isProduction ? join(process.cwd(), 'web', 'dist') : join(process.cwd(), 'web');

// Server
export function startServer(port: number) {
  const server = serve({
    port,
    idleTimeout: 30,
    async fetch(request) {
      const url = new URL(request.url);
      console.log(`[BUN] ${request.method} ${url.pathname}`); // Logging

      // Handle OPTIONS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, statusText: 'No Content' });
      }

      // Routes
      // ------------------------------
      const routeHandlerGroups = [apiKeys, chats, databases, query, ping, settings];
      for (const routeHandlerGroup of routeHandlerGroups) {
        const routeHandlers: Handler<any, any>[] = Object.values(routeHandlerGroup);
        let routeMatched = false;

        for (const handler of routeHandlers) {
          if (handler.action === url.pathname || pathern.matches(handler.action, url.pathname)) {
            routeMatched = true;
            if (handler.method === request.method) {
              // 1. Gather, validate, and process input
              const params = pathern.extract(handler.action, url.pathname);
              const payload = ['POST', 'PUT', 'PATCH'].includes(request.method) ? await request.json() : {};
              const result = await handler.handle(handler.schema.parse({ ...payload, ...params }));

              // 2. Determine base status
              // NOTE: DELETE should be 204 idiomatically, but that leads to mysterious errors on native
              const status = { POST: 201, DELETE: 200 }[request.method] || 200;
              const statusText = { 200: 'OK', 201: 'Created', 204: 'No Content' }[status];

              // 3. Construct Response
              // Use new Response for custom headers
              if (handler.headers) {
                return new Response(result, { status, statusText, headers: handler.headers });
              } else {
                return Response.json(result ?? {}, { status, statusText });
              }
            }
          }
        }

        // If the route matched, but didn't return a response - no method matched, throw an error
        if (routeMatched) {
          throw new MethodNotAllowedError(request.method);
        }
      }
      // ------------------------------

      // Files
      // ------------------------------
      const path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      switch (request.method) {
        case 'GET':
          const f = file(join(root, path));
          if (await f.exists()) {
            return new Response(f);
          } else {
            return new Response(file(join(root, 'index.html')));
          }
        default:
          throw new NotFoundError();
      }
      // ------------------------------
    },
    error(error) {
      console.error('[ERROR]', error);

      if (error instanceof ZodError) {
        return Response.json(error.formErrors, { status: 400, statusText: 'Bad Request' });
      }

      if (error instanceof BadRequestError) {
        return new Response(error.message, { status: 400, statusText: 'Bad Request' });
      }

      if (error instanceof NotFoundError) {
        return new Response(error.message, { status: 404, statusText: 'Not Found' });
      }

      if (error instanceof MethodNotAllowedError) {
        return new Response(error.message, { status: 405, statusText: 'Method Not Allowed' });
      }

      return new Response(null, { status: 500, statusText: 'Internal Server Error' });
    },
  });
  console.log(`[BUN] Server running at http://localhost:${server.port}`);

  return server;
}
