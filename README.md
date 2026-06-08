# skytech-backend

SkyTech backend API for a portfolio contact form.

## Features

- Express.js server with `express.json()` and CORS enabled
- `POST /api/contact` accepts JSON contact submissions
- Required field validation for `name`, `email`, and `message`
- Local backup to `data/contacts.json`
- Placeholder Nodemailer support for future Gmail SMTP configuration
- Production-ready deployment support using environment variables

## Routes

- `GET /` — returns `SkyTech Backend API is running`
- `GET /api/health` — health check response
- `POST /api/contact` — accepts JSON `{ name, email, phone, company, service, message }`

## Setup

1. `cd skytech-backend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Set your environment values in `.env`
5. `npm run dev` for local development

## Environment

Use `.env` to configure:

```env
PORT=3000
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_TO=skytech08088@gmail.com
EMAIL_FROM=yourgmail@gmail.com
```

## Deploying

- This backend is ready for Render or any Node.js hosting.
- No hardcoded localhost URLs are included.
- The backend listens on `process.env.PORT || 3000`.

## Notes

- Email sending is optional and will be skipped until Gmail SMTP variables are configured.
- Contact submissions are always stored in `data/contacts.json`.
