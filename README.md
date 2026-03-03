# Drug Portal App

Full-stack TypeScript app (Express + React/Vite) for browsing and reviewing curated drug records.

## What Was Cleaned

- Removed Replit-generated asset clutter from `attached_assets/`.
- Normalized runtime data files into stable names under `data/`.
- Replaced hardcoded timestamped paths with env-driven paths.
- Added `.env.example` and improved `.gitignore`.
- Made API behavior explicit for sampling/demo flags.

## Project Structure

- `server/` Express API
- `client/` React app (Vite)
- `shared/` shared types/schema
- `data/` runtime data files used by the API

## Required Data Files

By default, the app reads:

- `data/target_synonyms.csv`
- `data/drug_data.xlsx`
- `data/preferred_terms.xlsx`
- `data/crosstalk_ids.csv`
- `data/summary_deltas.csv`

You can override any path via env vars in `.env`.

## Local Run

1. Install deps:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Start dev server:

```bash
npm run dev
```

4. Open:

`http://localhost:5000`

## Production Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t drug-portal-app .
docker run --rm -p 5000:5000 drug-portal-app
```

## Deployment Notes

- Runtime only needs Node + the `data/` files.
- Set `PORT` from platform environment.
- Set `DRUG_SAMPLE_FRACTION=1` for full dataset in shared environments.
- Keep `INJECT_DEMO_NEW_INFO=false` unless intentionally demoing synthetic badges.

## Git-Ready Checklist

- Commit source + `data/` example files.
- Do not commit `.env`.
- Validate with:

```bash
npm run check
npm run build
```

## Push To A New Git Repo

```bash
git init
git add .
git commit -m "Initial shareable drug portal app"
git branch -M main
git remote add origin <YOUR_REMOTE_URL>
git push -u origin main
```

## Full App Handoff (What Still Needs To Be Built)

This repo now includes explicit planning artifacts for production buildout:

- `docs/FULL_APP_GAP_ANALYSIS.md`
- `docs/FULL_APP_API_CONTRACT.md`
- `shared/capabilities.ts`

You can inspect capability status via API:

- `GET /api/system/capabilities`
- `GET /api/system/roadmap`
- `GET /api/system/full-app-endpoints`

Planned pipeline endpoints are present as stubs (`501 Not Implemented`) so frontend/backend teams can align early on contracts:

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
