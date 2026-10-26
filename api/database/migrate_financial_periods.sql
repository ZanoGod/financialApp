-- Manual financial periods. Existing transactions are retained with period_id=NULL
-- and must be explicitly reconciled by the user after review.
CREATE TABLE IF NOT EXISTS financial_periods (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status ENUM('active','archived') NOT NULL DEFAULT 'active',
    closed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_financial_period_dates (start_date, end_date),
    KEY idx_financial_period_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE transactions
    ADD COLUMN period_id BIGINT UNSIGNED NULL DEFAULT NULL,
    ADD KEY idx_transactions_period_id (period_id),
    ADD CONSTRAINT fk_transactions_period
        FOREIGN KEY (period_id) REFERENCES financial_periods(id) ON DELETE RESTRICT;

-- No historical rows are assigned automatically. They remain available in
-- permanent history and have an explicit Unassigned status in the UI.
