export type Status = 'ok' | 'drift' | 'error' | 'unknown';

export interface EnvironmentSummary {
  key: string;
  name: string;
  status: Status;
  directory: string | null;
  last_checked_at: string | null;
}

export interface Project {
  key: string;
  name: string;
  repository: string | null;
  branch: string;
  aggregated_status: Status;
  last_checked_at: string | null;
  environment_count: number;
  drift_environment_count: number;
  error_environment_count: number;
  environments?: EnvironmentSummary[];
}

export interface ProjectInfo {
  key: string;
  name: string;
  repository: string | null;
  branch: string;
}

export interface DriftCheckSummary {
  id: number;
  status: Status;
  add_count: number | null;
  change_count: number | null;
  destroy_count: number | null;
  duration: number | null;
  execution_number: number;
  created_at: string;
  change_summary: string | null;
}

export interface Environment extends EnvironmentSummary {
  project?: ProjectInfo;
  last_drift_check: DriftCheckSummary | null;
}

export interface DriftCheck extends DriftCheckSummary {
  raw_output: string | null;
  environment_key: string;
  project_key: string;
}

export interface ApiError {
  error: string;
}
