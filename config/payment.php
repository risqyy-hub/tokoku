<?php

return [
    'duitku' => [
        'merchant_code' => env('DUITKU_MERCHANT_CODE'),
        'api_key' => env('DUITKU_API_KEY'),
        'base_url' => env('DUITKU_BASE_URL', 'https://sandbox.duitku.com'),
        'expiry_period' => (int) env('DUITKU_EXPIRY_PERIOD', 1440),
        'ca_bundle' => env('DUITKU_CA_BUNDLE', 'C:/xampp/apache/bin/curl-ca-bundle.crt'),
    ],
];
