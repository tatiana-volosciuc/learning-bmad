<?php

namespace App\Http\Resources;

use App\Services\S3Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Public discovery card. SECURITY: no user_id, email, phone, or s3_key.
 */
class SitterCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'full_name'        => $this->full_name,
            'bio_excerpt'      => $this->bio ? Str::limit($this->bio, 150) : null,
            'service_areas'    => $this->service_areas,
            'services'         => $this->services,
            'rates'            => $this->rates,
            'experience_years' => $this->experience_years,
            'photo_url'        => $this->getPhotoUrl(),
            'average_review'   => null, // placeholder — review system is post-MVP
        ];
    }

    private function getPhotoUrl(): ?string
    {
        $photo = $this->whenLoaded('portfolioPhotos', fn () => $this->portfolioPhotos->first());

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
