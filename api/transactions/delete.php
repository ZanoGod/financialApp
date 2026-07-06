<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('DELETE');

requireAuth();
(new Transaction(Database::getConnection()))->delete(Request::id());
$accounts = (new Account(Database::getConnection()))->list();

Response::success('Transaction deleted.', ['accounts' => $accounts]);
