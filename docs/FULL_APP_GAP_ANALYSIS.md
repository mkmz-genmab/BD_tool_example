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

- `citeline_api_pull` (Implemented via adapter)
- Runs `api/citeline_api_example` pull + ideal-export scripts through `/api/pipeline/citeline/pull`

## 2) Daily Pipeline Orchestration

- `daily_diff` (Implemented via adapter)
- Detect NEW/UPDATED/UNCHANGED/REMOVED and carry forward unchanged enriched fields

## 3) Enrichment

- `external_enrichment` (Implemented via adapter)
- Conference abstract enrichment
- Company website enrichment
- Proposal/curated input enrichment
- Merge evidence into `*_merged` fields with URL/domain guardrails

## 4) Classification

- `classification_engine` (Implemented via adapter)
- Molecule classifier
- Masking classifier
- Payload classifier
- Rule-first + model fallback strategy

## 5) AI Summary + Provenance

- `ai_summary_generation` (Partial)
- Portal can consume summary deltas, but generation/calibration/guarding is missing

## 6) Quality and Compliance

- `taxonomy_guardrails` (Implemented via adapter)
- `qa_audits` (Implemented via adapter)
- AR readiness checks
- Narrative/source hygiene checks

## 7) Incremental Merge + Export

- `incremental_merge` (Implemented via adapter)
- `demo_export` (Implemented via adapter)

## 8) Operations

- `run_tracking` (Implemented: persistent JSON run store)
- `job_queue` (Implemented: bounded-concurrency in-process queue)
- `auth_rbac` (Implemented: API-key role gating for pipeline endpoints)

## Handoff API Surface Added

The app now exposes:

- `GET /api/system/capabilities`
- `GET /api/system/roadmap`
- `GET /api/system/full-app-endpoints`

And queue-backed async pipeline endpoints returning run IDs:

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
- `GET /api/pipeline/queue`

## Suggested Build Order

1. Ingestion + run tracking + queue
2. Daily diff + incremental merge
3. Enrichment services
4. Classification services
5. QA guardrails
6. Export + release workflow
7. Auth + RBAC hardening
