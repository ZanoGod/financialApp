<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/Savings.php';

Request::requireMethod('GET');

requireAuth();

$savings = (new Savings(Database::getConnection()))->list();

Response::success(
    'Savings loaded.',
    ['savings' => $savings]
);
