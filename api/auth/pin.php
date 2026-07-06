<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

Request::requireMethod('POST');

$input = Request::input();
$pin = trim((string) ($input['pin'] ?? ''));

if (!preg_match('/^\d{4}$/', $pin)) {
    Response::error('PIN must be exactly 4 digits.', 422);
}

$config = require __DIR__ . '/../config/pin.php';
$pinHash = (string) $config['pin_hash'];
$configuredPin = (string) $config['pin'];
$isValid = $pinHash !== ''
    ? password_verify($pin, $pinHash)
    : hash_equals($configuredPin, $pin);

if (!$isValid) {
    Response::error('Invalid PIN.', 401);
}

$rememberHours = (int) ($input['remember_hours'] ?? $config['default_remember_hours']);

if (!in_array($rememberHours, [24, 48], true)) {
    $rememberHours = 48;
}

$ttl = $rememberHours * 60 * 60;
$expiresAt = time() + $ttl;
$jwt = new JwtService();
$token = $jwt->create([
    'sub' => 'single-owner',
    'scope' => 'finance',
    'jti' => bin2hex(random_bytes(16)),
], $ttl);

$db = Database::getConnection();
$accountModel = new Account($db);
$categoryModel = new Category($db);

if ($accountModel->list() === []) {
    $accountModel->seedDefaults();
}

if ($categoryModel->list() === []) {
    $categoryModel->seedDefaults();
}

Response::success('PIN accepted.', [
    'token' => $token,
    'expires_at' => $expiresAt,
    'remember_hours' => $rememberHours,
]);
