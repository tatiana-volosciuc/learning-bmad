<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sitter_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('full_name', 150);
            $table->text('bio')->nullable();
            $table->json('service_areas');         // e.g. ['Chisinau', 'Balti'] - max 3 items, enforced in FormRequest
            $table->json('services');              // subset of: boarding, dog_walking, day_care, drop_in
            $table->string('rates', 200)->nullable();
            $table->unsignedSmallInteger('experience_years')->nullable();
            $table->json('languages')->nullable(); // e.g. ['ro', 'ru', 'en']
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sitter_profiles');
    }
};
