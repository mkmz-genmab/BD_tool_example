# Full App API Contract (Handoff)

This contract defines the target backend surface for the production-grade tool.

## System/Planning Endpoints

- `GET /api/system/capabilities`
  - Returns capability matrix with `implemented|partial|missing` states
- `GET /api/system/roadmap`
  - Returns phased implementation plan
- `GET /api/system/full-app-endpoints`
  - Returns planned endpoint list and required capability IDs

## Pipeline Endpoints (Planned)

## 1) Citeline Pull

- `POST /api/pipeline/citeline/pull`
- Input example:

```json
{
  "mode": "daily",
  "query": "oncology_protein_tx",
  "maxPages": 200
}
```

- Output example:

```json
{
  "runId": "run_20260303_001",
  "status": "queued"
}
```

## 2) Daily Diff

- `POST /api/pipeline/daily-diff`

```json
{
  "todaySnapshot": "s3://.../today.xlsx",
  "previousMaster": "s3://.../master_prev.xlsx"
}
```

## 3) Enrichment

- `POST /api/pipeline/enrich`

```json
{
  "inputSubset": "s3://.../today_reclass_subset.xlsx",
  "minConfidence": 0.6,
  "scrapeLive": true
}
```

## 4) Classification

- `POST /api/pipeline/classify`

```json
{
  "inputEnriched": "s3://.../reclass_input_enriched.xlsx",
  "batchSize": 10,
  "generateAiSummary": true
}
```

## 5) QA

- `POST /api/pipeline/qa`

```json
{
  "masterFile": "s3://.../master_reclass.xlsx"
}
```

## 6) Merge

- `POST /api/pipeline/merge`

```json
{
  "seededMaster": "s3://.../today_master_seed.xlsx",
  "classifiedSubset": "s3://.../master_reclass_subset.xlsx"
}
```

## 7) Export

- `POST /api/pipeline/export`

```json
{
  "masterFile": "s3://.../master_latest.xlsx",
  "exportDemo": true,
  "exportFrontend": true
}
```

## 8) End-to-End

- `POST /api/pipeline/run/full`
- `GET /api/pipeline/runs`
- `GET /api/pipeline/run/:runId`

## Current Status

In this repo, all pipeline endpoints above are intentionally stubbed with `501 Not Implemented` and explicit capability requirements for build planning.
