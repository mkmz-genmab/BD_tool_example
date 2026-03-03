# Full App Gap Analysis

This document compares the current `drug-portal-app` codebase with the full production pipeline capabilities required for a complete tool.

## Current Portal Scope (Implemented)

- Table UI for drug records (search/filter/view modes)
- Local-file data loading (`data/*.csv|xlsx`)
- Target synonym and preferred-term lookup
- Summary delta display in UI
- Basic feedback capture API (in-memory)

## Missing or Partial Capabilities (For Full App)

## 1) Ingestion

- `citeline_api_pull` (Missing)
- Pull latest snapshots from Citeline APIs, with auth, paging, retry, versioned outputs

## 2) Daily Pipeline Orchestration

- `daily_diff` (Missing)
- Detect NEW/UPDATED/UNCHANGED/REMOVED and carry forward unchanged enriched fields

## 3) Enrichment

- `external_enrichment` (Missing)
- Conference abstract enrichment
- Company website enrichment
- Proposal/curated input enrichment
- Merge evidence into `*_merged` fields with URL/domain guardrails

## 4) Classification

- `classification_engine` (Missing)
- Molecule classifier
- Masking classifier
- Payload classifier
- Rule-first + model fallback strategy

## 5) AI Summary + Provenance

- `ai_summary_generation` (Partial)
- Portal can consume summary deltas, but generation/calibration/guarding is missing

## 6) Quality and Compliance

- `taxonomy_guardrails` (Missing)
- `qa_audits` (Missing)
- AR readiness checks
- Narrative/source hygiene checks

## 7) Incremental Merge + Export

- `incremental_merge` (Missing)
- `demo_export` (Partial)
- Portal consumes exported files but does not generate them

## 8) Operations

- `run_tracking` (Missing)
- `job_queue` (Missing)
- `auth_rbac` (Missing)

## Handoff API Surface Added

The app now exposes:

- `GET /api/system/capabilities`
- `GET /api/system/roadmap`
- `GET /api/system/full-app-endpoints`

And planned (stubbed) pipeline endpoints returning `501 Not Implemented` with required capability IDs:

- `POST /api/pipeline/citeline/pull`
- `POST /api/pipeline/daily-diff`
- `POST /api/pipeline/enrich`
- `POST /api/pipeline/classify`
- `POST /api/pipeline/qa`
- `POST /api/pipeline/merge`
- `POST /api/pipeline/export`
- `POST /api/pipeline/run/full`
- `GET /api/pipeline/runs`
- `GET /api/pipeline/run/:runId`

## Suggested Build Order

1. Ingestion + run tracking + queue
2. Daily diff + incremental merge
3. Enrichment services
4. Classification services
5. QA guardrails
6. Export + release workflow
7. Auth + RBAC hardening
