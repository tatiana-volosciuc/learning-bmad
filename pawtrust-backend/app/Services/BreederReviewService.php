<?php

namespace App\Services;

use App\Exceptions\DuplicateBreederReviewException;
use App\Models\BreederProfile;
use App\Models\BreederReview;
use App\Models\Inquiry;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;

class BreederReviewService
{
    public function submit(User $buyer, BreederProfile $profile, int $rating, string $text): BreederReview
    {
        // Gate: buyer must have inquired about one of this breeder's listings — reduces fake reviews
        $hasInquiry = Inquiry::where('buyer_id', $buyer->id)
            ->whereHas('listing', fn ($q) => $q->where('breeder_profile_id', $profile->id))
            ->exists();

        if (!$hasInquiry) {
            throw new HttpResponseException(
                response()->json(['message' => __('errors.review_requires_inquiry')], 422)
            );
        }

        $existing = BreederReview::where('breeder_profile_id', $profile->id)
            ->where('buyer_id', $buyer->id)
            ->exists();

        if ($existing) {
            throw new DuplicateBreederReviewException();
        }

        return BreederReview::create([
            'breeder_profile_id' => $profile->id,
            'buyer_id'           => $buyer->id,
            'rating'             => $rating,
            'text'               => $text,
        ]);
    }

    public function hasReviewed(User $buyer, BreederProfile $profile): bool
    {
        return BreederReview::where('breeder_profile_id', $profile->id)
            ->where('buyer_id', $buyer->id)
            ->exists();
    }
}
