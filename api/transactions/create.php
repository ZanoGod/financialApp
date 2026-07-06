<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('POST');

requireAuth();
$transaction = (new Transaction(Database::getConnection()))->create(Request::input());
$accounts = (new Account(Database::getConnection()))->list();

Response::success('Transaction created.', [
    'transaction' => $transaction,
    'accounts' => $accounts,
], 201);
