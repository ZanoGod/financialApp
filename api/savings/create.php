<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/Savings.php';

Request::requireMethod('POST');

requireAuth();

$saving = (new Savings(Database::getConnection()))->create(
    Request::input()
);

Response::success(
    'Savings goal created.',
    ['saving' => $saving],
    201
);
