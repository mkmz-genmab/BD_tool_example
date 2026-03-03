# Component Mapping: excel_v2 -> drug-portal-app

This map helps implement the full pipeline in this app by reusing proven logic from `excel_v2`.

## Ingestion

- Source reference: `excel_v2/utils/run_api_to_daily_pipeline.py`
- App target module: `server/pipeline/citelinePull.ts` (to build)
- Responsibilities:
  - Citeline auth + paging
  - snapshot write + metadata
  - retry/backoff + partial failure handling

## Daily Diff

- Source reference: `excel_v2/utils/daily_upload_diff.py`
- App target module: `server/pipeline/dailyDiff.ts` (to build)
- Responsibilities:
  - row identity/hash comparison
  - change typing: NEW/UPDATED/UNCHANGED/REMOVED
  - carry-forward for unchanged rows

## Enrichment

- Source reference:
  - `excel_v2/enrichment/run_enrichment.py`
  - `excel_v2/enrichment/conference_abstracts.py`
  - `excel_v2/enrichment/company_scraper.py`
  - `excel_v2/enrichment/merge_evidence.py`
- App target modules:
  - `server/pipeline/enrich/index.ts` (to build)
  - `server/pipeline/enrich/abstracts.ts` (to build)
  - `server/pipeline/enrich/company.ts` (to build)
  - `server/pipeline/enrich/merge.ts` (to build)

## Classification

- Source reference:
  - `excel_v2/run_master_classification.py`
  - `excel_v2/molecule_identifier_descriptor.py`
  - `excel_v2/masking_identifier_descriptor.py`
  - `excel_v2/payload_identifier_descriptor.py`
- App target modules:
  - `server/pipeline/classify/index.ts` (to build)
  - `server/pipeline/classify/molecule.ts` (to build)
  - `server/pipeline/classify/masking.ts` (to build)
  - `server/pipeline/classify/payload.ts` (to build)

## QA + Guardrails

- Source reference:
  - `excel_v2/utils/enforce_ar_rules_on_master.py`
  - `excel_v2/utils/full_classifier_narrative_audit.py`
  - `excel_v2/utils/ar_readiness_report.py`
- App target modules:
  - `server/pipeline/qa/taxonomyGuard.ts` (to build)
  - `server/pipeline/qa/narrativeAudit.ts` (to build)
  - `server/pipeline/qa/readinessReport.ts` (to build)

## Merge + Export

- Source reference:
  - `excel_v2/utils/merge_incremental_master_updates.py`
  - `excel_v2/utils/export_demo_tool_format.py`
  - `excel_v2/utils/export_frontend_curated_view.py`
- App target modules:
  - `server/pipeline/merge.ts` (to build)
  - `server/pipeline/export.ts` (to build)

## Run Tracking + Queue

- Existing in app:
  - `server/pipelineRunStore.ts` (in-memory stub)
- To build next:
  - persistent DB table for runs + artifacts
  - worker queue executor (BullMQ/Temporal/Cloud Tasks)
