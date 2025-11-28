<?php

return [
    'paths' => ['api/*', 'MTS/*', 'broadcasting/auth', 'tickets/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://192.168.2.221:91',
        'https://192.168.2.221:8080',
    ],

    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
