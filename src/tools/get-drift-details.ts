import type { DrifthoundClient } from '../client.js';

interface GetDriftDetailsArgs {
  project_key: string;
  environment_key: string;
}

export async function getDriftDetails(
  client: DrifthoundClient,
  args: GetDriftDetailsArgs
): Promise<string> {
  const drift = await client.getDriftDetails(args.project_key, args.environment_key);

  const lines: string[] = [
    `# Drift Details: ${args.project_key}/${args.environment_key}`,
    '',
    '## Summary',
    `- **Status**: ${drift.status}`,
    `- **Checked at**: ${drift.created_at}`,
    `- **Execution #**: ${drift.execution_number}`,
  ];

  if (drift.duration) {
    lines.push(`- **Duration**: ${drift.duration}s`);
  }

  lines.push('');
  lines.push('## Resource Changes');
  lines.push(`- **To add**: ${drift.add_count ?? 0}`);
  lines.push(`- **To change**: ${drift.change_count ?? 0}`);
  lines.push(`- **To destroy**: ${drift.destroy_count ?? 0}`);

  if (drift.change_summary) {
    lines.push(`- **Summary**: ${drift.change_summary}`);
  }

  if (drift.raw_output) {
    lines.push('');
    lines.push('## Terraform Plan Output');
    lines.push('');
    lines.push('```');
    lines.push(drift.raw_output);
    lines.push('```');
  }

  return lines.join('\n');
}
