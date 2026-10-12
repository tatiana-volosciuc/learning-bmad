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
            "{$frontendUrl}/dashboard/breeder?payment=success&listing_id={$listing->id}",
            "{$frontendUrl}/dashboard/breeder?payment=cancelled&listing_id={$listing->id}",
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
        ]);

        Log::info("Listing {$listingId} activated via Stripe session {$sessionId}");
    }
}
