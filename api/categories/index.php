<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

Request::requireMethod('GET');

requireAuth();
$categories = (new Category(Database::getConnection()))->list();

Response::success('Categories loaded.', ['categories' => $categories]);
