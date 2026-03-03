export type PipelineOperation =
  | "citeline_pull"
  | "daily_diff"
  | "enrichment"
  | "classification"
  | "qa_validation"
  | "incremental_merge"
  | "export_outputs"
  | "full_pipeline";

export type PipelineRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "blocked_not_implemented";

export interface PipelineRunEvent {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface PipelineCommandRecord {
  label: string;
  cmd: string;
  args: string[];
  cwd: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  exitCode: number;
  timedOut: boolean;
}

export interface PipelineArtifact {
  kind: string;
  label: string;
  path: string;
  exists: boolean;
}

export interface PipelineRun {
  runId: string;
  operation: PipelineOperation;
  status: PipelineRunStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  updatedAt: string;
  durationMs?: number;
  requestedBy: string;
  requestPayload: unknown;
  requiredCapabilities: string[];
  blockingCapabilities: string[];
  error?: string;
  events: PipelineRunEvent[];
  commands: PipelineCommandRecord[];
  artifacts: PipelineArtifact[];
}

export interface PipelineRunCreateInput {
  operation: PipelineOperation;
  requestedBy?: string;
  requestPayload?: unknown;
  requiredCapabilities: string[];
  blockingCapabilities?: string[];
}
