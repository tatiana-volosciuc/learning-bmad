<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected string $guard_name = 'web';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'locale',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function breederProfile(): HasOne
    {
        return $this->hasOne(BreederProfile::class);
    }

    public function sitterProfile(): HasOne
    {
        return $this->hasOne(SitterProfile::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class, 'buyer_id');
    }

    public function savedListings(): BelongsToMany
    {
        // No withTimestamps() — saved_listings only has created_at (DB default), no updated_at column
        return $this->belongsToMany(Listing::class, 'saved_listings', 'buyer_id', 'listing_id');
    }
}
