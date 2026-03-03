import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import type { PipelineCommandRecord, PipelineOperation } from "../shared/pipeline";
import {
  appendPipelineRunArtifact,
  appendPipelineRunCommand,
  appendPipelineRunEvent,
} from "./pipelineRunStore";

type Payload = Record<string, unknown>;

interface PipelineRoots {
  appRoot: string;
  excelRoot: string;
  apiRoot: string;
  outputRoot: string;
  pythonBin: string;
}

interface CommandSpec {
  label: string;
  cmd: string;
  args: string[];
  cwd: string;
  timeoutMs: number;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function resolvePath(baseDir: string, candidate: string): string {
  if (path.isAbsolute(candidate)) return candidate;
  return path.resolve(baseDir, candidate);
}

function resolveRoots(payload: Payload): PipelineRoots {
  const appRoot = process.cwd();
  const excelRoot = resolvePath(
    appRoot,
    asString(payload.excelRoot) || process.env.EXCEL_V2_ROOT || "../excel_v2",
  );
  const apiRoot = resolvePath(
    appRoot,
    asString(payload.apiRoot) || process.env.CITELINE_API_ROOT || "../api/citeline_api_example",
  );
  const outputRoot = resolvePath(
    excelRoot,
    asString(payload.outputRoot) || process.env.PIPELINE_OUTPUT_ROOT || "output/portal_pipeline_runs",
  );
  const pythonBin = asString(payload.pythonBin) || process.env.PIPELINE_PYTHON_BIN || "python3";
  return { appRoot, excelRoot, apiRoot, outputRoot, pythonBin };
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function requireExistingFile(filePath: string, fieldName: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${fieldName} does not exist: ${filePath}`);
  }
  return filePath;
}

function resolveRequiredPath(payload: Payload, fieldName: string, baseDir: string): string {
  const raw = asString(payload[fieldName]);
  if (!raw) {
    throw new Error(`Missing required payload field: ${fieldName}`);
  }
  return requireExistingFile(resolvePath(baseDir, raw), fieldName);
}

function resolveOptionalPath(
  payload: Payload,
  fieldName: string,
  baseDir: string,
  defaultPath?: string,
): string | undefined {
  const raw = asString(payload[fieldName]);
  if (raw) return resolvePath(baseDir, raw);
  return defaultPath;
}

function addArtifact(runId: string, kind: string, label: string, artifactPath: string): void {
  appendPipelineRunArtifact(runId, {
    kind,
    label,
    path: artifactPath,
    exists: fs.existsSync(artifactPath),
  });
}

function maybeAddFlag(args: string[], flag: string, enabled: boolean): void {
  if (enabled) args.push(flag);
}

function maybeAddValue(args: string[], flag: string, value: string | number | undefined): void {
  if (value === undefined || value === null) return;
  args.push(flag, String(value));
}

function defaultTimeoutMs(payload: Payload): number {
  const configured = asNumber(payload.timeoutSeconds) || asNumber(process.env.PIPELINE_STEP_TIMEOUT_SECONDS);
  const seconds = configured && configured > 0 ? configured : 21600;
  return seconds * 1000;
}

function emitOutputLines(
  runId: string,
  label: string,
  level: "info" | "warn",
  chunk: Buffer | string,
  state: { remainder: string },
): void {
  state.remainder += chunk.toString();
  while (true) {
    const newline = state.remainder.indexOf("\n");
    if (newline < 0) break;
    const line = state.remainder.slice(0, newline).trim();
    state.remainder = state.remainder.slice(newline + 1);
    if (!line) continue;
    appendPipelineRunEvent(runId, {
      level,
      message: `[${label}] ${line.slice(0, 1200)}`,
    });
  }
}

async function runCommand(runId: string, spec: CommandSpec): Promise<void> {
  appendPipelineRunEvent(runId, {
    level: "info",
    message: `Starting: ${spec.cmd} ${spec.args.join(" ")} (cwd=${spec.cwd})`,
  });

  const startedAt = new Date();
  const startedAtIso = startedAt.toISOString();
  let timedOut = false;

  await new Promise<void>((resolve, reject) => {
    const child = spawn(spec.cmd, spec.args, {
      cwd: spec.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdoutState = { remainder: "" };
    const stderrState = { remainder: "" };

    child.stdout.on("data", (chunk) => {
      emitOutputLines(runId, spec.label, "info", chunk, stdoutState);
    });
    child.stderr.on("data", (chunk) => {
      emitOutputLines(runId, spec.label, "warn", chunk, stderrState);
    });

    const timeoutHandle =
      spec.timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            appendPipelineRunEvent(runId, {
              level: "error",
              message: `[${spec.label}] Timed out after ${Math.round(spec.timeoutMs / 1000)} seconds.`,
            });
            child.kill("SIGTERM");
            setTimeout(() => child.kill("SIGKILL"), 5000).unref();
          }, spec.timeoutMs)
        : undefined;

    child.on("error", (error) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      reject(error);
    });

    child.on("close", (exitCode) => {
      if (stdoutState.remainder.trim()) {
        appendPipelineRunEvent(runId, {
          level: "info",
          message: `[${spec.label}] ${stdoutState.remainder.trim().slice(0, 1200)}`,
        });
      }
      if (stderrState.remainder.trim()) {
        appendPipelineRunEvent(runId, {
          level: "warn",
          message: `[${spec.label}] ${stderrState.remainder.trim().slice(0, 1200)}`,
        });
      }
      if (timeoutHandle) clearTimeout(timeoutHandle);

      const finishedAt = new Date();
      const record: PipelineCommandRecord = {
        label: spec.label,
        cmd: spec.cmd,
        args: spec.args,
        cwd: spec.cwd,
        startedAt: startedAtIso,
        finishedAt: finishedAt.toISOString(),
        durationMs: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
        exitCode: typeof exitCode === "number" ? exitCode : -1,
        timedOut,
      };
      appendPipelineRunCommand(runId, record);

      if (timedOut) {
        reject(new Error(`Command timed out: ${spec.label}`));
        return;
      }
      if (exitCode !== 0) {
        reject(new Error(`Command failed (${exitCode}): ${spec.cmd} ${spec.args.join(" ")}`));
        return;
      }
      resolve();
    });
  });
}

function resolveDefaultDictionary(excelRoot: string): string | undefined {
  const demoDir = path.join(excelRoot, "data_from_demo");
  if (!fs.existsSync(demoDir)) return undefined;
  const files = fs
    .readdirSync(demoDir)
    .filter((f) => /^master_biopharma_dictionary.*\.(csv|xlsx)$/i.test(f))
    .sort();
  if (files.length === 0) return undefined;
  return path.join(demoDir, files[files.length - 1]);
}

async function runCitelinePull(runId: string, payload: Payload, roots: PipelineRoots): Promise<void> {
  const runDir = path.join(roots.outputRoot, runId, "citeline_pull");
  ensureDir(runDir);

  const queryFile = requireExistingFile(
    resolvePath(
      roots.apiRoot,
      asString(payload.queryFile) || "queries/daily_anticancer_biologics.json",
    ),
    "queryFile",
  );
  const outputJson =
    resolveOptionalPath(payload, "outputJson", roots.apiRoot, path.join(runDir, "daily_query_raw.json")) ||
    path.join(runDir, "daily_query_raw.json");
  const outputXlsx =
    resolveOptionalPath(
      payload,
      "outputXlsx",
      roots.apiRoot,
      path.join(runDir, "today_upload_from_api.xlsx"),
    ) || path.join(runDir, "today_upload_from_api.xlsx");
  const queryUrl =
    asString(payload.queryUrl) ||
    "https://clinicalintelligence.citeline.com/drugs/results?qId=ec78c6ce-2692-41b2-8cd6-08f07bc76bd0";
  const timeoutMs = defaultTimeoutMs(payload);

  const pullArgs = [
    "run_daily_query.py",
    "--query-file",
    queryFile,
    "--output-file",
    outputJson,
  ];
  maybeAddFlag(pullArgs, "--sandbox", asBoolean(payload.sandbox, false));
  maybeAddFlag(pullArgs, "--force-refresh", asBoolean(payload.forceRefresh, false));
  maybeAddValue(pullArgs, "--max-pages", asNumber(payload.maxPages));

  await runCommand(runId, {
    label: "citeline_pull",
    cmd: roots.pythonBin,
    args: pullArgs,
    cwd: roots.apiRoot,
    timeoutMs,
  });

  await runCommand(runId, {
    label: "citeline_export_ideal_excel",
    cmd: roots.pythonBin,
    args: [
      "export_ideal_excel.py",
      "--input-json",
      outputJson,
      "--output-xlsx",
      outputXlsx,
      "--query-url",
      queryUrl,
    ],
    cwd: roots.apiRoot,
    timeoutMs,
  });

  addArtifact(runId, "json", "citeline_pull_json", outputJson);
  addArtifact(runId, "xlsx", "citeline_today_upload", outputXlsx);
}

async function runDailyDiff(runId: string, payload: Payload, roots: PipelineRoots): Promise<void> {
  const todayUpload = resolveRequiredPath(payload, "todayUpload", roots.excelRoot);
  const previousMaster = resolveRequiredPath(payload, "previousMaster", roots.excelRoot);
  const runDir = path.join(roots.outputRoot, runId, "daily_diff");
  const outDir = resolveOptionalPath(payload, "outDir", roots.excelRoot, runDir) || runDir;
  ensureDir(outDir);

  const timeoutMs = defaultTimeoutMs(payload);
  const args = [
    "utils/daily_upload_diff.py",
    todayUpload,
    previousMaster,
    "--out-dir",
    outDir,
  ];
  maybeAddValue(args, "--id-col", asString(payload.idCol));
  maybeAddValue(args, "--api-updated-col", asString(payload.apiUpdatedCol));
  maybeAddFlag(args, "--disable-api-updated-signal", asBoolean(payload.disableApiUpdatedSignal, false));
  maybeAddValue(args, "--hash-cols", asString(payload.hashCols));
  maybeAddValue(args, "--compare-cols", asString(payload.compareCols));

  await runCommand(runId, {
    label: "daily_diff",
    cmd: roots.pythonBin,
    args,
    cwd: roots.excelRoot,
    timeoutMs,
  });

  addArtifact(runId, "directory", "daily_diff_out_dir", outDir);
  const summaries = fs
    .readdirSync(outDir)
    .filter((name) => /^daily_diff_summary_.*\.json$/i.test(name))
    .sort();
  if (summaries.length > 0) {
    addArtifact(runId, "json", "daily_diff_summary", path.join(outDir, summaries[summaries.length - 1]));
  }
}

async function runEnrichment(runId: string, payload: Payload, roots: PipelineRoots): Promise<void> {
  const inputFile = resolveRequiredPath(payload, "inputFile", roots.excelRoot);
  const runDir = path.join(roots.outputRoot, runId, "enrichment");
  ensureDir(runDir);
  const outFile =
    resolveOptionalPath(payload, "outFile", roots.excelRoot, path.join(runDir, "enriched_subset.xlsx")) ||
    path.join(runDir, "enriched_subset.xlsx");
  const reportDir =
    resolveOptionalPath(payload, "reportDir", roots.excelRoot, path.join(runDir, "reports")) ||
    path.join(runDir, "reports");
  ensureDir(path.dirname(outFile));
  ensureDir(reportDir);

  const timeoutMs = defaultTimeoutMs(payload);
  const args = ["-m", "enrichment.run_enrichment", inputFile, "--out-file", outFile];
  maybeAddValue(args, "--abstracts-dir", asString(payload.abstractsDir));
  maybeAddValue(args, "--vector-store-dir", asString(payload.vectorStoreDir));
  maybeAddValue(args, "--company-assets", asString(payload.companyAssets));
  maybeAddValue(args, "--proposals-dir", asString(payload.proposalsDir));
  maybeAddFlag(args, "--skip-proposals", asBoolean(payload.skipProposals, false));
  maybeAddFlag(args, "--use-vector-fallback", asBoolean(payload.useVectorFallback, false));
  maybeAddFlag(args, "--build-vector-store", asBoolean(payload.buildVectorStore, false));
  maybeAddFlag(args, "--skip-abstracts", asBoolean(payload.skipAbstracts, false));
  maybeAddFlag(args, "--skip-company", asBoolean(payload.skipCompany, false));
  maybeAddFlag(args, "--scrape-live", asBoolean(payload.scrapeLive, false));
  maybeAddFlag(args, "--refresh-cached-live", asBoolean(payload.refreshCachedLive, false));
  maybeAddFlag(args, "--skip-llm", asBoolean(payload.skipLlm, false));
  maybeAddValue(args, "--min-confidence", asNumber(payload.minConfidence));
  maybeAddValue(args, "--llm-model", asString(payload.llmModel));
  maybeAddValue(args, "--report-dir", reportDir);

  await runCommand(runId, {
    label: "external_enrichment",
    cmd: roots.pythonBin,
    args,
    cwd: roots.excelRoot,
    timeoutMs,
  });

  addArtifact(runId, "xlsx", "enriched_output", outFile);
  addArtifact(runId, "directory", "enrichment_reports", reportDir);
}

async function runClassification(runId: string, payload: Payload, roots: PipelineRoots): Promise<void> {
  const inputFile = resolveRequiredPath(payload, "inputFile", roots.excelRoot);
  const runDir = path.join(roots.outputRoot, runId, "classification");
  ensureDir(runDir);

  const outputDir =
    resolveOptionalPath(payload, "outputDir", roots.excelRoot, path.join(runDir, "classifier_output")) ||
    path.join(runDir, "classifier_output");
  ensureDir(outputDir);

  const outputFile =
    resolveOptionalPath(payload, "outputFile", roots.excelRoot, path.join(runDir, "master_classified.xlsx")) ||
    path.join(runDir, "master_classified.xlsx");
  const timeoutMs = defaultTimeoutMs(payload);

  const args = [
    "run_master_classification.py",
    inputFile,
    "--output-dir",
    outputDir,
    "--output",
    outputFile,
  ];
  maybeAddValue(args, "--batch-size", asNumber(payload.batchSize));
  maybeAddFlag(args, "--eval", asBoolean(payload.eval, false));
  maybeAddFlag(args, "--resume", asBoolean(payload.resume, false));
  maybeAddFlag(args, "--force-llm", asBoolean(payload.forceLlm, false));
  maybeAddFlag(args, "--skip-escalation", asBoolean(payload.skipEscalation, false));
  maybeAddFlag(args, "--skip-molecule", asBoolean(payload.skipMolecule, false));
  maybeAddFlag(args, "--skip-masking", asBoolean(payload.skipMasking, false));
  maybeAddFlag(args, "--skip-payload", asBoolean(payload.skipPayload, false));
  maybeAddFlag(args, "--skip-external-evidence", asBoolean(payload.skipExternalEvidence, false));
  maybeAddFlag(args, "--skip-abstracts", asBoolean(payload.skipAbstracts, false));
  maybeAddFlag(args, "--skip-company", asBoolean(payload.skipCompany, false));
  maybeAddFlag(args, "--scrape-live", asBoolean(payload.scrapeLive, false));
  maybeAddFlag(args, "--build-vector-store", asBoolean(payload.buildVectorStore, false));
  if (!asBoolean(payload.disableAiSummary, false)) {
    maybeAddFlag(args, "--generate-ai-summary", true);
  }
  maybeAddValue(args, "--summary-min-confidence", asNumber(payload.summaryMinConfidence));
  if (asBoolean(payload.dictionaryCoverage, false)) {
    maybeAddFlag(args, "--dictionary-coverage", true);
    const dict = resolveOptionalPath(payload, "dictionaryFile", roots.excelRoot);
    if (dict) {
      maybeAddValue(args, "--dictionary-file", dict);
    }
  }
  if (asBoolean(payload.exportDemo, false)) {
    maybeAddFlag(args, "--export-demo", true);
  }

  await runCommand(runId, {
    label: "classification",
    cmd: roots.pythonBin,
    args,
    cwd: roots.excelRoot,
    timeoutMs,
  });

  addArtifact(runId, "xlsx", "classified_master", outputFile);
  addArtifact(runId, "directory", "classification_output_dir", outputDir);
}

async function runQaValidation(runId: string, payload: Payload, roots: PipelineRoots): Promise<void> {
  const inputFile = resolveRequiredPath(payload, "inputFile", roots.excelRoot);
  const runDir = path.join(roots.outputRoot, runId, "qa");
  ensureDir(runDir);

  const outFile =
    resolveOptionalPath(payload, "outFile", roots.excelRoot, path.join(runDir, "master_enforced.xlsx")) ||
    path.join(runDir, "master_enforced.xlsx");
  const reportDir =
    resolveOptionalPath(payload, "reportDir", roots.excelRoot, path.join(runDir, "reports")) ||
    path.join(runDir, "reports");
  ensureDir(reportDir);

  const timeoutMs = defaultTimeoutMs(payload);

  await runCommand(runId, {
    label: "taxonomy_guardrails",
    cmd: roots.pythonBin,
    args: [
      "utils/enforce_ar_rules_on_master.py",
      inputFile,
      "--out-file",
      outFile,
      "--report-dir",
      reportDir,
    ],
    cwd: roots.excelRoot,
    timeoutMs,
  });

  await runCommand(runId, {
    label: "qa_narrative_audit",
    cmd: roots.pythonBin,
    args: ["utils/full_classifier_narrative_audit.py", outFile, "--report-dir", reportDir],
    cwd: roots.excelRoot,
    timeoutMs,
  });

  const readinessArgs = ["utils/ar_readiness_report.py", outFile, "--report-dir", reportDir];
  const frontendFile = asString(payload.frontendFile);
  if (frontendFile) {
    readinessArgs.push("--frontend-file", resolvePath(roots.excelRoot, frontendFile));
  }
  const evalSummaryJson = asString(payload.evalSummaryJson);
  if (evalSummaryJson) {
    readinessArgs.push("--eval-summary-json", resolvePath(roots.excelRoot, evalSummaryJson));
  }

  await runCommand(runId, {
    label: "qa_ar_readiness",
    cmd: roots.pythonBin,
    args: readinessArgs,
    cwd: roots.excelRoot,
    timeoutMs,
  });

  addArtifact(runId, "xlsx", "qa_enforced_master", outFile);
  addArtifact(runId, "directory", "qa_reports", reportDir);
}

async function runIncrementalMerge(runId: string, payload: Payload, roots: PipelineRoots): Promise<void> {
  const todaySeed = resolveRequiredPath(payload, "todaySeed", roots.excelRoot);
  const reclassifiedSubset = resolveRequiredPath(payload, "reclassifiedSubset", roots.excelRoot);
  const runDir = path.join(roots.outputRoot, runId, "merge");
  ensureDir(runDir);
  const outFile =
    resolveOptionalPath(payload, "outFile", roots.excelRoot, path.join(runDir, "master_merged.xlsx")) ||
    path.join(runDir, "master_merged.xlsx");
  const timeoutMs = defaultTimeoutMs(payload);

  const args = [
    "utils/merge_incremental_master_updates.py",
    todaySeed,
    reclassifiedSubset,
    "--out-file",
    outFile,
  ];
  maybeAddValue(args, "--id-col", asString(payload.idCol));
  maybeAddValue(args, "--update-cols", asString(payload.updateCols));

  await runCommand(runId, {
    label: "incremental_merge",
    cmd: roots.pythonBin,
    args,
    cwd: roots.excelRoot,
    timeoutMs,
  });

  addArtifact(runId, "xlsx", "merged_master", outFile);
}

async function runExportOutputs(runId: string, payload: Payload, roots: PipelineRoots): Promise<void> {
  const masterFile = resolveRequiredPath(payload, "masterFile", roots.excelRoot);
  const runDir = path.join(roots.outputRoot, runId, "export");
  ensureDir(runDir);
  const outDir = resolveOptionalPath(payload, "outDir", roots.excelRoot, runDir) || runDir;
  ensureDir(outDir);
  const timeoutMs = defaultTimeoutMs(payload);

  const args = ["utils/export_demo_tool_format.py", masterFile, "--out-dir", outDir];
  maybeAddValue(args, "--id-col", asString(payload.idCol));
  maybeAddValue(args, "--old-summary-col", asString(payload.oldSummaryCol));
  maybeAddValue(args, "--new-summary-col", asString(payload.newSummaryCol));

  const dictionarySource = resolveOptionalPath(payload, "dictionarySource", roots.excelRoot);
  if (dictionarySource) {
    maybeAddValue(args, "--dictionary-source", dictionarySource);
  }
  maybeAddValue(args, "--dictionary-mode", asString(payload.dictionaryMode));
  maybeAddValue(args, "--target-cols", asString(payload.targetCols));
  maybeAddValue(args, "--source-type", asString(payload.sourceType));
  maybeAddValue(args, "--delta-filter-col", asString(payload.deltaFilterCol));
  maybeAddValue(args, "--delta-include-values", asString(payload.deltaIncludeValues));
  maybeAddValue(args, "--min-delta-confidence", asNumber(payload.minDeltaConfidence));
  maybeAddValue(args, "--crosstalk-prefix", asString(payload.crosstalkPrefix));

  await runCommand(runId, {
    label: "export_outputs",
    cmd: roots.pythonBin,
    args,
    cwd: roots.excelRoot,
    timeoutMs,
  });

  addArtifact(runId, "directory", "demo_export_dir", outDir);
}

async function runFullPipeline(runId: string, payload: Payload, roots: PipelineRoots): Promise<void> {
  const runDir = path.join(roots.outputRoot, runId, "full_pipeline");
  ensureDir(runDir);
  const timeoutMs = defaultTimeoutMs(payload);
  const includeApiPull = asBoolean(payload.includeApiPull, false);

  if (includeApiPull) {
    const previousMaster = resolveRequiredPath(payload, "previousMaster", roots.excelRoot);
    const dictionaryDefault = resolveDefaultDictionary(roots.excelRoot);
    const dictionaryFile = resolveOptionalPath(payload, "dictionaryFile", roots.excelRoot, dictionaryDefault);
    if (!dictionaryFile) {
      throw new Error(
        "dictionaryFile is required for includeApiPull mode and no default dictionary was found.",
      );
    }

    const args = [
      "utils/run_api_to_daily_pipeline.py",
      previousMaster,
      "--api-root",
      roots.apiRoot,
      "--dictionary-file",
      dictionaryFile,
      "--out-root",
      roots.outputRoot,
      "--run-name",
      runId,
    ];
    maybeAddValue(args, "--query-file", asString(payload.queryFile));
    maybeAddValue(args, "--query-url", asString(payload.queryUrl));
    maybeAddFlag(args, "--sandbox", asBoolean(payload.sandbox, false));
    maybeAddFlag(args, "--force-refresh", asBoolean(payload.forceRefresh, false));
    maybeAddValue(args, "--max-pages", asNumber(payload.maxPages));
    maybeAddFlag(args, "--allow-partial-pull", asBoolean(payload.allowPartialPull, false));
    maybeAddValue(args, "--batch-size", asNumber(payload.batchSize));
    maybeAddFlag(args, "--eval", asBoolean(payload.eval, false));
    maybeAddFlag(args, "--resume", asBoolean(payload.resume, false));
    maybeAddFlag(args, "--force-llm", asBoolean(payload.forceLlm, false));
    maybeAddFlag(args, "--skip-enrichment", asBoolean(payload.skipEnrichment, false));
    maybeAddFlag(args, "--skip-abstracts", asBoolean(payload.skipAbstracts, false));
    maybeAddFlag(args, "--skip-company", asBoolean(payload.skipCompany, false));
    maybeAddFlag(args, "--scrape-live", asBoolean(payload.scrapeLive, false));
    maybeAddFlag(args, "--skip-llm-extraction", asBoolean(payload.skipLlmExtraction, false));
    maybeAddFlag(args, "--build-vector-store", asBoolean(payload.buildVectorStore, false));
    maybeAddValue(args, "--enrichment-min-confidence", asNumber(payload.enrichmentMinConfidence));
    maybeAddFlag(args, "--skip-classification", asBoolean(payload.skipClassification, false));
    maybeAddFlag(args, "--skip-ai-summary", asBoolean(payload.skipAiSummary, false));
    maybeAddFlag(args, "--skip-demo-export", asBoolean(payload.skipDemoExport, false));
    maybeAddValue(args, "--summary-min-confidence", asNumber(payload.summaryMinConfidence));
    maybeAddValue(args, "--delta-filter-col", asString(payload.deltaFilterCol));
    maybeAddValue(args, "--delta-include-values", asString(payload.deltaIncludeValues));
    maybeAddValue(args, "--min-delta-confidence", asNumber(payload.minDeltaConfidence));
    maybeAddValue(args, "--dictionary-mode", asString(payload.dictionaryMode));
    maybeAddValue(args, "--publish-master", asString(payload.publishMaster));
    maybeAddFlag(args, "--disable-api-updated-signal", asBoolean(payload.disableApiUpdatedSignal, false));
    maybeAddValue(args, "--diff-hash-cols", asString(payload.diffHashCols));

    await runCommand(runId, {
      label: "full_pipeline_with_api_pull",
      cmd: roots.pythonBin,
      args,
      cwd: roots.excelRoot,
      timeoutMs,
    });
  } else {
    const todayUpload = resolveRequiredPath(payload, "todayUpload", roots.excelRoot);
    const previousMaster = resolveRequiredPath(payload, "previousMaster", roots.excelRoot);
    const dictionaryDefault = resolveDefaultDictionary(roots.excelRoot);
    const dictionaryFile = resolveOptionalPath(payload, "dictionaryFile", roots.excelRoot, dictionaryDefault);
    if (!dictionaryFile) {
      throw new Error("dictionaryFile is required and no default dictionary was found.");
    }

    const args = [
      "utils/run_daily_enrichment_pipeline.py",
      todayUpload,
      previousMaster,
      "--dictionary-file",
      dictionaryFile,
      "--out-root",
      roots.outputRoot,
      "--run-name",
      runId,
    ];
    maybeAddValue(args, "--id-col", asString(payload.idCol));
    maybeAddValue(args, "--batch-size", asNumber(payload.batchSize));
    maybeAddFlag(args, "--eval", asBoolean(payload.eval, false));
    maybeAddFlag(args, "--resume", asBoolean(payload.resume, false));
    maybeAddFlag(args, "--force-llm", asBoolean(payload.forceLlm, false));
    maybeAddFlag(args, "--skip-escalation", asBoolean(payload.skipEscalation, false));
    maybeAddFlag(args, "--skip-abstracts", asBoolean(payload.skipAbstracts, false));
    maybeAddFlag(args, "--skip-company", asBoolean(payload.skipCompany, false));
    maybeAddFlag(args, "--scrape-live", asBoolean(payload.scrapeLive, false));
    maybeAddFlag(args, "--skip-llm-extraction", asBoolean(payload.skipLlmExtraction, false));
    maybeAddFlag(args, "--build-vector-store", asBoolean(payload.buildVectorStore, false));
    maybeAddValue(args, "--enrichment-min-confidence", asNumber(payload.enrichmentMinConfidence));
    maybeAddValue(args, "--summary-min-confidence", asNumber(payload.summaryMinConfidence));
    maybeAddValue(args, "--api-updated-col", asString(payload.apiUpdatedCol));
    maybeAddFlag(args, "--disable-api-updated-signal", asBoolean(payload.disableApiUpdatedSignal, false));
    maybeAddValue(args, "--hash-cols", asString(payload.hashCols));
    maybeAddValue(args, "--delta-filter-col", asString(payload.deltaFilterCol));
    maybeAddValue(args, "--delta-include-values", asString(payload.deltaIncludeValues));
    maybeAddValue(args, "--min-delta-confidence", asNumber(payload.minDeltaConfidence));
    maybeAddValue(args, "--dictionary-mode", asString(payload.dictionaryMode));
    maybeAddValue(args, "--publish-master", asString(payload.publishMaster));
    maybeAddFlag(args, "--skip-enrichment", asBoolean(payload.skipEnrichment, false));
    maybeAddFlag(args, "--skip-classification", asBoolean(payload.skipClassification, false));
    maybeAddFlag(args, "--skip-ai-summary", asBoolean(payload.skipAiSummary, false));
    maybeAddFlag(args, "--skip-demo-export", asBoolean(payload.skipDemoExport, false));

    await runCommand(runId, {
      label: "full_pipeline_from_upload",
      cmd: roots.pythonBin,
      args,
      cwd: roots.excelRoot,
      timeoutMs,
    });
  }

  addArtifact(runId, "directory", "full_pipeline_run_dir", path.join(roots.outputRoot, runId));
  addArtifact(runId, "directory", "full_pipeline_work_dir", runDir);
}

export async function executePipelineOperation(
  runId: string,
  operation: PipelineOperation,
  payload: unknown,
): Promise<void> {
  const normalizedPayload: Payload =
    payload && typeof payload === "object" ? (payload as Payload) : {};
  const roots = resolveRoots(normalizedPayload);

  ensureDir(roots.outputRoot);
  appendPipelineRunEvent(runId, {
    level: "info",
    message: `Resolved roots: excel=${roots.excelRoot} api=${roots.apiRoot} output=${roots.outputRoot}`,
  });

  switch (operation) {
    case "citeline_pull":
      return runCitelinePull(runId, normalizedPayload, roots);
    case "daily_diff":
      return runDailyDiff(runId, normalizedPayload, roots);
    case "enrichment":
      return runEnrichment(runId, normalizedPayload, roots);
    case "classification":
      return runClassification(runId, normalizedPayload, roots);
    case "qa_validation":
      return runQaValidation(runId, normalizedPayload, roots);
    case "incremental_merge":
      return runIncrementalMerge(runId, normalizedPayload, roots);
    case "export_outputs":
      return runExportOutputs(runId, normalizedPayload, roots);
    case "full_pipeline":
      return runFullPipeline(runId, normalizedPayload, roots);
    default:
      throw new Error(`Unsupported operation: ${String(operation)}`);
  }
}
