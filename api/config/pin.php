<?php

declare(strict_types=1);

return [
    'pin' => getenv('APP_PIN') ?: '1280',
    'pin_hash' => getenv('APP_PIN_HASH') ?: '',
    'default_remember_hours' => (int) (getenv('PIN_REMEMBER_HOURS') ?: 48),
];
