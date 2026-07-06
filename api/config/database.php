<?php

declare(strict_types=1);

final class Database
{
    private static ?PDO $connection = null;

public static function getConnection(): PDO
{
    if (self::$connection instanceof PDO) {
        return self::$connection;
    }

    try {
        $host = getenv('DB_HOST') ?: 'localhost';
        $port = getenv('DB_PORT') ?: '3306';
        $database = getenv('DB_DATABASE') ?: 'vadbrqte_finance_app';
        $username = getenv('DB_USERNAME') ?: 'vadbrqte_zano';
        $password = getenv('DB_PASSWORD') ?: 'Zano@128078';
        $charset = getenv('DB_CHARSET') ?: 'utf8mb4';

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $host,
            $port,
            $database,
            $charset
        );

        self::$connection = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return self::$connection;

    } catch (PDOException $e) {
        die($e->getMessage());
    }
}
}
