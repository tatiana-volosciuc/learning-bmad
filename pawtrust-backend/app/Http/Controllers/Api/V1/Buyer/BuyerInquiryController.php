<?php

namespace App\Http\Controllers\Api\V1\Buyer;

use App\Http\Controllers\Controller;
use App\Http\Resources\Buyer\BuyerInquiryResource;
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

    public function index(Request $request): JsonResponse
    {
        $paginator = Inquiry::where('buyer_id', $request->user()->id)
            ->with(['listing.photos', 'listing.breederProfile.user'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => BuyerInquiryResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, Inquiry $inquiry): JsonResponse
    {
        abort_if($inquiry->buyer_id !== $request->user()->id, 403, 'Forbidden.');

        $inquiry->load(['listing.photos', 'listing.breederProfile.user']);

        $data = (new BuyerInquiryResource($inquiry))->toArray($request);
        $data['message'] = $inquiry->message;

        return response()->json(['data' => $data]);
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
