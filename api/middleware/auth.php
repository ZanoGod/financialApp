<?php

declare(strict_types=1);

function requireAuth(): array
{
    $token = Request::bearerToken();

    if ($token === null) {
        Response::error('Authentication token is required.', 401);
    }

    $jwt = new JwtService();
    $payload = $jwt->verify($token);

    if (($payload['sub'] ?? '') !== 'single-owner' || ($payload['scope'] ?? '') !== 'finance') {
        Response::error('Invalid authentication token.', 401);
    }

    return [
        'token' => $token,
        'payload' => $payload,
    ];
}
