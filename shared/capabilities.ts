export type CapabilityStatus = "implemented" | "partial" | "missing";

export interface Capability {
  id: string;
  area: string;
  name: string;
  status: CapabilityStatus;
  presentInPortal: boolean;
  requiredForFullApp: boolean;
  description: string;
  implementationNotes: string;
}

export const FULL_APP_CAPABILITIES: Capability[] = [
  {
    id: "portal_ui",
    area: "Frontend",
    name: "Drug table UI, filters, search, column controls",
    status: "implemented",
    presentInPortal: true,
    requiredForFullApp: true,
    description: "Interactive table, concise/detailed views, filtering, search, legend, feedback context menu.",
    implementationNotes: "Already in client components and /api/drugs rendering path.",
  },
  {
    id: "local_data_loading",
    area: "Data Access",
    name: "Load local drug/dictionary/delta files",
    status: "implemented",
    presentInPortal: true,
    requiredForFullApp: true,
    description: "Reads local Excel/CSV assets for drugs, synonyms, preferred terms, crosstalk IDs, summary deltas.",
    implementationNotes: "Implemented in server/dataLoader.ts.",
  },
  {
    id: "feedback_capture",
    area: "Ops",
    name: "Feedback capture API",
    status: "partial",
    presentInPortal: true,
    requiredForFullApp: true,
    description: "Captures row/column feedback from UI.",
    implementationNotes: "Currently in-memory only; needs persistent DB + audit trail.",
  },
  {
    id: "citeline_api_pull",
    area: "Ingestion",
    name: "Citeline API pull (daily/full)",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Pull latest records from Citeline APIs and produce upload snapshots.",
    implementationNotes: "Needs API client integration, auth secrets, pagination, retries, and snapshot versioning.",
  },
  {
    id: "daily_diff",
    area: "Pipeline",
    name: "Daily diff + carry-forward",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Compare today vs previous master, classify NEW/UPDATED/UNCHANGED/REMOVED, carry-forward unchanged enrichments.",
    implementationNotes: "Equivalent capability exists in excel_v2 utils/daily_upload_diff.py.",
  },
  {
    id: "external_enrichment",
    area: "Pipeline",
    name: "External enrichment (abstracts/company/proposals)",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Augment rows with external evidence into *_merged fields and provenance columns.",
    implementationNotes: "Needs abstract matcher/vector fallback + company scraper + strict merge guards.",
  },
  {
    id: "classification_engine",
    area: "Pipeline",
    name: "Molecule + masking + payload classification",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Rule-first with model fallback classification for core taxonomy fields.",
    implementationNotes: "Equivalent in excel_v2 run_master_classification + three classifier scripts.",
  },
  {
    id: "ai_summary_generation",
    area: "Pipeline",
    name: "_aiSummary generation with source traceability",
    status: "partial",
    presentInPortal: true,
    requiredForFullApp: true,
    description: "Generate summary deltas from external evidence with source URL/source type/confidence.",
    implementationNotes: "Portal consumes precomputed summary deltas; generation engine missing in app.",
  },
  {
    id: "taxonomy_guardrails",
    area: "Quality",
    name: "Taxonomy normalization + AR rule enforcement",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Post-classification guards to enforce valid molecule/masking/payload combinations.",
    implementationNotes: "Equivalent in excel_v2 taxonomy guard + enforce_ar_rules_on_master.py.",
  },
  {
    id: "qa_audits",
    area: "Quality",
    name: "Narrative audit + readiness report",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Automated checks for domain mismatch, duplication, invalid labels, source quality.",
    implementationNotes: "Equivalent in excel_v2 full_classifier_narrative_audit + ar_readiness_report.",
  },
  {
    id: "incremental_merge",
    area: "Pipeline",
    name: "Merge incremental results into master",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Merge fresh NEW/UPDATED results into seeded master while preserving unchanged rows.",
    implementationNotes: "Equivalent in excel_v2 merge_incremental_master_updates.py.",
  },
  {
    id: "demo_export",
    area: "Export",
    name: "CrossTalk + summary_deltas + dictionary export",
    status: "partial",
    presentInPortal: true,
    requiredForFullApp: true,
    description: "Generate downstream demo/frontend files with stable schemas.",
    implementationNotes: "Portal reads exported files; export generation pipeline missing in app.",
  },
  {
    id: "run_tracking",
    area: "Ops",
    name: "Pipeline run tracking and history",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Track runs, statuses, durations, artifacts, errors.",
    implementationNotes: "Needs persistent run table + artifact registry.",
  },
  {
    id: "job_queue",
    area: "Ops",
    name: "Async job queue/workers",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Queue long-running ingestion/enrichment/classification jobs.",
    implementationNotes: "Needed to avoid API request timeouts and to scale runs.",
  },
  {
    id: "auth_rbac",
    area: "Security",
    name: "Auth + role-based access",
    status: "missing",
    presentInPortal: false,
    requiredForFullApp: true,
    description: "Secure access to data, admin endpoints, and run controls.",
    implementationNotes: "Current app has no authentication gates.",
  },
];

