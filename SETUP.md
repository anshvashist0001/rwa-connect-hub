# Local setup

## 1. Frontend configuration

From the repository root, install dependencies with `npm ci`. Copy the template:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS/Linux
cp .env.example .env
```

Use `VITE_API_URL=http://localhost:5000/api`, leave `VITE_GOOGLE_SCRIPT_URL` blank,
and keep `VITE_DEMO_MODE=false`. Vite reads configuration at startup; restart it
after editing `.env`. All `VITE_*` values are visible in the browser bundle.

## 2. PostgreSQL and API

Create a database named `rwa_connect` using your local PostgreSQL tools:

```sql
CREATE DATABASE rwa_connect;
```

In `backend/`, run `npm ci` and copy its own `.env.example` to `.env`. Configure
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` and `DB_PASSWORD`, then set `JWT_SECRET`
and a unique `ADMIN_PASSWORD` of at least 12 characters.

```bash
npm run db:init
npm run dev
```

The initializer applies the schema and creates an admin if that username does not
already exist. It does not overwrite an existing password. `npm start` runs the
API without the development watcher.

## 3. Start and verify

In another terminal, from the repository root:

```bash
npm run dev
```

Check `http://localhost:5000/api/health`, open `http://localhost:8080`, then sign
in at `/admin/login` with the credentials you configured. Create a test notice
and confirm it appears in the public list. Use test data only for local checks.

## Troubleshooting

- Database connection errors: confirm PostgreSQL is running and the backend
  credentials match it. The frontend `.env` does not configure PostgreSQL.
- Sign-in failure: confirm the API is running, the schema is initialized and the
  admin exists. An API failure does not automatically enable demo access.
- CORS errors: `FRONTEND_URL` must match the frontend origin, including its port.
- Missing uploads: keep `backend/uploads/` with the backend and preserve it during
  deployment; database rows do not contain the file bytes.
- Google requests unexpectedly enabled: clear `VITE_GOOGLE_SCRIPT_URL` and restart Vite.
- Data visible only in one browser: that feature is using browser-local demo
  storage; it is not a synchronized backend record.

## Build

`npm run build` writes the frontend bundle to `dist/`. Serve it with SPA routing
fallback and configure the API URL before building. The API and PostgreSQL run
separately. No production hosting configuration is included.
