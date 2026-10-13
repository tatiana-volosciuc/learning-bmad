<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SitterProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'full_name', 'bio', 'service_areas',
        'services', 'rates', 'experience_years', 'languages',
    ];

    protected $casts = [
        'service_areas' => 'array',
        'services'      => 'array',
        'languages'     => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function portfolioPhotos(): HasMany
    {
        return $this->hasMany(SitterPortfolioPhoto::class)->orderBy('sort_order');
    }

    public function contactSubmissions(): HasMany
    {
        return $this->hasMany(SitterContactSubmission::class)->latest();
    }

    public function isProfileComplete(): bool
    {
        return filled($this->full_name)
            && filled($this->bio)
            && filled($this->service_areas)
            && filled($this->services);
    }
}
