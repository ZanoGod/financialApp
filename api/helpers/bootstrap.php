<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

loadEnvFile(__DIR__ . '/../.env');
require_once __DIR__ . '/../middleware/cors.php';

spl_autoload_register(static function (string $className): void {
    $basePath = dirname(__DIR__);
    $paths = [
        $basePath . '/config/' . $className . '.php',
        $basePath . '/helpers/' . $className . '.php',
        $basePath . '/models/' . $className . '.php',
    ];

    foreach ($paths as $path) {
        if (is_file($path)) {
            require_once $path;
            return;
        }
    }
});

set_exception_handler(static function (Throwable $exception): void {
    error_log($exception->getMessage());
    Response::error('Server error.', 500);
});
