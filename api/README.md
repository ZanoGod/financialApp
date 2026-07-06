# Personal Finance API

Small PHP 8.2+ REST API for the React finance app. It uses PDO, JSON responses,
JWT authentication, and a single-owner 4-digit PIN gate.

## cPanel Setup

1. Create a MySQL or MariaDB database and user in cPanel.
2. Import `api/database/schema.sql`.
3. Upload the `api` folder beside the built frontend, usually under
   `public_html/api`.
4. Copy `api/.env.example` to `api/.env` and edit the values.
5. Set a long random `JWT_SECRET` before production.
6. Set your 4-digit `APP_PIN`, or preferably set `APP_PIN_HASH`.
   Generate a hash with:

   ```bash
   php -r "echo password_hash('2468', PASSWORD_DEFAULT);"
   ```

7. Build the React app with `VITE_API_BASE_URL=/api npm run build`.

See `DEPLOY_CPANEL.md` in the project root for the full File Manager and
phpMyAdmin deployment checklist.

Every endpoint returns:

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

The PIN endpoint is `POST /api/auth/pin.php` with JSON:

```json
{
  "pin": "1234",
  "remember_hours": 48
}
```

`remember_hours` can be `24` or `48`.
