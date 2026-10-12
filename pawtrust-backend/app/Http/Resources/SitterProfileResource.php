<?php

namespace App\Http\Resources;

use App\Services\S3Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * SECURITY: Sitter email/phone (stored on User, not SitterProfile) are NEVER
 * included here. Contact happens only via the SitterContactController form.
 */
class SitterProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'full_name'        => $this->full_name,
            'bio'              => $this->bio,
            'service_areas'    => $this->service_areas,
            'services'         => $this->services,
            'rates'            => $this->rates,
            'experience_years' => $this->experience_years,
            'languages'        => $this->languages,
            'portfolio_photos' => $this->whenLoaded(
                'portfolioPhotos',
                fn () => $this->portfolioPhotos->map(fn ($photo) => [
                    'id'  => $photo->id,
                    'url' => $this->getPhotoUrl($photo->s3_key),
                ])
            ),
            'is_complete' => $this->isProfileComplete(),
        ];
    }

    private function getPhotoUrl(string $s3Key): ?string
    {
        try {
            return app(S3Service::class)->presignedUrl($s3Key);
        } catch (\Throwable) {
            return null;
        }
    }
}
