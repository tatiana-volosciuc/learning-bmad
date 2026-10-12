<?php

namespace App\Http\Resources;

use App\Services\S3Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BreederProfilePublicResource extends JsonResource
{
    // SECURITY: Contact details intentionally excluded.
    // Access to phone/email is gated via POST /api/v1/inquiries → acceptance flow.
    // See: architecture/security.md §Contact Gating

    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'kennel_name'          => $this->kennel_name,
            'display_name'         => $this->display_name,
            'description'          => $this->description,
            'location'             => $this->location,
            'website'              => $this->website,
            'breed_specialization' => $this->breed_specialization,
            'profile_photo_url'    => $this->getPhotoUrl(),
            'years_active'         => $this->years_active,
            'verified'             => $this->isVerified(),
            'verified_at'          => $this->verified_at,
            'verified_since'       => $this->verified_at?->toDateString(),
            'listings'             => ListingSummaryResource::collection(
                $this->whenLoaded('listings')
            ),
            // Count of approved docs only — no filenames or types exposed to public
            'documents_on_file'    => $this->whenLoaded(
                'documents',
                fn () => $this->documents->count(),
                0
            ),
            'reviews'              => BreederReviewResource::collection($this->whenLoaded('reviews')),
            'review_summary'       => $this->whenLoaded('reviews', fn () => [
                'average_rating' => $this->reviews->isNotEmpty()
                    ? round($this->reviews->avg('rating'), 1)
                    : null,
                'total_count'    => $this->reviews->count(),
            ]),
            // NEVER include: phone, email, user_id (internal), verified_by
        ];
    }

    private function getPhotoUrl(): ?string
    {
        if (!$this->profile_photo_key) {
            return null;
        }

        try {
            return app(S3Service::class)->presignedUrl($this->profile_photo_key);
        } catch (\Throwable) {
            return null;
        }
    }
}
