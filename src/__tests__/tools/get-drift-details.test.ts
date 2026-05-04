import { describe, it, expect } from 'vitest';
import type { DriftCheck } from '../../types.js';
import { getDriftDetails } from '../../tools/get-drift-details.js';

function makeClient(drift: DriftCheck) {
  return { getDriftDetails: async () => drift } as never;
}

const base: DriftCheck = {
  id: 42,
  status: 'drift',
  add_count: 1,
  change_count: 2,
  destroy_count: 0,
  duration: 45,
  execution_number: 7,
  created_at: '2024-01-15T10:00:00Z',
  change_summary: '1 to add, 2 to change',
  raw_output: 'Plan: 1 to add, 2 to change, 0 to destroy.',
  environment_key: 'prod',
  project_key: 'eks',
};

describe('getDriftDetails', () => {
  it('includes project and environment key in the heading', async () => {
    const result = await getDriftDetails(makeClient(base), { project_key: 'eks', environment_key: 'prod' });
    expect(result).toContain('eks/prod');
  });

  it('shows resource change counts', async () => {
    const result = await getDriftDetails(makeClient(base), { project_key: 'eks', environment_key: 'prod' });
    expect(result).toContain('To add**: 1');
    expect(result).toContain('To change**: 2');
    expect(result).toContain('To destroy**: 0');
  });

  it('includes raw terraform output in a code block', async () => {
    const result = await getDriftDetails(makeClient(base), { project_key: 'eks', environment_key: 'prod' });
    expect(result).toContain('```');
    expect(result).toContain('Plan: 1 to add');
  });

  it('omits the plan output section when raw_output is null', async () => {
    const result = await getDriftDetails(
      makeClient({ ...base, raw_output: null }),
      { project_key: 'eks', environment_key: 'prod' }
    );
    expect(result).not.toContain('Terraform Plan Output');
  });

  it('omits duration line when duration is null', async () => {
    const result = await getDriftDetails(
      makeClient({ ...base, duration: null }),
      { project_key: 'eks', environment_key: 'prod' }
    );
    expect(result).not.toContain('Duration');
  });
});
