<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('GET');

requireAuth();
$accounts = (new Account(Database::getConnection()))->list();

Response::success('Accounts loaded.', ['accounts' => $accounts]);
