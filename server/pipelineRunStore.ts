import type {
  PipelineRun,
  PipelineRunCreateInput,
  PipelineRunEvent,
} from "../shared/pipeline";

const runs = new Map<string, PipelineRun>();

function nowIso(): string {
  return new Date().toISOString();
}

function makeRunId(operation: string): string {
  const t = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `run_${operation}_${t}_${rand}`;
}

export function createPipelineRun(input: PipelineRunCreateInput): PipelineRun {
  const ts = nowIso();
  const blocking = input.blockingCapabilities || [];
  const status = blocking.length > 0 ? "blocked_not_implemented" : "queued";
  const run: PipelineRun = {
    runId: makeRunId(input.operation),
    operation: input.operation,
    status,
    createdAt: ts,
    updatedAt: ts,
    requestedBy: input.requestedBy || "api",
    requestPayload: input.requestPayload || {},
    requiredCapabilities: input.requiredCapabilities,
    blockingCapabilities: blocking,
    events: [],
  };

  const firstEvent: PipelineRunEvent =
    blocking.length > 0
      ? {
          timestamp: ts,
          level: "warn",
          message: `Run blocked: missing capabilities [${blocking.join(", ")}]`,
        }
      : {
          timestamp: ts,
          level: "info",
          message: "Run created and queued.",
        };

  run.events.push(firstEvent);
  runs.set(run.runId, run);
  return run;
}

export function getPipelineRun(runId: string): PipelineRun | undefined {
  return runs.get(runId);
}

export function listPipelineRuns(limit = 100): PipelineRun[] {
  const all = Array.from(runs.values());
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return all.slice(0, Math.max(1, limit));
}

export function appendPipelineRunEvent(
  runId: string,
  event: Omit<PipelineRunEvent, "timestamp">,
): PipelineRun | undefined {
  const run = runs.get(runId);
  if (!run) return undefined;
  run.events.push({
    timestamp: nowIso(),
    level: event.level,
    message: event.message,
  });
  run.updatedAt = nowIso();
  runs.set(runId, run);
  return run;
}

export function setPipelineRunStatus(
  runId: string,
  status: PipelineRun["status"],
  message?: string,
): PipelineRun | undefined {
  const run = runs.get(runId);
  if (!run) return undefined;
  run.status = status;
  run.updatedAt = nowIso();
  if (message) {
    run.events.push({ timestamp: nowIso(), level: "info", message });
  }
  runs.set(runId, run);
  return run;
}
