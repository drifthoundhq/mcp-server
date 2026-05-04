import { describe, it, expect } from 'vitest';
import type { Environment } from '../../types.js';
import { listEnvironments } from '../../tools/list-environments.js';

function makeClient(envs: Environment[]) {
  return { listEnvironments: async () => envs } as never;
}

const base: Environment = {
  key: 'prod',
  name: 'Production',
  status: 'drift',
  directory: 'envs/prod',
  last_checked_at: '2024-01-15T10:00:00Z',
  last_drift_check: { id: 1, status: 'drift', add_count: 0, change_count: 2, destroy_count: 0, duration: 30, execution_number: 5, created_at: '2024-01-15T10:00:00Z', change_summary: '2 resources to change' },
};

describe('listEnvironments', () => {
  it('returns empty message when no environments found', async () => {
    const result = await listEnvironments(makeClient([]), { project_key: 'eks' });
    expect(result).toBe("No environments found in project 'eks'.");
  });

  it('returns filtered empty message when status filter given', async () => {
    const result = await listEnvironments(makeClient([]), { project_key: 'eks', status: 'error' });
    expect(result).toBe("No environments with status 'error' found in project 'eks'.");
  });

  it('shows status filter note when filtering', async () => {
    const result = await listEnvironments(makeClient([base]), { project_key: 'eks', status: 'drift' });
    expect(result).toContain('Filtered by status: drift');
  });

  it('uses ⚠ for drift, ✓ for ok, ✗ for error, ? for unknown', async () => {
    const statuses = [
      { status: 'drift' as const, icon: '⚠' },
      { status: 'ok' as const, icon: '✓' },
      { status: 'error' as const, icon: '✗' },
      { status: 'unknown' as const, icon: '?' },
    ];
    for (const { status, icon } of statuses) {
      const result = await listEnvironments(makeClient([{ ...base, status }]), { project_key: 'p' });
      expect(result).toContain(icon);
    }
  });

  it('includes change_summary when present in last drift check', async () => {
    const result = await listEnvironments(makeClient([base]), { project_key: 'eks' });
    expect(result).toContain('2 resources to change');
  });
});
