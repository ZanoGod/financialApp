<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('DELETE');

requireAuth();
(new Category(Database::getConnection()))->delete(Request::id());

Response::success('Category deleted.');
