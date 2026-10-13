<?php

namespace Tests\Feature\Security;

use App\Models\BreederProfile;
use App\Models\Listing;
use App\Models\SitterProfile;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_login_rate_limited_after_10_attempts(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email'    => 'nonexistent@example.com',
                'password' => 'wrongpassword',
            ]);
        }

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'nonexistent@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(429);
        $response->assertHeader('Retry-After');
    }

    public function test_inquiry_rate_limited_after_5_attempts(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $buyer->assignRole('buyer');
        $breeder = User::factory()->create(['role' => 'breeder']);
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);

        for ($i = 0; $i < 5; $i++) {
            $listing = Listing::factory()->create([
                'breeder_profile_id' => $profile->id,
                'status'             => 'active',
            ]);

            $this->actingAs($buyer, 'sanctum')->postJson("/api/v1/listings/{$listing->id}/inquire", [
                'message' => 'Test inquiry ' . $i,
            ]);
        }

        $overLimitListing = Listing::factory()->create([
            'breeder_profile_id' => $profile->id,
            'status'             => 'active',
        ]);

        $response = $this->actingAs($buyer, 'sanctum')->postJson("/api/v1/listings/{$overLimitListing->id}/inquire", [
            'message' => 'Over limit',
        ]);

        $response->assertStatus(429);
        $response->assertHeader('Retry-After');
    }

    public function test_sitter_contact_rate_limited_after_5_attempts(): void
    {
        $sitter  = User::factory()->create(['role' => 'sitter']);
        $profile = SitterProfile::factory()->create(['user_id' => $sitter->id]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson("/api/v1/sitters/{$sitter->id}/contact", [
                'name'    => 'Test User',
                'email'   => 'test@example.com',
                'message' => 'Test message number ' . $i,
            ]);
        }

        $response = $this->postJson("/api/v1/sitters/{$sitter->id}/contact", [
            'name'    => 'Test User',
            'email'   => 'test@example.com',
            'message' => 'Over the limit message',
        ]);

        $response->assertStatus(429);
        $response->assertHeader('Retry-After');
    }
}
