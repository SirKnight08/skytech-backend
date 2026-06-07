SkyTech backend (minimal scaffold)

Quick start:

1. cd skytech-backend
2. npm install
3. npm run dev

This scaffold provides a simple Express server with a `/api/contact` endpoint that writes to `contacts.json`.
Phase 2 will replace the file store with MongoDB/Postgres and add secure admin UI.

Environment variables
- Create a `.env` file from `.env.example` and set `MONGODB_URI` to enable MongoDB persistence.
- Optionally set SMTP vars (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) to enable email notifications.

Endpoints
- `GET /api/health` — health check
- `POST /api/contact` — accepts JSON `{ name, email, phone, company, service, message }`

Notes
- When `MONGODB_URI` is not provided the server falls back to appending messages to `contacts.json`.
- Admin UI, auth, and analytics will be implemented in later phases.
