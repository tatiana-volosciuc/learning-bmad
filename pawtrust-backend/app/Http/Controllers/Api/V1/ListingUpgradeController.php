<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Services\ListingPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListingUpgradeController extends Controller
{
    public function __construct(private readonly ListingPaymentService $paymentService)
    {
    }

    public function upgrade(Request $request, Listing $listing): JsonResponse
    {
        $listing->load('breederProfile');

        if ($listing->breederProfile?->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }

        if ($listing->status !== 'active') {
            return response()->json(['message' => __('errors.listing_must_be_active_to_upgrade')], 422);
        }

        if ($listing->is_featured) {
            return response()->json(['message' => __('errors.listing_already_featured')], 400);
        }

        $checkoutUrl = $this->paymentService->upgradeToFeatured($listing);

        return response()->json(['data' => ['checkout_url' => $checkoutUrl]]);
    }
}
