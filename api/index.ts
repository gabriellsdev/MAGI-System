import type { IncomingMessage, ServerResponse } from 'node:http';
import { createMagiRequestHandler } from '../src/server/server.js';

const handler = createMagiRequestHandler();

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  return handler(req, res);
}
