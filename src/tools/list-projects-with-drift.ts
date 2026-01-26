import type { DrifthoundClient } from '../client.js';

export async function listProjectsWithDrift(client: DrifthoundClient): Promise<string> {
  const projects = await client.listProjects('issues');

  if (projects.length === 0) {
    return 'No projects with drift or errors detected. All infrastructure is in sync.';
  }

  const lines: string[] = [
    `Found ${projects.length} project(s) with issues:`,
    '',
  ];

  for (const project of projects) {
    const statusIcon = project.aggregated_status === 'error' ? '✗' : '⚠';
    lines.push(`## ${statusIcon} ${project.name} (${project.key})`);
    lines.push(`- **Status**: ${project.aggregated_status}`);
    lines.push(`- **Repository**: ${project.repository || 'Not configured'}`);
    lines.push(`- **Branch**: ${project.branch}`);

    const issues: string[] = [];
    if (project.drift_environment_count > 0) {
      issues.push(`${project.drift_environment_count} with drift`);
    }
    if (project.error_environment_count > 0) {
      issues.push(`${project.error_environment_count} with errors`);
    }
    lines.push(`- **Environments**: ${project.environment_count} total, ${issues.join(', ')}`);

    if (project.last_checked_at) {
      lines.push(`- **Last checked**: ${project.last_checked_at}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
