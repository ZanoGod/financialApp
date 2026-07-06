<?php

declare(strict_types=1);

return [
    'secret' => getenv('JWT_SECRET') ?: 'change-this-secret-before-production',
    'issuer' => getenv('JWT_ISSUER') ?: 'personal-finance-api',
    'audience' => getenv('JWT_AUDIENCE') ?: 'personal-finance-app',
    'ttl' => (int) (getenv('JWT_TTL') ?: 172800),
];
