<?php

declare(strict_types=1);

final class Validator
{
    public static function requireFields(array $input, array $fields): void
    {
        $missing = [];

        foreach ($fields as $field) {
            if (!array_key_exists($field, $input) || trim((string) $input[$field]) === '') {
                $missing[] = $field;
            }
        }

        if ($missing !== []) {
            Response::error('Missing required fields.', 422, ['fields' => $missing]);
        }
    }

    public static function email(string $email): string
    {
        $normalized = strtolower(trim($email));

        if (!filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
            Response::error('A valid email address is required.', 422);
        }

        return $normalized;
    }

    public static function string(mixed $value, string $field, int $max = 255): string
    {
        $value = trim((string) $value);

        if ($value === '') {
            Response::error(sprintf('%s is required.', $field), 422);
        }

        if (mb_strlen($value) > $max) {
            Response::error(sprintf('%s may not exceed %d characters.', $field, $max), 422);
        }

        return $value;
    }

    public static function optionalString(mixed $value, int $max = 255): ?string
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }

        $value = trim((string) $value);

        if (mb_strlen($value) > $max) {
            Response::error(sprintf('Value may not exceed %d characters.', $max), 422);
        }

        return $value;
    }

    public static function positiveAmount(mixed $value, string $field = 'amount'): string
    {
        if (!is_numeric($value) || (float) $value <= 0) {
            Response::error(sprintf('%s must be a positive number.', $field), 422);
        }

        return number_format((float) $value, 2, '.', '');
    }

    public static function amount(mixed $value, string $field = 'amount'): string
    {
        if (!is_numeric($value)) {
            Response::error(sprintf('%s must be numeric.', $field), 422);
        }

        return number_format((float) $value, 2, '.', '');
    }

    public static function int(mixed $value, string $field): int
    {
        $id = filter_var($value, FILTER_VALIDATE_INT);

        if (!$id || $id < 1) {
            Response::error(sprintf('%s must be a valid id.', $field), 422);
        }

        return (int) $id;
    }

    public static function enum(mixed $value, array $allowed, string $field): string
    {
        $value = trim((string) $value);

        if (!in_array($value, $allowed, true)) {
            Response::error(sprintf('%s is invalid.', $field), 422, ['allowed' => $allowed]);
        }

        return $value;
    }
}
