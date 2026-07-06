# Deploy To cPanel And phpMyAdmin

This project is designed for a common shared-hosting layout:

```text
public_html/
  finance-app/     React build files from dist/
  api/             PHP API folder
```

If you want the app at the domain root instead, upload the `dist` contents
directly into `public_html/` and adjust `base` in `vite.config.ts`.

## 1. Prepare The Database

In cPanel:

1. Open **MySQL Databases**.
2. Create a database, for example `finance_app`.
3. Create a database user.
4. Add the user to the database with **All Privileges**.
5. Open **phpMyAdmin**.
6. Select the database.
7. Import one SQL file:
   - Fresh install: `api/database/schema.sql`
   - Existing install from the earlier user-login schema: `api/database/migrate_single_pin.sql`

cPanel usually prefixes database names and users, like:

```text
cpaneluser_finance_app
cpaneluser_finance_user
```

Use the prefixed values in `api/.env`.

## 2. Configure The API

In File Manager:

1. Upload the whole `api` folder to `public_html/api`.
2. Copy `api/.env.example` to `api/.env`.
3. Edit `api/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=cpaneluser_finance_app
DB_USERNAME=cpaneluser_finance_user
DB_PASSWORD=your_database_password
DB_CHARSET=utf8mb4

JWT_SECRET=replace-with-a-long-random-secret
JWT_ISSUER=personal-finance-api
JWT_AUDIENCE=personal-finance-app
JWT_TTL=172800

APP_PIN=
APP_PIN_HASH=put-your-generated-pin-hash-here
PIN_REMEMBER_HOURS=48

CORS_ALLOWED_ORIGINS=https://your-domain.com
```

Generate a secure PIN hash locally or in cPanel Terminal:

```bash
php -r "echo password_hash('2468', PASSWORD_DEFAULT);"
```

Put the output in `APP_PIN_HASH`. Leave `APP_PIN` empty when using the hash.

## 3. Build The Frontend

Create `.env.production` locally:

```env
VITE_API_BASE_URL=/api
```

Then build:

```bash
npm install
npm run build
```

Upload the **contents** of `dist/` into:

```text
public_html/finance-app/
```

The `public/.htaccess` file is copied into `dist/` during build and allows the
React app to reload correctly on shared hosting.

## 4. PHP Version

In cPanel **MultiPHP Manager** or **Select PHP Version**, use PHP 8.2 or newer.

Required PHP extensions:

- PDO
- pdo_mysql
- mbstring

## 5. Quick Test

Open:

```text
https://your-domain.com/finance-app
```

You should see only the 4-digit PIN screen. After entering the PIN, the token is
remembered for 24 or 48 hours depending on the option selected.
