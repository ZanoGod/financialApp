<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('POST');

requireAuth();
$loan = (new Loan(Database::getConnection()))->create(Request::input());

Response::success('Loan created.', ['loan' => $loan], 201);
