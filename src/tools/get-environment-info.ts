import type { DrifthoundClient } from '../client.js';

interface GetEnvironmentInfoArgs {
  project_key: string;
  environment_key: string;
}

export async function getEnvironmentInfo(
  client: DrifthoundClient,
  args: GetEnvironmentInfoArgs
): Promise<string> {
  const env = await client.getEnvironment(args.project_key, args.environment_key);

  const lines: string[] = [
    `# Environment: ${env.name} (${env.key})`,
    '',
    '## Repository Location',
  ];

  if (env.project) {
    lines.push(`- **Repository**: ${env.project.repository || 'Not configured'}`);
    lines.push(`- **Branch**: ${env.project.branch}`);
  }
  lines.push(`- **Directory**: ${env.directory || 'Root directory'}`);

  lines.push('');
  lines.push('## Current Status');
  lines.push(`- **Status**: ${env.status}`);

  if (env.last_checked_at) {
    lines.push(`- **Last checked**: ${env.last_checked_at}`);
  }

  if (env.last_drift_check) {
    const check = env.last_drift_check;
    lines.push('');
    lines.push('## Latest Drift Check');
    lines.push(`- **Check ID**: ${check.id}`);
    lines.push(`- **Status**: ${check.status}`);
    lines.push(`- **Time**: ${check.created_at}`);
    lines.push(`- **Execution #**: ${check.execution_number}`);

    if (check.add_count !== null || check.change_count !== null || check.destroy_count !== null) {
      lines.push(`- **Resources**: ${check.add_count ?? 0} to add, ${check.change_count ?? 0} to change, ${check.destroy_count ?? 0} to destroy`);
    }

    if (check.change_summary) {
      lines.push(`- **Summary**: ${check.change_summary}`);
    }
  }

  // Add useful hints for remediation
  if (env.project?.repository && env.directory) {
    lines.push('');
    lines.push('## Remediation');
    lines.push('To investigate and fix this drift:');
    lines.push('');
    lines.push('```bash');
    lines.push(`git clone ${env.project.repository}`);
    lines.push(`cd <repo-name>/${env.directory}`);
    lines.push('terraform plan   # or: terragrunt plan');
    lines.push('```');
  }

  return lines.join('\n');
}
