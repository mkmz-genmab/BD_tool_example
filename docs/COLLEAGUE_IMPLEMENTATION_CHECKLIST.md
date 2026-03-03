# Colleague Implementation Checklist

Use this checklist to convert the current portal into the full production tool.

## Phase 1: Foundation

- [ ] Add persistent DB models for `pipeline_runs`, `pipeline_artifacts`, `feedback_entries`
- [ ] Replace in-memory feedback store with DB-backed service
- [ ] Add auth and basic RBAC (admin/operator/viewer)
- [ ] Add secrets management for Citeline + model keys

## Phase 2: Ingestion + Diff

- [ ] Implement `POST /api/pipeline/citeline/pull`
- [ ] Implement `POST /api/pipeline/daily-diff`
- [ ] Persist snapshots + diff manifests
- [ ] Add retry and idempotency keys

## Phase 3: Enrichment + Classification

- [ ] Implement `POST /api/pipeline/enrich`
- [ ] Implement `POST /api/pipeline/classify`
- [ ] Integrate rule-first classification and model fallback
- [ ] Persist intermediate enriched/classified artifacts

## Phase 4: QA + Merge + Export

- [ ] Implement `POST /api/pipeline/qa`
- [ ] Implement `POST /api/pipeline/merge`
- [ ] Implement `POST /api/pipeline/export`
- [ ] Enforce AR taxonomy/source guardrails pre-release

## Phase 5: Orchestration + Observability

- [ ] Implement `POST /api/pipeline/run/full`
- [ ] Add queue workers and concurrency controls
- [ ] Add run logs + metrics + alerts
- [ ] Add run cancellation/retry endpoints

## Ready-for-Handoff Proof

- [ ] `npm run check` passes
- [ ] `npm run build` passes
- [ ] `/api/system/capabilities` accurately reflects status
- [ ] `/api/pipeline/*` endpoints either execute or return explicit blockers
- [ ] Demo run produces artifacts with source provenance and QA report
