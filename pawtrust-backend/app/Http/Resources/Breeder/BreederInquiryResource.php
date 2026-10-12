<?php

namespace App\Http\Resources\Breeder;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class BreederInquiryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'status'       => $this->status,
            'message'      => $this->message ? Str::limit($this->message, 100) : null,
            'submitted_at' => $this->created_at,
            'read_at'      => $this->read_at,
            'buyer'        => [
                'id'   => $this->buyer->id,
                'name' => $this->buyer->name,
            ],
            'listing'      => [
                'id'    => $this->listing->id,
                'title' => $this->listing->title,
            ],
        ];
    }
}
