# Mantra4Change PBL Dashboard

A minimal monorepo for a synthetic PBL program review dashboard with grant reporting and chart analytics.

## Quick start

### Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+ / 3.12
- Docker (for MongoDB)

### Install

```bash
npm install
npm run install:analytics
```

### Run locally

```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
cp apps/analytics/.env.example apps/analytics/.env

docker compose up -d
npm run seed
npm run dev
```

### Local URLs

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`
- Analytics: `http://localhost:8000`
- MongoDB: `mongodb://localhost:27017/mantra4change`

## Commands

- `npm run dev` — start client, server, and analytics
- `npm run seed` — load CSV data into MongoDB
- `npm run verify` — run verification checks
- `npm test` — run server and Python tests
- `npm run build` — build client, server, and shared types
- `npm run lint` — lint workspaces

## Repo structure

- `apps/client` — React + Vite dashboard
- `apps/server` — Express API, MongoDB, report services
- `apps/analytics` — Python FastAPI chart generation
- `packages/shared-types` — shared TypeScript schemas

## Notes

- Data is seeded from CSV files in `02_Primary_PBL_Data` and `03_Grant_Reporting_Evidence/csv`.
- AI narrative is optional and requires provider keys in `apps/server/.env`.
- CI is configured in `.github/workflows/ci.yml`.
