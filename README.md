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

Admin endpoints (require JWT from `/api/admin/login`):
- `POST /api/admin/login` — body `{ username, password }` returns `{ token }`
- `GET /api/admin/contacts` — returns saved contacts
- `POST /api/admin/test-email` — sends a test email (body optional `{ to }`)

Seeding admin user
- Run `node scripts/seedAdmin.js <username> <password>` after setting `MONGODB_URI` in your `.env` to create or update the admin user in the database.

Connecting MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com and create a database user.
2. Whitelist your IP or allow access from anywhere (for quick testing) under Network Access.
3. Copy the connection string (SRV) and set `MONGODB_URI` in `.env`.
4. Run `node validate-db.js` to confirm connection and optionally migrate `contacts.json`.

SMTP / Email testing
1. Sign up for a transactional email provider (SendGrid, Mailgun, or SMTP from your provider).
2. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` in `.env`.
3. Use the admin login to obtain a JWT and call `POST /api/admin/test-email` to verify.


Notes
- When `MONGODB_URI` is not provided the server falls back to appending messages to `contacts.json`.
- Admin UI, auth, and analytics will be implemented in later phases.
