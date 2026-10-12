<?php

namespace App\Http\Controllers\Api\V1\Buyer;

use App\Http\Controllers\Controller;
use App\Models\BreederProfile;
use App\Models\Inquiry;
use App\Services\BreederReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BuyerInquiryController extends Controller
{
    public function __construct(private readonly BreederReviewService $reviewService)
    {
    }

    public function inquiryExists(Request $request): JsonResponse
    {
        $profileId = (int) $request->query('breeder_profile_id');

        $hasInquiry = Inquiry::where('buyer_id', $request->user()->id)
            ->whereHas('listing', fn ($q) => $q->where('breeder_profile_id', $profileId))
            ->exists();

        return response()->json(['data' => ['has_inquiry' => $hasInquiry]]);
    }

    public function reviewExists(Request $request): JsonResponse
    {
        $profile = BreederProfile::findOrFail((int) $request->query('breeder_profile_id'));

        $hasReviewed = $this->reviewService->hasReviewed($request->user(), $profile);

        return response()->json(['data' => ['has_reviewed' => $hasReviewed]]);
    }
}
