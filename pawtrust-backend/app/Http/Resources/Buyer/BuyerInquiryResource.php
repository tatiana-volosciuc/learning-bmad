<?php

namespace App\Http\Resources\Buyer;

use App\Services\BreederReviewService;
use App\Services\S3Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BuyerInquiryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $breederProfile = $this->listing->breederProfile;

        return [
            'id'           => $this->id,
            'status'       => $this->status,
            'submitted_at' => $this->created_at,
            'has_reviewed' => app(BreederReviewService::class)->hasReviewed($request->user(), $breederProfile),
            'listing'      => [
                'id'        => $this->listing->id,
                'title'     => $this->listing->title,
                'breed'     => $this->listing->breed,
                'photo_url' => $this->getMainPhotoUrl(),
            ],
            'breeder'      => [
                'id'          => $breederProfile->id,
                'name'        => $breederProfile->user->name,
                'kennel_name' => $breederProfile->kennel_name,
            ],
            'breeder_contact' => [
                'name'  => $breederProfile->user->name,
                'email' => $breederProfile->user->email,
                'phone' => $breederProfile->phone,
            ],
        ];
    }

    private function getMainPhotoUrl(): ?string
    {
        $photo = $this->listing->photos->first();

        if (!$photo) {
            return null;
        }

        return app(S3Service::class)->presignedUrl($photo->s3_key, 86400);
    }
}
