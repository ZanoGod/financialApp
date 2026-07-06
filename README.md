# Personal Finance Management System

React + TypeScript frontend with a PHP 8.2+ REST API backend for cPanel shared
hosting. Firebase and user-account login have been removed.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Lucide React
- Backend: PHP 8.2+, PDO, JSON REST endpoints, 4-digit PIN + JWT authentication
- Database: MySQL or MariaDB

## Local Frontend

```bash
npm install
npm run dev
```

Set the API base URL when the backend is not hosted at `/api`:

```bash
VITE_API_BASE_URL=http://localhost/api npm run dev
```

## Backend Setup

1. Create a MySQL/MariaDB database.
2. Import `api/database/schema.sql`.
3. Configure the values shown in `api/.env.example`, especially `JWT_SECRET`
   and your `APP_PIN` or `APP_PIN_HASH`.
4. Upload the `api` folder to cPanel, usually as `public_html/api`.
5. Build the frontend with `npm run build` and upload `dist`.

See `api/README.md` for endpoint and deployment notes.

For the full cPanel File Manager and phpMyAdmin checklist, see
`DEPLOY_CPANEL.md`.
