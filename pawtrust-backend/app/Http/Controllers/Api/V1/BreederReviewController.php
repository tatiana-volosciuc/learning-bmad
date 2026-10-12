<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitBreederReviewRequest;
use App\Http\Resources\BreederReviewResource;
use App\Models\BreederProfile;
use App\Services\BreederReviewService;
use Illuminate\Http\JsonResponse;

class BreederReviewController extends Controller
{
    public function __construct(private readonly BreederReviewService $reviewService)
    {
    }

    public function store(SubmitBreederReviewRequest $request, int $id): JsonResponse
    {
        // {id} is the breeder's user_id — matches GET /breeders/{id} convention
        $profile = BreederProfile::where('user_id', $id)->firstOrFail();

        $review = $this->reviewService->submit(
            $request->user(),
            $profile,
            $request->validated('rating'),
            $request->validated('text'),
        );

        return BreederReviewResource::make($review)
            ->response()
            ->setStatusCode(201);
    }
}
