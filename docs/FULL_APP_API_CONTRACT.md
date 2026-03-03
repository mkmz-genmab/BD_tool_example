# Full App API Contract (Handoff)

This contract defines the target backend surface for the production-grade tool.

## System/Planning Endpoints

- `GET /api/system/capabilities`
  - Returns capability matrix with `implemented|partial|missing` states
- `GET /api/system/roadmap`
  - Returns phased implementation plan
- `GET /api/system/full-app-endpoints`
  - Returns planned endpoint list and required capability IDs

## Pipeline Endpoints (Implemented Adapters)

## 1) Citeline Pull

- `POST /api/pipeline/citeline/pull`
- Input example:

```json
{
  "queryFile": "queries/daily_anticancer_biologics.json",
  "outputJson": "output/portal_pipeline_runs/manual_pull/raw.json",
  "outputXlsx": "output/portal_pipeline_runs/manual_pull/today_upload.xlsx",
  "maxPages": 1
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
  "todayUpload": "output/portal_pipeline_runs/manual_pull/today_upload.xlsx",
  "previousMaster": "output/daily_enrichment_runs/full_daily_run/final_master_with_updates_full_daily_run.xlsx",
  "outDir": "output/portal_pipeline_runs/manual_diff"
}
```

## 3) Enrichment

- `POST /api/pipeline/enrich`

```json
{
  "inputFile": "output/portal_pipeline_runs/manual_diff/today_reclass_subset_20260303.xlsx",
  "outFile": "output/portal_pipeline_runs/manual_enrich/reclass_input_enriched.xlsx",
  "minConfidence": 0.6,
  "scrapeLive": true
}
```

## 4) Classification

- `POST /api/pipeline/classify`

```json
{
  "inputFile": "output/portal_pipeline_runs/manual_enrich/reclass_input_enriched.xlsx",
  "outputFile": "output/portal_pipeline_runs/manual_classify/master_classified.xlsx",
  "batchSize": 10,
  "disableAiSummary": false
}
```

## 5) QA

- `POST /api/pipeline/qa`

```json
{
  "inputFile": "output/portal_pipeline_runs/manual_classify/master_classified.xlsx",
  "outFile": "output/portal_pipeline_runs/manual_qa/master_enforced.xlsx"
}
```

## 6) Merge

- `POST /api/pipeline/merge`

```json
{
  "todaySeed": "output/portal_pipeline_runs/manual_diff/today_master_seed_20260303.xlsx",
  "reclassifiedSubset": "output/portal_pipeline_runs/manual_qa/master_enforced.xlsx",
  "outFile": "output/portal_pipeline_runs/manual_merge/master_merged.xlsx"
}
```

## 7) Export

- `POST /api/pipeline/export`

```json
{
  "masterFile": "output/portal_pipeline_runs/manual_merge/master_merged.xlsx",
  "outDir": "output/portal_pipeline_runs/manual_export",
  "dictionarySource": "data_from_demo/master_biopharma_dictionary_1765554660368.csv"
}
```

## 8) End-to-End

- `POST /api/pipeline/run/full`
- `GET /api/pipeline/runs`
- `GET /api/pipeline/run/:runId`

Upload-driven full-run example:

```json
{
  "includeApiPull": false,
  "todayUpload": "output/portal_pipeline_runs/manual_pull/today_upload.xlsx",
  "previousMaster": "output/daily_enrichment_runs/full_daily_run/final_master_with_updates_full_daily_run.xlsx",
  "dictionaryFile": "data_from_demo/master_biopharma_dictionary_1765554660368.csv"
}
```

API-pull full-run example:

```json
{
  "includeApiPull": true,
  "previousMaster": "output/daily_enrichment_runs/full_daily_run/final_master_with_updates_full_daily_run.xlsx",
  "dictionaryFile": "data_from_demo/master_biopharma_dictionary_1765554660368.csv",
  "maxPages": 1
}
```

## Current Status

In this repo, pipeline endpoints enqueue real background jobs and persist run records (`data/pipeline_runs.json` by default). They wrap existing `excel_v2` and Citeline scripts, so request payloads should provide local file paths (or rely on defaults) rather than S3 URIs.
