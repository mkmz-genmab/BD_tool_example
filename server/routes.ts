import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import type { PipelineOperation } from "../shared/pipeline";
import {
  initializeData,
  getLoadedDrugData,
  getTargetSynonyms,
  findCanonicalTarget,
  reloadDrugData,
  getPreferredTerm,
  isInMidaxo,
  getSummaryDelta,
  DATA_PATHS,
} from "./dataLoader";
import {
  FULL_APP_CAPABILITIES,
  FULL_APP_PIPELINE_ENDPOINTS,
  getCapabilitySummary,
  type PlannedEndpoint,
} from "../shared/capabilities";
import {
  createPipelineRun,
  appendPipelineRunEvent,
  getPipelineRun,
  getPipelineRunStorePath,
  listPipelineRuns,
  setPipelineRunStatus,
} from "./pipelineRunStore";
import { executePipelineOperation } from "./pipelineExecutor";
import { pipelineJobQueue } from "./pipelineJobQueue";
import { getPipelineAuthSummary, requirePipelineRole } from "./pipelineAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  initializeData();

  const parsedSampleFraction = Number(process.env.DRUG_SAMPLE_FRACTION || "1");
  const sampleFraction = Number.isFinite(parsedSampleFraction)
    ? Math.max(0.01, Math.min(1, parsedSampleFraction))
    : 1;
  const injectDemoNewInfo = process.env.INJECT_DEMO_NEW_INFO === "true";

  function deduplicateValues(value: string): string {
    if (!value) return "";
    const values = value.split(/[;,\n\r]+/).map((v) => v.trim()).filter(Boolean);
    const unique = Array.from(new Set(values));
    return unique.join("; ");
  }

  function capabilityStatusById(): Map<string, string> {
    return new Map(FULL_APP_CAPABILITIES.map((c) => [c.id, c.status]));
  }

  function resolveBlockingCapabilities(required: string[]): string[] {
    const byId = capabilityStatusById();
    return required.filter((id) => {
      const status = byId.get(id);
      return status === "missing";
    });
  }

  function getEndpoint(path: string): PlannedEndpoint {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === path);
    if (!endpoint) {
      throw new Error(`Missing planned endpoint definition for path: ${path}`);
    }
    return endpoint;
  }

  function createPipelineRunForEndpoint(req: Request, endpoint: PlannedEndpoint) {
    const requestedBy =
      String(
        req.headers["x-user-email"] ||
          req.headers["x-user-id"] ||
          req.pipelineAuth?.role ||
          "api",
      ).trim() || "api";
    const blockingCapabilities = resolveBlockingCapabilities(endpoint.requiredCapabilities);

    return createPipelineRun({
      operation: endpoint.operation as PipelineOperation,
      requestPayload: req.body || {},
      requestedBy,
      requiredCapabilities: endpoint.requiredCapabilities,
      blockingCapabilities,
    });
  }

  function queuePipelineRun(
    run: ReturnType<typeof createPipelineRun>,
    endpoint: PlannedEndpoint,
  ): void {
    if (run.status === "blocked_not_implemented") return;
    pipelineJobQueue.enqueue({
      runId: run.runId,
      label: endpoint.operation,
      execute: async () => {
        setPipelineRunStatus(run.runId, "running", `Running operation: ${endpoint.operation}`);
        try {
          await executePipelineOperation(run.runId, run.operation, run.requestPayload);
          setPipelineRunStatus(run.runId, "completed", "Pipeline operation completed.");
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          appendPipelineRunEvent(run.runId, {
            level: "error",
            message,
          });
          setPipelineRunStatus(run.runId, "failed", "Pipeline operation failed.", message);
        }
      },
    });
  }

  function respondPipelineRun(
    res: Response,
    endpoint: PlannedEndpoint,
    run: ReturnType<typeof createPipelineRun>,
  ) {
    const blocked = run.status === "blocked_not_implemented";
    return res.status(blocked ? 501 : 202).json({
      success: !blocked,
      status: run.status,
      operation: endpoint.operation,
      method: endpoint.method,
      path: endpoint.path,
      requiredCapabilities: endpoint.requiredCapabilities,
      run,
      message: blocked
        ? "Run blocked because required capabilities are still marked missing."
        : "Run accepted and queued.",
    });
  }

  app.get("/api/system/capabilities", (_req, res) => {
    const summary = getCapabilitySummary();
    res.json({
      summary,
      capabilities: FULL_APP_CAPABILITIES,
      runStorePath: getPipelineRunStorePath(),
      auth: getPipelineAuthSummary(),
      queue: pipelineJobQueue.snapshot(),
    });
  });

  app.get("/api/system/full-app-endpoints", (_req, res) => {
    res.json({
      count: FULL_APP_PIPELINE_ENDPOINTS.length,
      endpoints: FULL_APP_PIPELINE_ENDPOINTS,
    });
  });

  app.get("/api/system/roadmap", (_req, res) => {
    const phase1 = ["citeline_api_pull", "daily_diff", "run_tracking", "job_queue"];
    const phase2 = ["external_enrichment", "classification_engine", "incremental_merge"];
    const phase3 = ["taxonomy_guardrails", "qa_audits", "demo_export", "auth_rbac"];

    const lookup = new Map(FULL_APP_CAPABILITIES.map((c) => [c.id, c]));
    const mapPhase = (ids: string[]) => ids.map((id) => lookup.get(id)).filter(Boolean);

    res.json({
      phases: [
        { phase: 1, name: "Ingestion + orchestration", items: mapPhase(phase1) },
        { phase: 2, name: "Enrichment + classification", items: mapPhase(phase2) },
        { phase: 3, name: "QA + release hardening", items: mapPhase(phase3) },
      ],
    });
  });

  app.get("/api/drugs", (_req, res) => {
    try {
      const allDrugs = getLoadedDrugData();

      const seededRandom = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
          hash = ((hash << 5) - hash) + id.charCodeAt(i);
          hash |= 0;
        }
        return Math.abs(hash);
      };

      const drugsWithDeltas = allDrugs.filter((d) => getSummaryDelta(d.id) !== null);
      const drugsWithoutDeltas = allDrugs.filter((d) => getSummaryDelta(d.id) === null);
      const targetCount = Math.ceil(allDrugs.length * sampleFraction);
      const remainingSlots = Math.max(0, targetCount - drugsWithDeltas.length);
      const selectedDrugs = [...drugsWithDeltas, ...drugsWithoutDeltas.slice(0, remainingSlots)];

      const drugs = selectedDrugs.map((drug) => {
        const summaryDelta = getSummaryDelta(drug.id);

        const hash = seededRandom(drug.id);
        const hasNewInfo = injectDemoNewInfo && hash % 7 === 0;

        const possibleNewFields = [
          "targetCurated",
          "mechanismOfAction",
          "companyCurated",
          "countryCurated",
          "summary",
        ];
        const randomNewFields: string[] = [];
        if (hasNewInfo) {
          const numFields = (hash % 3) + 1;
          for (let i = 0; i < numFields && i < possibleNewFields.length; i++) {
            const fieldIndex = (hash + i * 17) % possibleNewFields.length;
            const candidate = possibleNewFields[fieldIndex];
            if (!randomNewFields.includes(candidate)) {
              randomNewFields.push(candidate);
            }
          }
        }

        const existingNewFields = Array.isArray(drug.newFields) ? drug.newFields : [];
        const mergedNewFields = Array.from(new Set([...existingNewFields, ...randomNewFields]));

        const rawTarget = String(drug.target || "");
        const targetParts = rawTarget.split(/[;,\n\r]+/).map((t) => t.trim()).filter(Boolean);
        const preferredTargets = targetParts.map((t) => getPreferredTerm(t));
        const uniquePreferredTargets = Array.from(new Set(preferredTargets));

        return {
          ...drug,
          inMidaxo: isInMidaxo(drug.id) ? "yes" : "no",
          targetCurated: uniquePreferredTargets.join("; "),
          companyCurated: deduplicateValues(String(drug.company || "")),
          countryCurated: deduplicateValues(String(drug.companyHqCountry || drug.drugCountry || "")),
          summaryDelta: summaryDelta?.newSummary || "",
          summaryDeltaConfidence: summaryDelta?.confidence || 0,
          newFields: mergedNewFields.length > 0 ? mergedNewFields : undefined,
        };
      });
      res.json(drugs);
    } catch (error) {
      console.error("Error fetching drugs:", error);
      res.status(500).json({ error: "Failed to load drug data" });
    }
  });

  app.post("/api/drugs/reload", (_req, res) => {
    try {
      const drugs = reloadDrugData(DATA_PATHS.drugDataExcel);
      res.json({
        success: true,
        count: drugs.length,
        message: `Reloaded ${drugs.length} drugs from Excel`,
      });
    } catch (error) {
      console.error("Error reloading drugs:", error);
      res.status(500).json({ error: "Failed to reload drug data" });
    }
  });

  app.get("/api/targets/:name/synonyms", (req, res) => {
    try {
      const { name } = req.params;
      const synonyms = getTargetSynonyms(name);
      const canonical = findCanonicalTarget(name);
      const preferredTerm = getPreferredTerm(name);
      res.json({
        input: name,
        canonical: canonical || name,
        preferredTerm,
        synonyms,
      });
    } catch (error) {
      console.error("Error fetching target synonyms:", error);
      res.status(500).json({ error: "Failed to get target synonyms" });
    }
  });

  app.get("/api/preferred-term/:name", (req, res) => {
    try {
      const { name } = req.params;
      const preferredTerm = getPreferredTerm(name);
      res.json({
        input: name,
        preferredTerm,
        hasPreferred: preferredTerm !== name,
      });
    } catch (error) {
      console.error("Error fetching preferred term:", error);
      res.status(500).json({ error: "Failed to get preferred term" });
    }
  });

  const feedbackStore: Array<{
    timestamp: string;
    rowId: string;
    column: string;
    originalValue: string;
    feedback: string;
    useForTraining: boolean;
  }> = [];

  app.post("/api/feedback", (req, res) => {
    try {
      const { rowId, column, originalValue, feedback, useForTraining } = req.body;

      const entry = {
        timestamp: new Date().toISOString(),
        rowId,
        column,
        originalValue,
        feedback,
        useForTraining: Boolean(useForTraining),
      };

      feedbackStore.push(entry);
      console.log("Feedback received:", entry);

      res.json({ success: true, id: feedbackStore.length });
    } catch (error) {
      console.error("Error storing feedback:", error);
      res.status(500).json({ error: "Failed to store feedback" });
    }
  });

  app.get("/api/feedback", (_req, res) => {
    res.json(feedbackStore);
  });

  function registerPipelinePost(path: string): void {
    app.post(path, requirePipelineRole("operator"), (req, res) => {
      const endpoint = getEndpoint(path);
      const run = createPipelineRunForEndpoint(req, endpoint);
      queuePipelineRun(run, endpoint);
      return respondPipelineRun(res, endpoint, run);
    });
  }

  registerPipelinePost("/api/pipeline/citeline/pull");
  registerPipelinePost("/api/pipeline/daily-diff");
  registerPipelinePost("/api/pipeline/enrich");
  registerPipelinePost("/api/pipeline/classify");
  registerPipelinePost("/api/pipeline/qa");
  registerPipelinePost("/api/pipeline/merge");
  registerPipelinePost("/api/pipeline/export");
  registerPipelinePost("/api/pipeline/run/full");

  app.get("/api/pipeline/queue", requirePipelineRole("viewer"), (_req, res) => {
    res.json(pipelineJobQueue.snapshot());
  });

  app.get("/api/pipeline/runs", requirePipelineRole("viewer"), (req, res) => {
    const limit = Number(req.query.limit || 100);
    const runs = listPipelineRuns(Number.isFinite(limit) ? limit : 100);
    res.json({
      count: runs.length,
      runs,
      queue: pipelineJobQueue.snapshot(),
      runStorePath: getPipelineRunStorePath(),
    });
  });

  app.get("/api/pipeline/run/:runId", requirePipelineRole("viewer"), (req, res) => {
    const run = getPipelineRun(req.params.runId);
    if (!run) {
      return res.status(404).json({
        success: false,
        message: `Run not found: ${req.params.runId}`,
      });
    }

    return res.json({
      success: true,
      run,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
