import { describe, it, expect, vi } from 'vitest';
import type { DrifthoundClient } from '../../client.js';
import { handleToolCall } from '../../tools/index.js';

function makeClient(): DrifthoundClient {
  return {
    listProjects: vi.fn().mockResolvedValue([]),
    getProject: vi.fn(),
    listEnvironments: vi.fn().mockResolvedValue([]),
    getEnvironment: vi.fn().mockResolvedValue({ key: 'prod', name: 'Production', status: 'ok', directory: null, last_checked_at: null, last_drift_check: null }),
    getDriftDetails: vi.fn().mockResolvedValue({ id: 1, status: 'ok', add_count: 0, change_count: 0, destroy_count: 0, duration: null, execution_number: 1, created_at: '2024-01-01', change_summary: null, raw_output: null, environment_key: 'prod', project_key: 'eks' }),
    ping: vi.fn(),
  } as unknown as DrifthoundClient;
}

describe('handleToolCall', () => {
  it('returns an error for an unknown tool', async () => {
    const result = await handleToolCall(makeClient(), 'no_such_tool', {});
    expect(result.content[0].text).toBe('Error: Unknown tool: no_such_tool');
  });

  it('always returns content array with a text entry', async () => {
    const result = await handleToolCall(makeClient(), 'list_projects_with_drift', undefined);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
  });

  describe('list_environments', () => {
    it('returns error when project_key is missing', async () => {
      const result = await handleToolCall(makeClient(), 'list_environments', {});
      expect(result.content[0].text).toBe('Error: project_key is required');
    });

    it('passes project_key and optional status to the tool', async () => {
      const client = makeClient();
      await handleToolCall(client, 'list_environments', { project_key: 'eks', status: 'drift' });
      expect(client.listEnvironments).toHaveBeenCalledWith('eks', 'drift');
    });
  });

  describe('get_drift_details', () => {
    it('returns error when project_key is missing', async () => {
      const result = await handleToolCall(makeClient(), 'get_drift_details', {});
      expect(result.content[0].text).toBe('Error: project_key is required');
    });

    it('returns error when environment_key is missing', async () => {
      const result = await handleToolCall(makeClient(), 'get_drift_details', { project_key: 'eks' });
      expect(result.content[0].text).toBe('Error: environment_key is required');
    });

    it('calls getDriftDetails with both keys', async () => {
      const client = makeClient();
      await handleToolCall(client, 'get_drift_details', { project_key: 'eks', environment_key: 'prod' });
      expect(client.getDriftDetails).toHaveBeenCalledWith('eks', 'prod');
    });
  });

  describe('get_environment_info', () => {
    it('returns error when project_key is missing', async () => {
      const result = await handleToolCall(makeClient(), 'get_environment_info', {});
      expect(result.content[0].text).toBe('Error: project_key is required');
    });

    it('calls getEnvironment with both keys', async () => {
      const client = makeClient();
      await handleToolCall(client, 'get_environment_info', { project_key: 'eks', environment_key: 'prod' });
      expect(client.getEnvironment).toHaveBeenCalledWith('eks', 'prod');
    });
  });
});
