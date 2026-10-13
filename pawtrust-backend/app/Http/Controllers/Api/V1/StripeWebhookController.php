<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ListingPaymentService;
use App\Services\StripeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;

class StripeWebhookController extends Controller
{
    public function __construct(
        private readonly StripeService $stripeService,
        private readonly ListingPaymentService $paymentService,
    ) {
    }

    public function handle(Request $request): JsonResponse
    {
        $payload   = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        try {
            $event = $this->stripeService->constructWebhookEvent($payload, $signature);
        } catch (SignatureVerificationException) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session   = $event->data->object;
            $listingId = $session->metadata->listing_id ?? null;
            $action    = $session->metadata->action ?? 'activate_listing';

            if ($listingId) {
                match ($action) {
                    'activate_listing'    => $this->paymentService->handleSuccessfulPayment((int) $listingId, $session->id),
                    'upgrade_to_featured' => $this->paymentService->handleSuccessfulUpgrade((int) $listingId, $session->id),
                    default               => null, // unknown action — log and move on
                };
            }
        }

        return response()->json(['received' => true]);
    }
}
