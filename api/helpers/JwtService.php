<?php

declare(strict_types=1);

final class JwtService
{
    private array $config;

    public function __construct()
    {
        $this->config = require __DIR__ . '/../config/jwt.php';
    }

    public function create(array $claims, ?int $ttl = null): string
    {
        $now = time();
        $ttl ??= (int) $this->config['ttl'];

        $payload = array_merge([
            'iss' => $this->config['issuer'],
            'aud' => $this->config['audience'],
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttl,
        ], $claims);

        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $segments = [
            self::base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR)),
            self::base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $this->config['secret'], true);
        $segments[] = self::base64UrlEncode($signature);

        return implode('.', $segments);
    }

    public function verify(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            Response::error('Invalid authentication token.', 401);
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
        $header = json_decode(self::base64UrlDecode($encodedHeader), true);
        $payload = json_decode(self::base64UrlDecode($encodedPayload), true);

        if (!is_array($header) || !is_array($payload) || ($header['alg'] ?? '') !== 'HS256') {
            Response::error('Invalid authentication token.', 401);
        }

        $expected = self::base64UrlEncode(hash_hmac(
            'sha256',
            $encodedHeader . '.' . $encodedPayload,
            $this->config['secret'],
            true
        ));

        if (!hash_equals($expected, $encodedSignature)) {
            Response::error('Invalid authentication token.', 401);
        }

        $now = time();

        if (($payload['exp'] ?? 0) < $now || ($payload['nbf'] ?? 0) > $now) {
            Response::error('Authentication token has expired.', 401);
        }

        if (($payload['iss'] ?? '') !== $this->config['issuer']) {
            Response::error('Invalid token issuer.', 401);
        }

        if (($payload['aud'] ?? '') !== $this->config['audience']) {
            Response::error('Invalid token audience.', 401);
        }

        return $payload;
    }

    public function ttl(): int
    {
        return (int) $this->config['ttl'];
    }

    private static function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $value): string
    {
        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        if ($decoded === false) {
            Response::error('Invalid authentication token.', 401);
        }

        return $decoded;
    }
}
