<?php

declare(strict_types=1);

return [
    'allowed_origins' => array_filter(array_map(
        'trim',
        explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: '*')
    )),
];
