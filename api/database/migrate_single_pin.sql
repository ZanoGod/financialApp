ALTER TABLE transactions DROP FOREIGN KEY fk_transactions_user;
ALTER TABLE accounts DROP FOREIGN KEY fk_accounts_user;
ALTER TABLE transaction_categories DROP FOREIGN KEY fk_categories_user;
ALTER TABLE loans DROP FOREIGN KEY fk_loans_user;

DROP TABLE IF EXISTS user_sessions;

ALTER TABLE transactions DROP INDEX idx_transactions_user_id;
ALTER TABLE accounts DROP INDEX uq_accounts_user_name;
ALTER TABLE accounts DROP INDEX idx_accounts_user_id;
ALTER TABLE transaction_categories DROP INDEX uq_categories_user_name_type;
ALTER TABLE transaction_categories DROP INDEX idx_categories_user_id;
ALTER TABLE loans DROP INDEX idx_loans_user_id;

ALTER TABLE transactions DROP COLUMN user_id;
ALTER TABLE accounts DROP COLUMN user_id;
ALTER TABLE transaction_categories DROP COLUMN user_id;
ALTER TABLE loans DROP COLUMN user_id;

ALTER TABLE accounts ADD UNIQUE KEY uq_accounts_name (name);
ALTER TABLE transaction_categories ADD UNIQUE KEY uq_categories_name_type (name, type);

DROP TABLE IF EXISTS users;
