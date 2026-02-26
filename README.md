# Institution Search — Static Data Edition

A lightweight Nuxt 4 application for searching institution data, powered entirely by in-memory JSON — no database required.

## Architecture

```
┌─────────────────────────┐
│   Nuxt 4 (single process)│
│                          │
│  Vue 3 SPA  ◄──► Nitro  │
│  (frontend)    (server)  │
│                   │      │
│            JSON in memory │
└─────────────────────────┘
```

- **Frontend**: Vue 3 with Nuxt 4 pages, components, composables
- **Backend**: Nitro server API routes (same Node.js process)
- **Data**: `institutions.json` loaded into memory at startup
- **No external dependencies**: No PostgreSQL, no Docker, no FDW

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Export data

**Option A** — From running Option 1 Postgres databases:

```bash
# Start Option 1 databases first
cd .. && docker compose -f option_1/docker-compose.option1.yml up -d
cd search-ui-static

# Export
bash scripts/export-data.sh
```

**Option B** — Directly from the Excel source file:

```bash
pip install openpyxl
python3 scripts/export-from-excel.py --input ../shared/data/institutions.xlsx
```

Both produce `data/institutions.json`.

### 3. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

### 4. Build for production (EC2)

```bash
npm run build
node .output/server/index.mjs
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check with record counts |
| `GET /api/locations/countries` | List all distinct countries |
| `GET /api/locations/cities/:country` | List cities for a country |
| `GET /api/locations/search?country=X&city=Y&limit=25` | Search institutions |

All responses include a `metrics` object with `duration_ms`, `result_count`, `query_source`, and `scan_type`.

## EC2 Deployment

```bash
# On EC2 instance
git clone <repo> && cd search-ui-static
npm install && npm run build

# Upload data file
scp data/institutions.json ec2-user@<ip>:~/search-ui-static/data/

# Run with PM2
npm i -g pm2
PORT=3000 pm2 start .output/server/index.mjs --name institution-search
pm2 save && pm2 startup
```

### Resource Requirements

| Metric | Value |
|--------|-------|
| Memory | ~200-250 MB (data in memory) |
| CPU | Minimal (in-memory filtering) |
| Disk | ~100 MB (app + data) |
| Recommended EC2 | `t3.small` (2 GB RAM) or larger |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DATA_FILE_PATH` | `data/institutions.json` | Path to the data file |

## Project Structure

```
search-ui-static/
├── nuxt.config.ts
├── package.json
├── data/
│   └── institutions.json          # ~416K records (~80MB)
├── scripts/
│   ├── export-data.sh             # Export from Postgres
│   └── export-from-excel.py       # Export from Excel
├── server/
│   ├── plugins/loadData.ts        # Eager-load data at startup
│   ├── utils/dataStore.ts         # Singleton data store + indexes
│   └── api/
│       ├── health.get.ts
│       └── locations/
│           ├── countries.get.ts
│           ├── cities/[country].get.ts
│           └── search.get.ts
└── app/
    ├── app.vue
    ├── pages/index.vue
    ├── components/
    │   ├── SearchBox.vue
    │   └── ResultsList.vue
    └── composables/
        └── useSearch.ts
```

## Comparison with search-ui (database version)

| Aspect | search-ui | search-ui-static |
|--------|-----------|-------------------|
| Backend | AdonisJS + PostgreSQL FDW | Nitro (same process) |
| Database | PostgreSQL with FDW | None — JSON in memory |
| CORS | Required | Not needed (same-origin) |
| Deployment | Docker + multiple services | Single Node.js process |
| Query speed | 5-40ms | 1-20ms |
