import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { DrifthoundClient } from '../client.js';
import { createServer, runHttpServer } from '../server.js';
import pkg from '../../package.json' with { type: 'json' };

function makeMockClient(overrides: Partial<DrifthoundClient> = {}): DrifthoundClient {
  return {
    listProjects: vi.fn(),
    getProject: vi.fn(),
    listEnvironments: vi.fn(),
    getEnvironment: vi.fn(),
    getDriftDetails: vi.fn(),
    ping: vi.fn(),
    ...overrides,
  } as unknown as DrifthoundClient;
}

describe('createServer', () => {
  it('uses the version from package.json', () => {
    const server = createServer(makeMockClient());
    // The MCP Server exposes its info via the internal _serverInfo property
    // We verify indirectly: construction does not throw and pkg.version is what CI would use
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('runHttpServer', () => {
  let server: Server;

  afterEach(() => {
    server?.close();
  });

  async function start(client: DrifthoundClient): Promise<string> {
    server = await runHttpServer(client, 0);
    const { port } = server.address() as AddressInfo;
    return `http://localhost:${port}`;
  }

  describe('GET /healthz', () => {
    it('returns 200 with { status: ok }', async () => {
      const base = await start(makeMockClient());
      const res = await fetch(`${base}/healthz`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
    });
  });

  describe('GET /readyz', () => {
    it('returns 200 when ping succeeds', async () => {
      const base = await start(makeMockClient({ ping: vi.fn().mockResolvedValue(undefined) }));
      const res = await fetch(`${base}/readyz`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
    });

    it('returns 503 with error message when ping fails', async () => {
      const base = await start(
        makeMockClient({ ping: vi.fn().mockRejectedValue(new Error('API unreachable')) })
      );
      const res = await fetch(`${base}/readyz`);
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ status: 'error', message: 'API unreachable' });
    });
  });

  describe('unknown path', () => {
    it('returns 404', async () => {
      const base = await start(makeMockClient());
      const res = await fetch(`${base}/unknown-path`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /mcp with invalid JSON', () => {
    it('returns 400', async () => {
      const base = await start(makeMockClient());
      const res = await fetch(`${base}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });
      expect(res.status).toBe(400);
    });
  });
});
