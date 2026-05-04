import { createServer as createHttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import pkg from '../package.json' with { type: 'json' };
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { DrifthoundClient } from './client.js';
import { tools, handleToolCall } from './tools/index.js';

export function createServer(client: DrifthoundClient): Server {
  const server = new Server(
    {
      name: 'drifthound-mcp',
      version: pkg.version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return handleToolCall(
      client,
      request.params.name,
      request.params.arguments as Record<string, unknown> | undefined
    );
  });

  return server;
}

export async function runServer(client: DrifthoundClient): Promise<void> {
  const server = createServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}

export async function runHttpServer(
  client: DrifthoundClient,
  port: number
): Promise<ReturnType<typeof createHttpServer>> {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  const httpServer = createHttpServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);

      if (url.pathname !== '/healthz' && url.pathname !== '/readyz') {
        const start = Date.now();
        res.on('finish', () => {
          console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            method: req.method,
            path: url.pathname,
            status: res.statusCode,
            durationMs: Date.now() - start,
          }));
        });
      }

      if (url.pathname === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      if (url.pathname === '/readyz') {
        try {
          await client.ping();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch (err) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: (err as Error).message }));
        }
        return;
      }

      if (url.pathname !== '/mcp') {
        res.writeHead(404);
        res.end();
        return;
      }

      let body: unknown;
      if (req.method === 'POST') {
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', resolve);
          req.on('error', reject);
        });
        const raw = Buffer.concat(chunks).toString('utf-8');
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return;
          }
        }
      }

      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      if (!sessionId) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });
        transport.onclose = () => {
          if (transport.sessionId) transports.delete(transport.sessionId);
        };
        const server = createServer(client);
        await server.connect(transport);
        await transport.handleRequest(req, res, body);
        if (transport.sessionId) transports.set(transport.sessionId, transport);
        return;
      }

      const transport = transports.get(sessionId);
      if (!transport) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found' }));
        return;
      }

      await transport.handleRequest(req, res, body);
    } catch (err) {
      console.error('HTTP handler error:', err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end();
      }
    }
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      console.error(`DriftHound MCP server (HTTP) listening on port ${port}`);
      resolve();
    });
  });

  process.on('SIGINT', () => { httpServer.close(); process.exit(0); });
  process.on('SIGTERM', () => { httpServer.close(); process.exit(0); });

  return httpServer;
}
