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

            if ($listingId) {
                $this->paymentService->handleSuccessfulPayment((int) $listingId, $session->id);
            }
        }

        return response()->json(['received' => true]);
    }
}
