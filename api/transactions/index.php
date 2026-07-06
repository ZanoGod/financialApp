<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('GET');

requireAuth();
$transactions = (new Transaction(Database::getConnection()))->list();

Response::success('Transactions loaded.', ['transactions' => $transactions]);
