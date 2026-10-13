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
        Schema::table('listings', function (Blueprint $table) {
            // Current featured status, settable independently of listing_type by the
            // Story 5.4 upgrade flow (listing_type stays 'standard' to preserve the
            // original purchase price used for upgrade-fee calculation).
            $table->boolean('is_featured')->default(false)->after('listing_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn('is_featured');
        });
    }
};
