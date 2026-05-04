import { describe, it, expect } from 'vitest';
import type { Environment } from '../../types.js';
import { getEnvironmentInfo } from '../../tools/get-environment-info.js';

function makeClient(env: Environment) {
  return { getEnvironment: async () => env } as never;
}

const base: Environment = {
  key: 'prod',
  name: 'Production',
  status: 'drift',
  directory: 'envs/prod',
  last_checked_at: '2024-01-15T10:00:00Z',
  project: {
    key: 'eks',
    name: 'EKS',
    repository: 'https://github.com/org/infra',
    branch: 'main',
  },
  last_drift_check: {
    id: 1,
    status: 'drift',
    add_count: 0,
    change_count: 3,
    destroy_count: 0,
    duration: 30,
    execution_number: 5,
    created_at: '2024-01-15T10:00:00Z',
    change_summary: '3 resources to change',
  },
};

describe('getEnvironmentInfo', () => {
  it('includes environment name and key in the heading', async () => {
    const result = await getEnvironmentInfo(makeClient(base), { project_key: 'eks', environment_key: 'prod' });
    expect(result).toContain('Production (prod)');
  });

  it('shows repository and branch from project info', async () => {
    const result = await getEnvironmentInfo(makeClient(base), { project_key: 'eks', environment_key: 'prod' });
    expect(result).toContain('https://github.com/org/infra');
    expect(result).toContain('main');
  });

  it('includes remediation block when repository and directory are set', async () => {
    const result = await getEnvironmentInfo(makeClient(base), { project_key: 'eks', environment_key: 'prod' });
    expect(result).toContain('Remediation');
    expect(result).toContain('git clone https://github.com/org/infra');
    expect(result).toContain('envs/prod');
  });

  it('omits remediation block when repository is not set', async () => {
    const env: Environment = {
      ...base,
      project: { ...base.project!, repository: null },
    };
    const result = await getEnvironmentInfo(makeClient(env), { project_key: 'eks', environment_key: 'prod' });
    expect(result).not.toContain('Remediation');
  });

  it('shows latest drift check summary', async () => {
    const result = await getEnvironmentInfo(makeClient(base), { project_key: 'eks', environment_key: 'prod' });
    expect(result).toContain('3 resources to change');
  });
});
