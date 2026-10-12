<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SitterPortfolioPhoto extends Model
{
    use HasFactory;

    protected $fillable = ['sitter_profile_id', 's3_key', 'sort_order'];

    public function sitterProfile(): BelongsTo
    {
        return $this->belongsTo(SitterProfile::class);
    }
}
