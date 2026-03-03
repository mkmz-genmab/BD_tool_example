# Drug Portal App

Full-stack TypeScript app (Express + React/Vite) for running the drug data pipeline and serving curated output to the frontend.

## Repo Status

- Yes, this repo has a README.
- Yes, it is cleaned and git-ready for handoff.
- Pipeline endpoints are implemented as async queued jobs (not stubs).

## End-to-End Process

This is the full process from raw pull to frontend display.

1. **Daily Citeline pull**
- Pull latest rows from Citeline API and export to ideal upload format.
- Endpoint: `POST /api/pipeline/citeline/pull`

2. **Daily diff vs previous master**
- Compare today upload with previous day master.
- Mark rows as `NEW`, `UPDATED`, `UNCHANGED`, or `REMOVED`.
- Carry forward prior curated/enriched values for unchanged rows.
- Endpoint: `POST /api/pipeline/daily-diff`

3. **Enrichment for rows that changed**
- Enrich `NEW`/`UPDATED` rows with:
  - conference abstracts
  - company website evidence
  - proposal/company assets data
- Endpoint: `POST /api/pipeline/enrich`

4. **Classification**
- Run molecule/masking/payload classification for rows that need it.
- Generate/refresh AI summary fields where applicable.
- Endpoint: `POST /api/pipeline/classify`

5. **QA + taxonomy guardrails**
- Enforce taxonomy validity and AR-specific rule checks.
- Run narrative audit + readiness reporting.
- Endpoint: `POST /api/pipeline/qa`

6. **Incremental merge**
- Merge newly classified subset back into seeded daily master.
- Preserve unchanged rows and existing trusted values.
- Endpoint: `POST /api/pipeline/merge`

7. **Export frontend/demo outputs**
- Export files consumed downstream (CrossTalk, summary deltas, dictionary outputs).
- Endpoint: `POST /api/pipeline/export`

8. **Frontend consumption**
- Frontend reads curated outputs and serves searchable/filtered table UI.
- Main data API: `GET /api/drugs`

9. **Optional single-command full run**
- Endpoint: `POST /api/pipeline/run/full`

## Recommended Cadence

1. **Daily**
- Citeline pull
- Diff
- Enrich changed rows
- Classify changed rows
- QA
- Merge
- Export

2. **Weekly (or daily if resources allow)**
- Refresh trusted company assets cache/source pulls.
- Revalidate high-impact company website data quality.

3. **Periodic backfill**
- Re-run selected older rows when taxonomy rules, dictionaries, or enrichment logic change.

## What You Were Missing

Your summary was strong. The extra critical pieces are:

1. **QA/taxonomy enforcement**
- Without this, invalid or inconsistent labels leak into output.

2. **Incremental merge behavior**
- Must preserve trusted unchanged records while only updating changed rows.

3. **Export layer**
- Frontend should consume stable exported schema, not ad-hoc intermediate outputs.

4. **Run tracking + queueing**
- Prevents request timeouts and gives auditability for failures/artifacts.

5. **Data freshness policy**
- Company/website enrichment needs scheduled refresh to avoid stale or contaminated data.

6. **Provenance and confidence guardrails**
- Keep source URLs/source types/confidence to avoid junk merges and misassignment.

## Pipeline API Surface

### System/Planning

- `GET /api/system/capabilities`
- `GET /api/system/roadmap`
- `GET /api/system/full-app-endpoints`

### Pipeline

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

Each pipeline POST returns quickly with a `runId` (`202`) and executes in the background queue.

## Auth / RBAC

Pipeline endpoints support API-key RBAC.

- Env format: `PIPELINE_API_KEYS=viewerToken:viewer,operatorToken:operator,adminToken:admin`
- Header: `x-api-key: <token>` or `Authorization: Bearer <token>`
- If `PIPELINE_API_KEYS` is not set, pipeline auth is open (dev mode).

## Run Tracking

- Run store default: `data/pipeline_runs.json`
- Override with: `PIPELINE_RUN_STORE_PATH`
- Captures:
  - status transitions
  - step events/log lines
  - command records (duration, exit code, timeout)
  - artifact paths

## Project Structure

- `server/` API, queue, run tracking, pipeline adapters
- `client/` frontend app (Vite)
- `shared/` shared contracts/types
- `data/` runtime data files
- `docs/` handoff and API contract docs

## Required Data Files (Default)

- `data/target_synonyms.csv`
- `data/drug_data.xlsx`
- `data/preferred_terms.xlsx`
- `data/crosstalk_ids.csv`
- `data/summary_deltas.csv`

## Environment Configuration

Start from `.env.example`.

Important pipeline settings:

- `EXCEL_V2_ROOT`
- `CITELINE_API_ROOT`
- `PIPELINE_OUTPUT_ROOT`
- `PIPELINE_PYTHON_BIN`
- `PIPELINE_STEP_TIMEOUT_SECONDS`
- `PIPELINE_QUEUE_CONCURRENCY`
- `PIPELINE_RUN_STORE_PATH`
- `PIPELINE_API_KEYS`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Run app:

```bash
npm run dev
```

4. Open:

- `http://localhost:5000`
- Planner view: `http://localhost:5000/system`

## Build / Validation

```bash
npm run check
npm run build
```

## Docker

```bash
docker build -t drug-portal-app .
docker run --rm -p 5000:5000 drug-portal-app
```

## Handoff Docs

- `docs/FULL_APP_GAP_ANALYSIS.md`
- `docs/FULL_APP_API_CONTRACT.md`
- `docs/COMPONENT_MAPPING_FROM_EXCEL_V2.md`
- `docs/COLLEAGUE_IMPLEMENTATION_CHECKLIST.md`
- `openapi.full-app.yaml`
