<?php

namespace App\Http\Resources\Buyer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class BuyerReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'rating'    => $this->rating,
            'text'      => Str::limit($this->text, 100),
            'posted_at' => $this->created_at->toDateString(),
            'breeder'   => [
                'id'          => $this->breederProfile->id,
                'user_id'     => $this->breederProfile->user_id,
                'kennel_name' => $this->breederProfile->kennel_name,
            ],
        ];
    }
}
