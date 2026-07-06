<?php

declare(strict_types=1);

final class Response
{
    public static function success(string $message = '', array|object|null $data = null, int $status = 200): never
    {
        self::json(true, $message, $data, $status);
    }

    public static function error(string $message, int $status = 400, array|object|null $data = null): never
    {
        self::json(false, $message, $data, $status);
    }

    private static function json(bool $success, string $message, array|object|null $data, int $status): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data ?? (object) [],
        ], JSON_UNESCAPED_SLASHES);

        exit;
    }
}
