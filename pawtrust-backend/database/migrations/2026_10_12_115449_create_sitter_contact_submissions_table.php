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
        Schema::create('sitter_contact_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sitter_profile_id')->constrained()->cascadeOnDelete();
            $table->string('sender_name', 150);
            $table->string('sender_email', 255);
            $table->text('message');
            $table->string('sender_ip', 45)->nullable(); // for rate limiting; IPv4 + IPv6 - PII, dashboard-only
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sitter_contact_submissions');
    }
};
