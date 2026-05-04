import { describe, it, expect } from 'vitest';
import type { Project } from '../../types.js';
import { listProjectsWithDrift } from '../../tools/list-projects-with-drift.js';

function makeClient(projects: Project[]) {
  return { listProjects: async () => projects } as never;
}

const base: Project = {
  key: 'eks',
  name: 'EKS',
  repository: 'https://github.com/org/infra',
  branch: 'main',
  aggregated_status: 'drift',
  last_checked_at: '2024-01-15T10:00:00Z',
  environment_count: 3,
  drift_environment_count: 2,
  error_environment_count: 0,
};

describe('listProjectsWithDrift', () => {
  it('returns the all-clear message when no projects have issues', async () => {
    const result = await listProjectsWithDrift(makeClient([]));
    expect(result).toBe(
      'No projects with drift or errors detected. All infrastructure is in sync.'
    );
  });

  it('shows ⚠ icon for drift status', async () => {
    const result = await listProjectsWithDrift(makeClient([base]));
    expect(result).toContain('⚠ EKS (eks)');
  });

  it('shows ✗ icon for error status', async () => {
    const result = await listProjectsWithDrift(
      makeClient([{ ...base, aggregated_status: 'error', error_environment_count: 1 }])
    );
    expect(result).toContain('✗ EKS (eks)');
  });

  it('reports drift and error counts separately', async () => {
    const result = await listProjectsWithDrift(
      makeClient([{ ...base, drift_environment_count: 1, error_environment_count: 2 }])
    );
    expect(result).toContain('1 with drift');
    expect(result).toContain('2 with errors');
  });

  it('includes the project count header', async () => {
    const result = await listProjectsWithDrift(makeClient([base]));
    expect(result).toContain('Found 1 project(s) with issues');
  });

  it('shows last_checked_at when present', async () => {
    const result = await listProjectsWithDrift(makeClient([base]));
    expect(result).toContain('2024-01-15T10:00:00Z');
  });

  it('omits last checked line when last_checked_at is null', async () => {
    const result = await listProjectsWithDrift(
      makeClient([{ ...base, last_checked_at: null }])
    );
    expect(result).not.toContain('Last checked');
  });
});
