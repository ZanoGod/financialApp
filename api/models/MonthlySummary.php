<?php
// api/models/MonthlySummary.php

class MonthlySummary {
    private PDO $conn;
    private string $table_name = "monthly_summaries";

    public function __construct(PDO $db) {
        $this->conn = $db;
    }

    /**
     * Manually close and archive a specific month.
     */
    public function closeMonth(int $year, int $month, ?string $notes = null): array {
        // 1. Calculate totals from transactions for the given year and month
        $stmtTrans = $this->conn->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0.00) AS total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0.00) AS total_expense
            FROM transactions
            WHERE YEAR(transaction_date) = :year AND MONTH(transaction_date) = :month
        ");
        $stmtTrans->execute([':year' => $year, ':month' => $month]);
        $totals = $stmtTrans->fetch(PDO::FETCH_ASSOC);

        $totalIncome = (float)$totals['total_income'];
        $totalExpense = (float)$totals['total_expense'];
        $netSavings = $totalIncome - $totalExpense;

        // 2. Fetch category breakdown for this month
        $stmtCat = $this->conn->prepare("
            SELECT 
                COALESCE(c.name, 'Uncategorized') AS category_name,
                t.type,
                SUM(t.amount) AS total_amount
            FROM transactions t
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            WHERE YEAR(t.transaction_date) = :year AND MONTH(t.transaction_date) = :month
            GROUP BY c.name, t.type
        ");
        $stmtCat->execute([':year' => $year, ':month' => $month]);
        $categoryBreakdown = $stmtCat->fetchAll(PDO::FETCH_ASSOC);

        // 3. Snapshot current account balances
        $stmtAcc = $this->conn->prepare("SELECT id, name, type, balance, color, bg FROM accounts");
        $stmtAcc->execute();
        $accountSnapshot = $stmtAcc->fetchAll(PDO::FETCH_ASSOC);

        // 4. Save or update the monthly summary in the database
        $query = "
            INSERT INTO {$this->table_name} 
                (year, month, total_income, total_expense, net_savings, account_snapshot, category_breakdown, notes, closed_at)
            VALUES 
                (:year, :month, :total_income, :total_expense, :net_savings, :account_snapshot, :category_breakdown, :notes, NOW())
            ON DUPLICATE KEY UPDATE
                total_income = VALUES(total_income),
                total_expense = VALUES(total_expense),
                net_savings = VALUES(net_savings),
                account_snapshot = VALUES(account_snapshot),
                category_breakdown = VALUES(category_breakdown),
                notes = VALUES(notes),
                closed_at = NOW()
        ";

        $stmtSave = $this->conn->prepare($query);
        $stmtSave->execute([
            ':year'               => $year,
            ':month'              => $month,
            ':total_income'       => $totalIncome,
            ':total_expense'      => $totalExpense,
            ':net_savings'        => $netSavings,
            ':account_snapshot'   => json_encode($accountSnapshot),
            ':category_breakdown' => json_encode($categoryBreakdown),
            ':notes'              => $notes
        ]);

        return [
            'year'               => $year,
            'month'              => $month,
            'total_income'       => $totalIncome,
            'total_expense'      => $totalExpense,
            'net_savings'        => $netSavings,
            'account_snapshot'   => $accountSnapshot,
            'category_breakdown' => $categoryBreakdown,
            'notes'              => $notes
        ];
    }

    /**
     * Retrieve all saved monthly snapshots.
     */
    public function getAll(): array {
        $stmt = $this->conn->prepare("
            SELECT id, year, month, total_income, total_expense, net_savings, account_snapshot, category_breakdown, notes, closed_at 
            FROM {$this->table_name} 
            ORDER BY year DESC, month DESC
        ");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON snapshots for easy use in frontend
        foreach ($rows as &$row) {
            $row['account_snapshot'] = json_decode($row['account_snapshot'] ?? '[]', true);
            $row['category_breakdown'] = json_decode($row['category_breakdown'] ?? '[]', true);
        }

        return $rows;
    }
}