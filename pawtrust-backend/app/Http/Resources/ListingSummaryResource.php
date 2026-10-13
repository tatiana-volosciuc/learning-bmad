<?php

namespace App\Http\Resources;

use App\Services\S3Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $s3Service = app(S3Service::class);

        /** @var \App\Models\ListingPhoto|null $mainPhoto */
        $mainPhoto = $this->whenLoaded('photos', fn () => $this->photos->first());

        return [
            'id'             => $this->id,
            'title'          => $this->title,
            'species'        => $this->species,
            'breed'          => $this->breed,
            'price'          => $this->price,
            'currency'       => $this->currency,
            'location'       => $this->location,
            'status'         => $this->status,
            'can_pay'        => $this->status === 'pending_payment',
            'listing_type'   => $this->listing_type,
            'featured'       => (bool) $this->is_featured,
            'main_photo_url' => $mainPhoto
                ? $s3Service->presignedUrl($mainPhoto->s3_key, 86400)
                : null,
        ];
    }
}
