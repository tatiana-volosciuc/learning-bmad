<?php

namespace App\Http\Controllers\Api\V1\Buyer;

use App\Http\Controllers\Controller;
use App\Http\Resources\Buyer\BuyerReviewResource;
use App\Models\BreederReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BuyerReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reviews = BreederReview::where('buyer_id', $request->user()->id)
            ->with('breederProfile')
            ->latest()
            ->get();

        return response()->json(['data' => BuyerReviewResource::collection($reviews)]);
    }
}
