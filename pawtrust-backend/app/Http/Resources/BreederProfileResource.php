<?php

namespace App\Http\Resources;

use App\Services\S3Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BreederProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'user_id'              => $this->user_id,
            'kennel_name'          => $this->kennel_name,
            'display_name'         => $this->display_name,
            'description'          => $this->description,
            'location'             => $this->location,
            'phone'                => $this->phone,
            'website'              => $this->website,
            'breed_specialization' => $this->breed_specialization,
            'profile_photo_url'    => $this->getPhotoUrl(),
            'og_image_url'         => $this->getPhotoUrl() ?? $this->getFirstListingPhotoUrl(),
            'years_active'         => $this->years_active,
            'verified'             => $this->isVerified(),
            'verified_at'          => $this->verified_at,
            'documents'            => BreederDocumentResource::collection($this->whenLoaded('documents')),
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

    private function getFirstListingPhotoUrl(): ?string
    {
        $listing = $this->relationLoaded('listings') ? $this->listings->first() : null;
        $photo   = $listing?->photos?->first();

        if (!$photo) {
            return null;
        }

        try {
            return app(S3Service::class)->presignedUrl($photo->s3_key, 86400);
        } catch (\Throwable) {
            return null;
        }
    }
}
