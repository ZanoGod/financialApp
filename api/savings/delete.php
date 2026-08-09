<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/Savings.php';

Request::requireMethod('DELETE');

requireAuth();

(new Savings(Database::getConnection()))->delete(
    Request::id()
);

Response::success(
    'Savings goal deleted.'
);
