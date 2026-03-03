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

export interface PipelineRun {
  runId: string;
  operation: PipelineOperation;
  status: PipelineRunStatus;
  createdAt: string;
  updatedAt: string;
  requestedBy: string;
  requestPayload: unknown;
  requiredCapabilities: string[];
  blockingCapabilities: string[];
  events: PipelineRunEvent[];
}

export interface PipelineRunCreateInput {
  operation: PipelineOperation;
  requestedBy?: string;
  requestPayload?: unknown;
  requiredCapabilities: string[];
  blockingCapabilities?: string[];
}
