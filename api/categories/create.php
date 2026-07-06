<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('POST');

requireAuth();
$category = (new Category(Database::getConnection()))->create(Request::input());

Response::success('Category created.', ['category' => $category], 201);
