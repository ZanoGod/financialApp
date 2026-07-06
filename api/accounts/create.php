<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('POST');

requireAuth();
$account = (new Account(Database::getConnection()))->create(Request::input());

Response::success('Account created.', ['account' => $account], 201);
