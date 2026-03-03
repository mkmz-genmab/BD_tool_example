import type {
  PipelineArtifact,
  PipelineCommandRecord,
  PipelineRun,
  PipelineRunCreateInput,
  PipelineRunEvent,
} from "../shared/pipeline";
import fs from "fs";
import path from "path";

const runs = new Map<string, PipelineRun>();
const MAX_EVENTS_PER_RUN = Number(process.env.PIPELINE_MAX_EVENTS || "2000");

interface PersistedRunStore {
  version: 1;
  runs: PipelineRun[];
}

function getRunStorePath(): string {
  const configured = process.env.PIPELINE_RUN_STORE_PATH;
  if (configured && configured.trim()) {
    return path.resolve(configured.trim());
  }
  return path.join(process.cwd(), "data", "pipeline_runs.json");
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeRunId(operation: string): string {
  const t = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `run_${operation}_${t}_${rand}`;
}

function persistRuns(): void {
  const outPath = getRunStorePath();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const payload: PersistedRunStore = {
    version: 1,
    runs: Array.from(runs.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  };
  const tmp = `${outPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf-8");
  fs.renameSync(tmp, outPath);
}

function normalizeLoadedRun(run: PipelineRun): PipelineRun {
  return {
    ...run,
    commands: Array.isArray(run.commands) ? run.commands : [],
    artifacts: Array.isArray(run.artifacts) ? run.artifacts : [],
    events: Array.isArray(run.events) ? run.events : [],
  };
}

function loadRunsFromDisk(): void {
  const inPath = getRunStorePath();
  if (!fs.existsSync(inPath)) return;

  try {
    const raw = fs.readFileSync(inPath, "utf-8");
    const parsed = JSON.parse(raw) as PersistedRunStore;
    if (!parsed || !Array.isArray(parsed.runs)) return;
    for (const run of parsed.runs) {
      if (run && typeof run.runId === "string") {
        runs.set(run.runId, normalizeLoadedRun(run));
      }
    }
  } catch (error) {
    console.warn("[pipelineRunStore] Failed to load persisted runs:", error);
  }
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
    commands: [],
    artifacts: [],
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
  persistRuns();
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
  if (run.events.length > MAX_EVENTS_PER_RUN) {
    run.events = run.events.slice(run.events.length - MAX_EVENTS_PER_RUN);
  }
  run.updatedAt = nowIso();
  runs.set(runId, run);
  persistRuns();
  return run;
}

export function setPipelineRunStatus(
  runId: string,
  status: PipelineRun["status"],
  message?: string,
  error?: string,
): PipelineRun | undefined {
  const run = runs.get(runId);
  if (!run) return undefined;

  const prevStatus = run.status;
  run.status = status;
  run.updatedAt = nowIso();
  if (status === "running" && !run.startedAt) {
    run.startedAt = run.updatedAt;
  }
  if ((status === "completed" || status === "failed") && !run.finishedAt) {
    run.finishedAt = run.updatedAt;
  }
  if (run.startedAt && run.finishedAt) {
    run.durationMs = Math.max(
      0,
      new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime(),
    );
  }
  if (error) {
    run.error = error;
  }
  if (message) {
    run.events.push({ timestamp: nowIso(), level: "info", message });
  }
  if (prevStatus !== status) {
    run.events.push({
      timestamp: nowIso(),
      level: status === "failed" ? "error" : "info",
      message: `Status changed: ${prevStatus} -> ${status}`,
    });
  }
  runs.set(runId, run);
  persistRuns();
  return run;
}

export function appendPipelineRunCommand(
  runId: string,
  command: PipelineCommandRecord,
): PipelineRun | undefined {
  const run = runs.get(runId);
  if (!run) return undefined;
  run.commands.push(command);
  run.updatedAt = nowIso();
  runs.set(runId, run);
  persistRuns();
  return run;
}

export function appendPipelineRunArtifact(
  runId: string,
  artifact: PipelineArtifact,
): PipelineRun | undefined {
  const run = runs.get(runId);
  if (!run) return undefined;
  run.artifacts.push(artifact);
  run.updatedAt = nowIso();
  runs.set(runId, run);
  persistRuns();
  return run;
}

export function getPipelineRunStorePath(): string {
  return getRunStorePath();
}

loadRunsFromDisk();
