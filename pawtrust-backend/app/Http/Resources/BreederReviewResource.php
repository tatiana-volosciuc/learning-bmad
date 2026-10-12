<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BreederReviewResource extends JsonResource
{
    // Buyer full name and id NEVER exposed — only "First L." via buyer_display_name, no cross-referencing.

    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'rating'     => $this->rating,
            'text'       => $this->text,
            'buyer_name' => $this->buyer_display_name,
            'posted_at'  => $this->created_at->toDateString(),
        ];
    }
}
