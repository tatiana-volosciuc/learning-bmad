<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SitterContactSubmission extends Model
{
    use HasFactory;

    public $timestamps = false; // only created_at, no updated_at column

    protected $fillable = ['sitter_profile_id', 'sender_name', 'sender_email', 'message', 'sender_ip'];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function sitterProfile(): BelongsTo
    {
        return $this->belongsTo(SitterProfile::class);
    }
}
