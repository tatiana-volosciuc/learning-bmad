<?php

namespace App\Http\Resources;

use App\Services\S3Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'species'      => $this->species,
            'breed'        => $this->breed,
            'price'        => $this->price,
            'currency'     => $this->currency,
            'location'     => $this->location ?? $this->breederProfile?->location,
            'main_photo_url' => $this->getMainPhotoUrl(),
            'breeder_name' => $this->breederProfile?->kennel_name ?? $this->breederProfile?->display_name,
            'verified'     => (bool) $this->breederProfile?->verified_at,
            'listing_type' => $this->listing_type,
            'featured'     => (bool) $this->is_featured,
            'created_at'   => $this->created_at,
            // Known MVP performance hotspot: one extra query per card for authenticated buyers.
            // Acceptable at current scale; optimize with a bulk-loaded saved-id set if it becomes a bottleneck.
            'is_saved'     => $this->when(
                $request->user()?->hasRole('buyer'),
                fn () => $request->user()->savedListings()->where('listing_id', $this->id)->exists()
            ),
            // SECURITY: No contact details, no health_certificate_key, no s3_key
        ];
    }

    private function getMainPhotoUrl(): ?string
    {
        $photo = $this->whenLoaded('photos', fn () => $this->photos->first());

        if (!$photo) {
            return null;
        }

        return app(S3Service::class)->presignedUrl($photo->s3_key, 86400);
    }
}
