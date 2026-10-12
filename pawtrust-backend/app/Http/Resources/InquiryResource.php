<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * SECURITY: This is the ONLY resource that exposes breeder `email` and `phone`.
 * These fields MUST NOT appear in BreederProfilePublicResource, ListingResource,
 * BreederSummaryResource, or any other resource. This boundary is enforced by
 * regression tests in InquirySubmissionTest.
 */
class InquiryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'inquiry_id'      => $this->id,
            'status'          => $this->status,
            'breeder_contact' => [
                'name'  => $this->listing->breederProfile->user->name,
                'email' => $this->listing->breederProfile->user->email,
                'phone' => $this->listing->breederProfile->phone,
            ],
            // Already revealed to this buyer via breeder_contact above — no new exposure.
            'breeder_profile_id' => $this->listing->breederProfile->id,
            'breeder_user_id'    => $this->listing->breederProfile->user_id,
        ];
    }
}
