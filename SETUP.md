# RWA Connect Hub — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

---

## 1. Database Setup

```sql
-- In psql or pgAdmin, create the database:
CREATE DATABASE rwa_connect;
```

---

## 2. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

# Initialize database (creates tables + default admin)
npm run db:init

# Start backend
npm run dev       # development (nodemon)
npm start         # production
```

Backend runs on: **http://localhost:5000**

Default admin credentials (set in .env):
- Username: `admin`
- Password: `admin123`

---

## 3. Frontend Setup

```bash
# In the root (rwa-connect-hub) directory
npm install

# Copy environment file
cp .env.example .env
# Default: VITE_API_URL=http://localhost:5000/api

# Start frontend
npm run dev
```

Frontend runs on: **http://localhost:8080**

---

## 4. Access Points

| URL | Description |
|-----|-------------|
| `http://localhost:8080/` | Home page (public) |
| `http://localhost:8080/notices` | Notices (public) |
| `http://localhost:8080/events` | Events (public) |
| `http://localhost:8080/payments` | Pay & check status (public) |
| `http://localhost:8080/documents` | Documents (public) |
| `http://localhost:8080/admin/login` | Admin login |
| `http://localhost:8080/admin/dashboard` | Admin dashboard |
| `http://localhost:5000/api/health` | API health check |

---

## 5. Architecture

```
rwa-connect-hub/
├── src/                          # React frontend
│   ├── pages/                    # Public pages
│   ├── pages/admin/              # Admin panel pages
│   ├── components/admin/         # AdminLayout, ProtectedRoute
│   └── lib/api.ts                # API client
└── backend/                      # Node.js/Express API
    ├── server.js                  # Entry point
    ├── routes/                    # All API routes
    ├── middleware/                # Auth, upload, logger
    ├── config/db.js               # PostgreSQL pool
    ├── db/schema.sql              # Database schema
    └── uploads/                   # File storage
```

---

## 6. API Routes

### Public
- `GET  /api/notices` — list notices
- `GET  /api/events?upcoming=true` — list events
- `POST /api/payments` — submit payment (multipart/form-data)
- `GET  /api/payments/check?phone=xxx` — check payment status
- `GET  /api/documents` — list documents

### Admin (Bearer token required)
- `POST /api/auth/login` — get JWT token
- `POST /api/notices` — create notice (with file upload)
- `PUT  /api/notices/:id` — update notice
- `DELETE /api/notices/:id` — delete notice
- `POST /api/events` — create event
- `GET  /api/payments` — all payments
- `PUT  /api/payments/:id` — approve/reject payment
- `POST /api/documents` — upload document
- `GET  /api/members` — all members
- `POST /api/members` — add member
- `GET  /api/houses` — all flats
- `GET  /api/dashboard` — stats
- `GET  /api/reports/payments` — payment reports (filterable)
- `GET  /api/logs` — audit logs

---

## 7. WhatsApp Sharing

No WhatsApp API key required. The Share button generates a `wa.me` link with a pre-filled message. Admin clicks it → opens WhatsApp Web/app → sends manually.

---

## 8. Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Use a process manager: `pm2 start server.js`
3. Configure Nginx as reverse proxy
4. Set `FRONTEND_URL` to your actual domain in backend `.env`
5. Update `VITE_API_URL` in frontend `.env` to production API URL
6. Run `npm run build` for frontend, serve `dist/` folder
