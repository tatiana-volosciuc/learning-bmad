<?php

namespace App\Http\Resources\Sitter;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Sitter dashboard only. sender_ip deliberately excluded (internal/rate-limiting use only).
 */
class SitterContactSubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'sender_name'  => $this->sender_name,
            'sender_email' => $this->sender_email,
            'message'      => $this->message,
            'created_at'   => $this->created_at,
        ];
    }
}
