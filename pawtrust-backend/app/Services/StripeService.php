<?php

namespace App\Services;

use App\Models\Listing;
use Stripe\Event;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeService
{
    public function __construct(private readonly StripeClient $client)
    {
    }

    /**
     * @return array{id: string, url: string}
     */
    public function createCheckoutSession(Listing $listing, string $listingType, string $successUrl, string $cancelUrl): array
    {
        $priceCents = config("stripe.prices.{$listingType}");

        $session = $this->client->checkout->sessions->create([
            'mode'       => 'payment',
            'line_items' => [[
                'price_data' => [
                    'currency'     => config('stripe.currency'),
                    'unit_amount'  => $priceCents,
                    'product_data' => ['name' => ucfirst($listingType) . ' Listing — PawTrust'],
                ],
                'quantity' => 1,
            ]],
            'metadata'    => [
                'listing_id'   => (string) $listing->id,
                'listing_type' => $listingType,
            ],
            'success_url' => $successUrl,
            'cancel_url'  => $cancelUrl,
        ]);

        return ['id' => $session->id, 'url' => $session->url];
    }

    public function constructWebhookEvent(string $payload, ?string $signature): Event
    {
        // Throws Stripe\Exception\SignatureVerificationException on invalid signature — caller handles as 400.
        return Webhook::constructEvent($payload, (string) $signature, config('stripe.webhook_secret'));
    }
}