export interface PlannedEndpoint {
  method: "GET" | "POST";
  path: string;
  operation: string;
  requiredCapabilities: string[];
  purpose: string;
}

export const FULL_APP_PIPELINE_ENDPOINTS: PlannedEndpoint[] = [
  {
    method: "POST",
    path: "/api/pipeline/citeline/pull",
    operation: "citeline_pull",
    requiredCapabilities: ["citeline_api_pull", "run_tracking", "job_queue"],
    purpose: "Pull latest dataset snapshot from Citeline APIs.",
  },
  {
    method: "POST",
    path: "/api/pipeline/daily-diff",
    operation: "daily_diff",
    requiredCapabilities: ["daily_diff", "run_tracking"],
    purpose: "Compute NEW/UPDATED/UNCHANGED/REMOVED and seed reclass subset.",
  },
  {
    method: "POST",
    path: "/api/pipeline/enrich",
    operation: "enrichment",
    requiredCapabilities: ["external_enrichment", "run_tracking", "job_queue"],
    purpose: "Run external evidence enrichment and produce *_merged columns.",
  },
  {
    method: "POST",
    path: "/api/pipeline/classify",
    operation: "classification",
    requiredCapabilities: ["classification_engine", "run_tracking", "job_queue"],
    purpose: "Run molecule/masking/payload classification.",
  },
  {
    method: "POST",
    path: "/api/pipeline/qa",
    operation: "qa_validation",
    requiredCapabilities: ["taxonomy_guardrails", "qa_audits", "run_tracking"],
    purpose: "Run taxonomy guards and AR readiness audits.",
  },
  {
    method: "POST",
    path: "/api/pipeline/merge",
    operation: "incremental_merge",
    requiredCapabilities: ["incremental_merge", "run_tracking"],
    purpose: "Merge classified subset back to master.",
  },
  {
    method: "POST",
    path: "/api/pipeline/export",
    operation: "export_outputs",
    requiredCapabilities: ["demo_export", "run_tracking"],
    purpose: "Export CrossTalk, summary deltas, dictionary outputs.",
  },
  {
    method: "POST",
    path: "/api/pipeline/run/full",
    operation: "full_pipeline",
    requiredCapabilities: [
      "citeline_api_pull",
      "daily_diff",
      "external_enrichment",
      "classification_engine",
      "taxonomy_guardrails",
      "qa_audits",
      "incremental_merge",
      "demo_export",
      "run_tracking",
      "job_queue",
    ],
    purpose: "Execute end-to-end daily pipeline with run tracking.",
  },
  {
    method: "GET",
    path: "/api/pipeline/runs",
    operation: "list_runs",
    requiredCapabilities: ["run_tracking"],
    purpose: "List historical runs and statuses.",
  },
  {
    method: "GET",
    path: "/api/pipeline/run/:runId",
    operation: "get_run",
    requiredCapabilities: ["run_tracking"],
    purpose: "Get run details, logs, and artifact references.",
  },
];

export function getCapabilitySummary() {
  const total = FULL_APP_CAPABILITIES.length;
  const implemented = FULL_APP_CAPABILITIES.filter((c) => c.status === "implemented").length;
  const partial = FULL_APP_CAPABILITIES.filter((c) => c.status === "partial").length;
  const missing = FULL_APP_CAPABILITIES.filter((c) => c.status === "missing").length;
  const requiredForFullApp = FULL_APP_CAPABILITIES.filter((c) => c.requiredForFullApp).length;

  return {
    total,
    implemented,
    partial,
    missing,
    requiredForFullApp,
  };
}
