<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Named breeder_reviews (not reviews) — a separate listing-level `reviews` table
        // already exists for per-listing feedback shown on listing detail pages.
        Schema::create('breeder_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('breeder_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('text');
            $table->timestamps();

            $table->unique(['breeder_profile_id', 'buyer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('breeder_reviews');
    }
};
