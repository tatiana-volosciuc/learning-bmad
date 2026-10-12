<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Raw SQL to add the enum value — no doctrine/dbal installed, so
        // Schema::table()->enum()->change() isn't available in this project.
        DB::statement("ALTER TABLE listings MODIFY status ENUM('draft', 'pending_payment', 'active', 'sold', 'expired') NOT NULL DEFAULT 'draft'");

        Schema::table('listings', function (Blueprint $table) {
            $table->timestamp('listed_at')->nullable()->after('status');
            $table->string('stripe_checkout_session_id', 255)->nullable()->after('listed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn(['listed_at', 'stripe_checkout_session_id']);
        });

        DB::statement("ALTER TABLE listings MODIFY status ENUM('draft', 'active', 'sold', 'expired') NOT NULL DEFAULT 'draft'");
    }
};
