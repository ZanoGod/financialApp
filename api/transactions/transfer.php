<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('POST');
requireAuth();

$db = Database::getConnection();
$input = Request::input();

$fromAccountId = (int)($input['from_account_id'] ?? 0);
$toAccountId = (int)($input['to_account_id'] ?? 0);
$amount = (float)($input['amount'] ?? 0);

// Validation
if ($fromAccountId === $toAccountId || $fromAccountId === 0 || $toAccountId === 0) {
    Response::error('Invalid account selection.', 400);
}
if ($amount <= 0) {
    Response::error('Transfer amount must be greater than zero.', 400);
}

try {
    $db->beginTransaction();

    // 1. Deduct from Source Account
    $stmtOut = $db->prepare("UPDATE accounts SET balance = balance - :amount WHERE id = :id");
    $stmtOut->execute(['amount' => $amount, 'id' => $fromAccountId]);

    // 2. Add to Destination Account
    $stmtIn = $db->prepare("UPDATE accounts SET balance = balance + :amount WHERE id = :id");
    $stmtIn->execute(['amount' => $amount, 'id' => $toAccountId]);

    $db->commit();
    Response::success('Transfer completed successfully.');
} catch (Exception $e) {
    $db->rollBack();
    Response::error('Transfer failed: ' . $e->getMessage(), 500);
}
