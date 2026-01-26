import type { DrifthoundClient } from '../client.js';

interface ListEnvironmentsArgs {
  project_key: string;
  status?: string;
}

export async function listEnvironments(
  client: DrifthoundClient,
  args: ListEnvironmentsArgs
): Promise<string> {
  const environments = await client.listEnvironments(args.project_key, args.status);

  if (environments.length === 0) {
    return args.status
      ? `No environments with status '${args.status}' found in project '${args.project_key}'.`
      : `No environments found in project '${args.project_key}'.`;
  }

  const lines: string[] = [
    `Environments for project '${args.project_key}':`,
  ];

  if (args.status) {
    lines.push(`(Filtered by status: ${args.status})`);
  }
  lines.push('');

  const statusIcons: Record<string, string> = {
    ok: '✓',
    drift: '⚠',
    error: '✗',
    unknown: '?',
  };

  for (const env of environments) {
    const icon = statusIcons[env.status] || '?';

    lines.push(`### ${icon} ${env.name} (${env.key})`);
    lines.push(`- **Status**: ${env.status}`);
    lines.push(`- **Directory**: ${env.directory || 'Not configured'}`);

    if (env.last_checked_at) {
      lines.push(`- **Last checked**: ${env.last_checked_at}`);
    }

    if (env.last_drift_check) {
      const check = env.last_drift_check;
      if (check.change_summary) {
        lines.push(`- **Changes**: ${check.change_summary}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
