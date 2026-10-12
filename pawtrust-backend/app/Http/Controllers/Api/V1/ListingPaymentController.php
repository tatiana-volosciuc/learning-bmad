<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Services\ListingPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ListingPaymentController extends Controller
{
    public function __construct(private readonly ListingPaymentService $paymentService)
    {
    }

    public function initiate(Request $request, Listing $listing): JsonResponse
    {
        $listing->load('breederProfile');

        if ($listing->breederProfile?->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }

        try {
            $checkoutUrl = $this->paymentService->initiate($listing);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => ['checkout_url' => $checkoutUrl]]);
    }
}
