<?php

namespace Tests\Feature\Security;

use App\Models\BreederProfile;
use App\Models\Listing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private User $breeder;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->buyer   = User::factory()->create(['role' => 'buyer']);
        $this->breeder = User::factory()->create(['role' => 'breeder']);
        $this->admin   = User::factory()->create(['role' => 'admin']);

        $this->buyer->assignRole('buyer');
        $this->breeder->assignRole('breeder');
        $this->admin->assignRole('admin');
    }

    public function test_unauthenticated_cannot_access_any_protected_route(): void
    {
        $endpoints = [
            ['GET', '/api/v1/account/export'],
            ['DELETE', '/api/v1/account'],
            ['GET', '/api/v1/breeder/listings'],
            ['GET', '/api/v1/buyer/saved-listings'],
            ['GET', '/api/v1/sitter/profile'],
            ['GET', '/api/v1/admin/verification-requests'],
            ['GET', '/api/v1/buyer/inquiries'],
            ['GET', '/api/v1/breeder/inquiries'],
            ['POST', '/api/v1/verification-requests'],
            ['GET', '/api/v1/inquiries/1/documents'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $this->json($method, $uri)->assertStatus(401, "Expected 401 for $method $uri");
        }
    }

    public function test_buyer_cannot_access_breeder_only_routes(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/breeder/listings')
            ->assertStatus(403);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson('/api/v1/listings', [])
            ->assertStatus(403);
    }

    public function test_breeder_cannot_access_buyer_only_routes(): void
    {
        $this->actingAs($this->breeder, 'sanctum')
            ->getJson('/api/v1/buyer/saved-listings')
            ->assertStatus(403);
    }

    public function test_buyer_cannot_access_admin_routes(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/admin/verification-requests')
            ->assertStatus(403);
    }

    public function test_contact_details_not_exposed_on_public_listing_endpoint(): void
    {
        $breeder = User::factory()->create(['role' => 'breeder', 'email' => 'breeder@private.com']);
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id, 'phone' => '0701234567']);
        $listing = Listing::factory()->create(['breeder_profile_id' => $profile->id, 'status' => 'active']);

        $body = $this->getJson("/api/v1/listings/{$listing->id}")->assertStatus(200)->getContent();

        $this->assertStringNotContainsString('breeder@private.com', $body);
        $this->assertStringNotContainsString('0701234567', $body);
    }

    public function test_s3_keys_not_present_in_any_public_api_response(): void
    {
        $breeder = User::factory()->create(['role' => 'breeder']);
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        $listing = Listing::factory()->create(['breeder_profile_id' => $profile->id, 'status' => 'active']);

        $listing->photos()->create([
            's3_key'     => 'listing-photos/1/secret-key.webp',
            'photo_type' => 'listing',
            'sort_order' => 0,
        ]);

        $body = $this->getJson("/api/v1/listings/{$listing->id}")
            ->assertStatus(200)
            ->getContent();

        // The raw DB field name must never leak — photo URLs are always resolved
        // to pre-signed CloudFront/S3 URLs by the Resource layer, never the bare key.
        $this->assertStringNotContainsString('s3_key', $body);
    }
}
