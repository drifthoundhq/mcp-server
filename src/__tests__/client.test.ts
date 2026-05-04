import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DrifthoundClient } from '../client.js';

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('DrifthoundClient', () => {
  let client: DrifthoundClient;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    client = new DrifthoundClient('https://api.example.com', 'test-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('strips trailing slash from base URL', async () => {
      client = new DrifthoundClient('https://api.example.com/', 'tok');
      vi.mocked(fetch).mockResolvedValueOnce(ok([]));
      await client.listProjects();
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects');
    });
  });

  describe('listProjects', () => {
    it('calls /api/v1/projects without params when no filter given', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(ok([]));
      await client.listProjects();
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/projects',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      );
    });

    it('adds with_drift=true when filter is drift', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(ok([]));
      await client.listProjects('drift');
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects?with_drift=true');
    });

    it('adds with_issues=true when filter is issues', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(ok([]));
      await client.listProjects('issues');
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects?with_issues=true');
    });
  });

  describe('getProject', () => {
    it('URL-encodes special characters in the project key', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(ok({}));
      await client.getProject('my project/key');
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects/my%20project%2Fkey');
    });
  });

  describe('listEnvironments', () => {
    it('calls without status param when not provided', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(ok([]));
      await client.listEnvironments('my-project');
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects/my-project/environments');
    });

    it('appends status param when provided', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(ok([]));
      await client.listEnvironments('my-project', 'drift');
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe(
        'https://api.example.com/api/v1/projects/my-project/environments?status=drift'
      );
    });
  });

  describe('getDriftDetails', () => {
    it('URL-encodes both project and environment keys', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(ok({}));
      await client.getDriftDetails('my project', 'prod/env');
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe(
        'https://api.example.com/api/v1/projects/my%20project/environments/prod%2Fenv/drift'
      );
    });
  });

  describe('error handling', () => {
    it('throws with the API error message on non-ok response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(err(404, { error: 'Project not found' }));
      await expect(client.getProject('missing')).rejects.toThrow('Project not found');
    });

    it('falls back to HTTP status text when no error field in body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(err(500, {}));
      await expect(client.getProject('x')).rejects.toThrow('HTTP 500');
    });
  });

  describe('ping', () => {
    it('calls /up and resolves on 200', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(ok(''));
      await expect(client.ping()).resolves.toBeUndefined();
      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('https://api.example.com/up');
    });

    it('throws when /up returns a non-ok status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503, statusText: 'Service Unavailable' }));
      await expect(client.ping()).rejects.toThrow('503');
    });
  });
});
