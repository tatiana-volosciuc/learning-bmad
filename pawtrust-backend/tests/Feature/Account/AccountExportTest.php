<?php

namespace Tests\Feature\Account;

use App\Models\BreederDocument;
use App\Models\BreederProfile;
use App\Models\BreederReview;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountExportTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->buyer = User::factory()->create(['role' => 'buyer']);
        $this->buyer->assignRole('buyer');
    }

    public function test_user_can_export_their_data(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/account/export')
            ->assertStatus(200)
            ->assertJsonStructure(['exported_at', 'user', 'inquiries', 'reviews', 'breeder_reviews', 'saved_listings']);
    }

    public function test_export_includes_all_data_types(): void
    {
        $breeder = User::factory()->create(['role' => 'breeder']);
        $breeder->assignRole('breeder');
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        $listing = Listing::factory()->create(['breeder_profile_id' => $profile->id, 'status' => 'active']);

        Inquiry::factory()->create(['listing_id' => $listing->id, 'buyer_id' => $this->buyer->id]);
        Review::factory()->create(['listing_id' => $listing->id, 'buyer_id' => $this->buyer->id]);
        BreederReview::factory()->create(['breeder_profile_id' => $profile->id, 'buyer_id' => $this->buyer->id]);
        $this->buyer->savedListings()->attach($listing->id);

        $data = $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/account/export')
            ->assertStatus(200)
            ->json();

        $this->assertCount(1, $data['inquiries']);
        $this->assertCount(1, $data['reviews']);
        $this->assertCount(1, $data['breeder_reviews']);
        $this->assertCount(1, $data['saved_listings']);
    }

    public function test_export_does_not_include_s3_keys(): void
    {
        $breeder = User::factory()->create(['role' => 'breeder']);
        $breeder->assignRole('breeder');
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        BreederDocument::factory()->create([
            'breeder_profile_id' => $profile->id,
            's3_key'             => 'breeders/1/docs/secret.pdf',
        ]);

        $body = $this->actingAs($breeder, 'sanctum')
            ->getJson('/api/v1/account/export')
            ->getContent();

        $this->assertStringNotContainsString('s3_key', $body);
        $this->assertStringNotContainsString('secret.pdf', $body);
    }

    public function test_export_does_not_include_other_users_data(): void
    {
        $otherBuyer = User::factory()->create(['role' => 'buyer']);
        $breeder    = User::factory()->create(['role' => 'breeder']);
        $profile    = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        $listing    = Listing::factory()->create(['breeder_profile_id' => $profile->id]);

        Inquiry::factory()->create(['listing_id' => $listing->id, 'buyer_id' => $otherBuyer->id]);

        $data = $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/account/export')
            ->json();

        $this->assertCount(0, $data['inquiries']);
    }

    public function test_unauthenticated_user_cannot_export_data(): void
    {
        $this->getJson('/api/v1/account/export')
            ->assertStatus(401);
    }
}
