<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Listing extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'breeder_profile_id', 'title', 'description', 'species', 'breed',
        'gender', 'date_of_birth', 'price', 'currency', 'location',
        'status', 'listing_type', 'featured_until', 'health_certificate_key',
        'listed_at', 'stripe_checkout_session_id',
    ];

    protected $casts = [
        'date_of_birth'  => 'date',
        'featured_until' => 'datetime',
        'listed_at'      => 'datetime',
        'price'          => 'decimal:2',
    ];

    public function breederProfile(): BelongsTo
    {
        return $this->belongsTo(BreederProfile::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ListingPhoto::class)->orderBy('sort_order');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'active');
    }
}
