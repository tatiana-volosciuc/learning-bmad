<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // review_summary is passed via ->additional() from the controller
        $reviewSummary = $this->additional['review_summary'] ?? null;

        return [
            'id'             => $this->id,
            'title'          => $this->title,
            'description'    => $this->description,
            'species'        => $this->species,
            'breed'          => $this->breed,
            'gender'         => $this->gender,
            'date_of_birth'  => $this->date_of_birth?->toDateString(),
            'price'          => $this->price,
            'currency'       => $this->currency,
            'location'       => $this->location ?? $this->breederProfile?->location,
            'status'         => $this->status,
            'listed_at'      => $this->listed_at,
            'can_pay'        => $this->status === 'pending_payment',
            'listing_type'   => $this->listing_type,
            'featured_until' => $this->featured_until,
            'featured'       => $this->featured_until && $this->featured_until->isFuture(),
            'photos'         => ListingPhotoResource::collection($this->whenLoaded('photos')),
            // SECURITY: health_certificate_key NEVER included — access controlled post-inquiry
            'health_certificate' => $this->health_certificate_key ? 'on_file' : null,
            'breeder'        => BreederSummaryResource::make($this->whenLoaded('breederProfile')),
            'achievements'   => BreederAchievementResource::collection(
                $this->whenLoaded('breederProfile', fn () => $this->breederProfile->achievements ?? collect())
            ),
            'review_summary' => $reviewSummary,
            'recent_reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
            'created_at'     => $this->created_at,
        ];
    }
}

