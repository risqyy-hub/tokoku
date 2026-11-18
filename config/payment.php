<?php

return [
    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'base_url' => env('MIDTRANS_BASE_URL', 'https://app.sandbox.midtrans.com'),
    ],
];
