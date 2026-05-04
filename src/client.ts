import type { Project, Environment, DriftCheck, ApiError } from './types.js';

export class DrifthoundClient {
  private baseUrl: string;
  private apiToken: string;

  constructor(baseUrl: string, apiToken: string) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiToken = apiToken;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json() as ApiError;
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async listProjects(filter?: 'drift' | 'issues'): Promise<Project[]> {
    let params: Record<string, string> | undefined;
    if (filter === 'issues') {
      params = { with_issues: 'true' };
    } else if (filter === 'drift') {
      params = { with_drift: 'true' };
    }
    return this.request<Project[]>('/api/v1/projects', params);
  }

  async getProject(key: string): Promise<Project> {
    return this.request<Project>(`/api/v1/projects/${encodeURIComponent(key)}`);
  }

  async listEnvironments(projectKey: string, status?: string): Promise<Environment[]> {
    const params = status ? { status } : undefined;
    return this.request<Environment[]>(
      `/api/v1/projects/${encodeURIComponent(projectKey)}/environments`,
      params
    );
  }

  async getEnvironment(projectKey: string, envKey: string): Promise<Environment> {
    return this.request<Environment>(
      `/api/v1/projects/${encodeURIComponent(projectKey)}/environments/${encodeURIComponent(envKey)}`
    );
  }

  async getDriftDetails(projectKey: string, envKey: string): Promise<DriftCheck> {
    return this.request<DriftCheck>(
      `/api/v1/projects/${encodeURIComponent(projectKey)}/environments/${encodeURIComponent(envKey)}/drift`
    );
  }

  async ping(): Promise<void> {
    const url = new URL(`${this.baseUrl}/up`);
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      throw new Error(`API returned ${response.status} ${response.statusText}`);
    }
  }
}
