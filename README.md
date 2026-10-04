# RWA Connect Hub

A residents' association portal with public notices, events, documents and
payment submissions, plus an admin interface for managing association records.
The frontend uses React, TypeScript, Vite and Tailwind. The main backend uses
Express and PostgreSQL, with JWT authentication and local file uploads.

An alternative Google Sheets/Drive adapter is included. It is a prototype with
different capabilities and access controls; it is not a drop-in replacement for
the Express backend.

## Quick start

Use Node.js 20 or newer and PostgreSQL 14 or newer. The instructions below use npm.

```bash
git clone https://github.com/anshvashist0001/rwa-connect-hub.git
cd rwa-connect-hub
npm ci
```

Copy `.env.example` to `.env`. Leave `VITE_GOOGLE_SCRIPT_URL` blank for the main
backend and keep `VITE_DEMO_MODE=false`.

```bash
cd backend
npm ci
# Copy backend/.env.example to backend/.env and fill in local values.
# Create the rwa_connect database in PostgreSQL before initialization.
npm run db:init
npm run dev
```

Set a unique `ADMIN_PASSWORD` of at least 12 characters and a long random
`JWT_SECRET`. Initialization does not reset an existing admin's password.
In a second terminal, from the repository root:

```bash
npm run dev
```

Frontend: `http://localhost:8080`. API: `http://localhost:5000/api`.
Admin sign-in: `/admin/login`. See [SETUP.md](SETUP.md) for platform-specific
copy commands and troubleshooting.

## Features and storage

| Area | Implementation |
|---|---|
| Notices, events, documents, committee | Public views and administrative CRUD routes |
| Payments | Submission of payment details and evidence, then manual review |
| Members and houses | Admin records and filtering |
| Dashboard and reports | Summaries from stored association records |
| Admin authentication | Express login, signed JWT and session validation |
| Uploads | Local backend directory in Express mode |
| Gallery and fee presets | Browser-local storage is used in parts of the frontend |
| Google adapter | Sheets records and Drive uploads through Apps Script |

Payment submission is record keeping; the app is not a payment gateway.
Some pages retain local demonstration fallbacks when an API request fails. Local
data is stored per browser and is not shared between residents or machines.

## Architecture

```text
src/pages/              Public routes
src/pages/admin/        Administrative screens
src/lib/api.ts          Express client and adapter selection
src/lib/googleApi.ts    Apps Script client
src/lib/demoStore.ts    Browser-local demonstration records
backend/routes/         Express endpoints
backend/db/schema.sql   PostgreSQL schema
backend/.env.example    Backend configuration template
google-apps-script/     Alternative Sheets/Drive implementation
```

The Google adapter is selected when `VITE_GOOGLE_SCRIPT_URL` is populated.
Admin login still calls Express. Read [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)
before enabling that mode.

## Checks

```bash
npm test
npm run build
npx tsc --noEmit -p tsconfig.app.json
```

Tests cover fee persistence, invalid session handling and rejection of demo
credentials when demo mode is disabled. A frontend build checks bundling, but
does not validate a running PostgreSQL database or a deployed Apps Script service.
`npm run lint` also exposes existing issues elsewhere in the project; see the PR
validation notes for the current check results.

## Demo mode

For a local preview only, set `VITE_DEMO_MODE=true` and restart Vite. The demo
credentials are `admin` / `admin123`. Demo login is not accepted by default after
a failed backend request. Demo records remain in browser storage and can be
cleared through browser site-data settings.

## Deployment limits

Serve the frontend over HTTPS, configure the API origin, keep secrets out of
`VITE_*` variables, and back up PostgreSQL and uploads separately. Client route
guards improve navigation; server endpoints must enforce authorization.

The Sheets adapter currently lacks server-side authorization for its write
actions and makes uploaded files link-accessible. It is unsuitable for private
resident or payment data without further work. Gallery/local fallback behavior,
role permissions, upload handling and payment-status access also need a deployment
review. This repository should be treated as a project prototype.

## Contributions

The repository includes work by multiple contributors. Its commit history records
those contributions. Describe your own implementation work separately when
presenting the project; ownership of this repository alone does not establish
authorship of every component.
