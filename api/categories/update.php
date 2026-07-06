<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

if (!in_array(Request::method(), ['PUT', 'PATCH'], true)) {
    Response::error('Method not allowed.', 405);
}

requireAuth();
$category = (new Category(Database::getConnection()))->update(
    Request::id(),
    Request::input()
);

Response::success('Category updated.', ['category' => $category]);
