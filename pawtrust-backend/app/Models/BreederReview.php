<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BreederReview extends Model
{
    use HasFactory;

    protected $fillable = ['breeder_profile_id', 'buyer_id', 'rating', 'text'];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function breederProfile(): BelongsTo
    {
        return $this->belongsTo(BreederProfile::class);
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    // "Maria P." — full buyer name never exposed on public endpoints
    public function getBuyerDisplayNameAttribute(): string
    {
        $parts = explode(' ', trim($this->buyer->name), 2);
        $first = $parts[0];
        $lastInitial = isset($parts[1]) ? ' ' . mb_substr($parts[1], 0, 1) . '.' : '';

        return $first . $lastInitial;
    }
}
