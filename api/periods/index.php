<?php
declare(strict_types=1);
require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';
Request::requireMethod('GET');
requireAuth();
$db = Database::getConnection();
$active = $db->query("SELECT p.*, COUNT(t.id) transaction_count,
    COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END),0) total_income,
    COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END),0) total_expenses
    FROM financial_periods p LEFT JOIN transactions t ON t.period_id=p.id
    WHERE p.status='active' GROUP BY p.id ORDER BY p.start_date DESC LIMIT 1")->fetch();
$rows = $db->query("SELECT p.*, COUNT(t.id) transaction_count,
    COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END),0) total_income,
    COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END),0) total_expenses
    FROM financial_periods p LEFT JOIN transactions t ON t.period_id=p.id
    WHERE p.status='archived' GROUP BY p.id ORDER BY p.start_date DESC LIMIT 100")->fetchAll();
$legacySummaries = [];
$legacyTable = $db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='monthly_summaries'")->fetchColumn();
if ((int)$legacyTable > 0) {
    $legacySummaries = $db->query("SELECT id, year, month, total_income, total_expense, net_savings,
        account_snapshot, category_breakdown, notes, closed_at
        FROM monthly_summaries ORDER BY year DESC, month DESC LIMIT 100")->fetchAll();
    $legacySummaries = array_map(static function(array $summary): array {
        $summary['id'] = (int)$summary['id'];
        $summary['year'] = (int)$summary['year'];
        $summary['month'] = (int)$summary['month'];
        $summary['total_income'] = (float)$summary['total_income'];
        $summary['total_expense'] = (float)$summary['total_expense'];
        $summary['net_savings'] = (float)$summary['net_savings'];
        $accounts = $summary['account_snapshot'] ? json_decode((string)$summary['account_snapshot'], true) : [];
        $categories = $summary['category_breakdown'] ? json_decode((string)$summary['category_breakdown'], true) : [];
        $summary['account_snapshot'] = is_array($accounts) ? array_values($accounts) : [];
        $summary['category_breakdown'] = is_array($categories) ? array_values($categories) : [];
        return $summary;
    }, $legacySummaries);
}
$transform = static function(array $p): array { $p['id']=(int)$p['id']; $p['transaction_count']=(int)$p['transaction_count']; $p['total_income']=(float)$p['total_income']; $p['total_expenses']=(float)$p['total_expenses']; $p['net_income']=$p['total_income']-$p['total_expenses']; return $p; };
Response::success('Financial periods loaded.', ['active' => $active ? $transform($active) : null, 'archived' => array_map($transform, $rows), 'monthly_summaries' => $legacySummaries]);
