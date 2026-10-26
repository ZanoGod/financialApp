# Manual financial period rollout

1. Back up the production database and verify the target database name.
2. The provided phpMyAdmin dump includes legacy `monthly_summaries` for July, August and September 2026, but those are monthly snapshots and do not identify salary-cycle boundaries. Keep the table unchanged for reference; the new Archive view lists periods created by this workflow.
3. Import `api/database/migrate_financial_periods.sql` in phpMyAdmin. It creates `financial_periods` and adds nullable `transactions.period_id`; it does not assign/delete/change historical transactions or account balances. Run this against a development copy first.
4. Historical transactions are displayed as **Unassigned** until explicitly reviewed. Do not bulk assign based on transaction date alone.
5. Build and upload the Vite `dist/` contents to the existing `/finance-app/` deployment. Upload the updated `api/` directory beside the current PHP API.
6. Require HTTPS. Static interface files may be cached by the service worker; API requests and financial responses are excluded. Offline writes are disabled and clearly announced.
7. Android: open the HTTPS app in Chrome, use the install banner when available or browser menu → Install app / Add to Home screen. The manifest and service worker are served under `/finance-app/`.

The migration is intended to be run once. If `transactions.period_id` already exists, inspect the schema and apply only missing statements rather than rerunning the ALTER TABLE.
