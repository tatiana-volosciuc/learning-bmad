<?php

return [
    'key'            => env('STRIPE_KEY'),
    'secret'         => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    'prices'         => [
        'standard' => env('STRIPE_PRICE_STANDARD', 300), // cents
        'featured' => env('STRIPE_PRICE_FEATURED', 800), // cents
        'upgrade'  => env('STRIPE_PRICE_UPGRADE', 500),  // cents — standard-to-featured upgrade fee
    ],
    'currency' => 'eur',
];
