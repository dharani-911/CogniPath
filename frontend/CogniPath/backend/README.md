# CogniPath SQLite Backend

This backend uses Python's standard library and SQLite, so it runs without installing packages.

## Start

From the `CogniPath` folder:

```powershell
.\start-database-server.ps1
```

Then open:

```text
http://127.0.0.1:8000
```

## Database

The SQLite file is created automatically at:

```text
backend/cognipath.db
```

## API Routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `GET /api/users`
- `GET /api/profile?email=...`
- `PATCH /api/profile`
- `GET /api/career-inputs`
- `POST /api/career-inputs`
- `POST /api/reports`
- `DELETE /api/admin/users/{email}`

The route shape is intentionally close to a future FastAPI migration.
