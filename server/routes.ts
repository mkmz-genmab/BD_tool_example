import type { Express, Response } from "express";
import { createServer, type Server } from "http";
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

  function notImplemented(
    res: Response,
    endpoint: PlannedEndpoint,
    detail: string,
  ) {
    return res.status(501).json({
      success: false,
      status: "not_implemented",
      operation: endpoint.operation,
      method: endpoint.method,
      path: endpoint.path,
      requiredCapabilities: endpoint.requiredCapabilities,
      message: detail,
    });
  }

  app.get("/api/system/capabilities", (_req, res) => {
    const summary = getCapabilitySummary();
    res.json({
      summary,
      capabilities: FULL_APP_CAPABILITIES,
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

  // Planned full-pipeline endpoints (contract stubs).
  app.post("/api/pipeline/citeline/pull", (_req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/citeline/pull")!;
    return notImplemented(res, endpoint, "Citeline pull service is not implemented in this portal repo yet.");
  });

  app.post("/api/pipeline/daily-diff", (_req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/daily-diff")!;
    return notImplemented(res, endpoint, "Daily diff service is not implemented in this portal repo yet.");
  });

  app.post("/api/pipeline/enrich", (_req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/enrich")!;
    return notImplemented(res, endpoint, "External enrichment service is not implemented in this portal repo yet.");
  });

  app.post("/api/pipeline/classify", (_req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/classify")!;
    return notImplemented(res, endpoint, "Classification service is not implemented in this portal repo yet.");
  });

  app.post("/api/pipeline/qa", (_req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/qa")!;
    return notImplemented(res, endpoint, "QA validation service is not implemented in this portal repo yet.");
  });

  app.post("/api/pipeline/merge", (_req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/merge")!;
    return notImplemented(res, endpoint, "Incremental merge service is not implemented in this portal repo yet.");
  });

  app.post("/api/pipeline/export", (_req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/export")!;
    return notImplemented(res, endpoint, "Export service is not implemented in this portal repo yet.");
  });

  app.post("/api/pipeline/run/full", (_req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/run/full")!;
    return notImplemented(res, endpoint, "End-to-end orchestration is not implemented in this portal repo yet.");
  });

  app.get("/api/pipeline/runs", (_req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/runs")!;
    return notImplemented(res, endpoint, "Run history service is not implemented in this portal repo yet.");
  });

  app.get("/api/pipeline/run/:runId", (req, res) => {
    const endpoint = FULL_APP_PIPELINE_ENDPOINTS.find((e) => e.path === "/api/pipeline/run/:runId")!;
    const runId = req.params.runId;
    return notImplemented(
      res,
      endpoint,
      `Run detail service is not implemented in this portal repo yet (requested runId=${runId}).`,
    );
  });

  const httpServer = createServer(app);
  return httpServer;
}
