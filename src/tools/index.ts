import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DrifthoundClient } from '../client.js';
import { listProjectsWithDrift } from './list-projects-with-drift.js';
import { listEnvironments } from './list-environments.js';
import { getDriftDetails } from './get-drift-details.js';
import { getEnvironmentInfo } from './get-environment-info.js';

export const tools: Tool[] = [
  {
    name: 'list_projects_with_drift',
    description:
      'List all projects that have environments with drift or error status. Returns project keys, names, repositories, branches, and the number of environments in drift or error state. Use this to discover which projects need attention.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_environments',
    description:
      'List all environments for a specific project with their current status (ok, drift, error, unknown). Optionally filter by status to find only drifting environments. Returns environment keys, names, directories, and last drift check summary.',
    inputSchema: {
      type: 'object',
      properties: {
        project_key: {
          type: 'string',
          description: 'The unique key identifier for the project (e.g., "eks", "vpc")',
        },
        status: {
          type: 'string',
          enum: ['ok', 'drift', 'error', 'unknown'],
          description: 'Optional filter to show only environments with this status',
        },
      },
      required: ['project_key'],
    },
  },
  {
    name: 'get_drift_details',
    description:
      'Get the latest drift check details for an environment including the full Terraform/Terragrunt plan output (raw_output). This shows exactly what resources will be added, changed, or destroyed. Essential for understanding what needs to be fixed.',
    inputSchema: {
      type: 'object',
      properties: {
        project_key: {
          type: 'string',
          description: 'The unique key identifier for the project',
        },
        environment_key: {
          type: 'string',
          description: 'The unique key identifier for the environment (e.g., "production", "staging")',
        },
      },
      required: ['project_key', 'environment_key'],
    },
  },
  {
    name: 'get_environment_info',
    description:
      'Get detailed information about an environment including its GitHub repository URL, branch, and directory path. Use this to know where to find and clone the IaC code for remediation.',
    inputSchema: {
      type: 'object',
      properties: {
        project_key: {
          type: 'string',
          description: 'The unique key identifier for the project',
        },
        environment_key: {
          type: 'string',
          description: 'The unique key identifier for the environment',
        },
      },
      required: ['project_key', 'environment_key'],
    },
  },
];

export async function handleToolCall(
  client: DrifthoundClient,
  toolName: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    let result: string;

    switch (toolName) {
      case 'list_projects_with_drift':
        result = await listProjectsWithDrift(client);
        break;

      case 'list_environments':
        if (!args?.project_key || typeof args.project_key !== 'string') {
          throw new Error('project_key is required');
        }
        result = await listEnvironments(client, {
          project_key: args.project_key,
          status: typeof args.status === 'string' ? args.status : undefined,
        });
        break;

      case 'get_drift_details':
        if (!args?.project_key || typeof args.project_key !== 'string') {
          throw new Error('project_key is required');
        }
        if (!args?.environment_key || typeof args.environment_key !== 'string') {
          throw new Error('environment_key is required');
        }
        result = await getDriftDetails(client, {
          project_key: args.project_key,
          environment_key: args.environment_key,
        });
        break;

      case 'get_environment_info':
        if (!args?.project_key || typeof args.project_key !== 'string') {
          throw new Error('project_key is required');
        }
        if (!args?.environment_key || typeof args.environment_key !== 'string') {
          throw new Error('environment_key is required');
        }
        result = await getEnvironmentInfo(client, {
          project_key: args.project_key,
          environment_key: args.environment_key,
        });
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
    };
  }
}
