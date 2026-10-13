<?php

namespace App\Services;

use App\Models\Listing;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ListingPaymentService
{
    public function __construct(private readonly StripeService $stripeService)
    {
    }

    public function initiate(Listing $listing): string
    {
        if ($listing->status !== 'pending_payment') {
            throw ValidationException::withMessages([
                'listing' => 'This listing is not awaiting payment.',
            ]);
        }

        $frontendUrl = config('app.frontend_url');

        $session = $this->stripeService->createCheckoutSession(
            $listing,
            $listing->listing_type,
            "{$frontendUrl}/dashboard/breeder?payment=success&action=activate&listing_id={$listing->id}",
            "{$frontendUrl}/dashboard/breeder?payment=cancelled&action=activate&listing_id={$listing->id}",
        );

        $listing->update(['stripe_checkout_session_id' => $session['id']]);

        return $session['url'];
    }

    public function upgradeToFeatured(Listing $listing): string
    {
        $frontendUrl = config('app.frontend_url');

        $session = $this->stripeService->createCheckoutSession(
            $listing,
            'upgrade',
            "{$frontendUrl}/dashboard/breeder?payment=success&action=upgrade&listing_id={$listing->id}",
            "{$frontendUrl}/dashboard/breeder?payment=cancelled&action=upgrade&listing_id={$listing->id}",
        );

        $listing->update(['stripe_checkout_session_id' => $session['id']]);

        return $session['url'];
    }

    public function handleSuccessfulPayment(int $listingId, string $sessionId): void
    {
        $listing = Listing::find($listingId);

        if (!$listing) {
            Log::warning("Stripe webhook: listing {$listingId} not found");
            return;
        }

        // Idempotency: a previously-processed session for this listing is a no-op.
        if ($listing->status === 'active' && $listing->stripe_checkout_session_id === $sessionId) {
            return;
        }

        $listing->update([
            'status'                      => 'active',
            'listed_at'                   => now(),
            'stripe_checkout_session_id'  => $sessionId,
            // A listing purchased as 'featured' upfront is featured immediately on activation —
            // no separate upgrade payment needed (Story 5.4 AC2).
            'is_featured'                 => $listing->listing_type === 'featured',
        ]);

        Log::info("Listing {$listingId} activated via Stripe session {$sessionId}");
    }

    public function handleSuccessfulUpgrade(int $listingId, string $sessionId): void
    {
        $listing = Listing::find($listingId);

        if (!$listing) {
            Log::warning("Stripe upgrade webhook: listing {$listingId} not found");
            return;
        }

        // Idempotency: a previously-processed session for this listing is a no-op.
        if ($listing->is_featured && $listing->stripe_checkout_session_id === $sessionId) {
            return;
        }

        $listing->update([
            'is_featured'                 => true,
            'stripe_checkout_session_id'  => $sessionId,
        ]);

        Log::info("Listing {$listingId} upgraded to featured via Stripe session {$sessionId}");
    }
}
