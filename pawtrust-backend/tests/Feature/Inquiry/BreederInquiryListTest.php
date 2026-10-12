<?php

namespace Tests\Feature\Inquiry;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\BreederProfile;
use App\Models\Listing;
use App\Models\Inquiry;

class BreederInquiryListTest extends TestCase
{
    use RefreshDatabase;

    private User $breeder;
    private BreederProfile $profile;
    private Listing $listing;

    protected function setUp(): void
    {
        parent::setUp();
        $this->breeder = User::factory()->create(['role' => 'breeder']);
        $this->breeder->assignRole('breeder');
        $this->profile = BreederProfile::factory()->create(['user_id' => $this->breeder->id]);
        $this->listing = Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
        ]);
    }

    public function test_breeder_can_list_their_inquiries(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Inquiry::factory()->create(['listing_id' => $this->listing->id, 'buyer_id' => $buyer->id]);

        $this->actingAs($this->breeder, 'sanctum')
            ->getJson('/api/v1/breeder/inquiries')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_breeder_cannot_see_inquiries_for_other_breeders_listings(): void
    {
        $otherBreeder = User::factory()->create(['role' => 'breeder']);
        $otherProfile = BreederProfile::factory()->create(['user_id' => $otherBreeder->id]);
        $otherListing = Listing::factory()->create(['breeder_profile_id' => $otherProfile->id]);
        $buyer        = User::factory()->create(['role' => 'buyer']);
        Inquiry::factory()->create(['listing_id' => $otherListing->id, 'buyer_id' => $buyer->id]);

        $this->actingAs($this->breeder, 'sanctum')
            ->getJson('/api/v1/breeder/inquiries')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_buyer_cannot_access_breeder_inquiry_list(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $buyer->assignRole('buyer');

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/breeder/inquiries')
            ->assertStatus(403);
    }

    public function test_inquiry_list_returns_message_excerpt_max_100_chars(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Inquiry::factory()->create([
            'listing_id' => $this->listing->id,
            'buyer_id'   => $buyer->id,
            'message'    => str_repeat('a', 200),
        ]);

        $response = $this->actingAs($this->breeder, 'sanctum')
            ->getJson('/api/v1/breeder/inquiries')
            ->assertStatus(200)
            ->json('data.0.message');

        $this->assertLessThanOrEqual(103, strlen($response)); // 100 chars + ellipsis
    }

    public function test_unread_count_returns_correct_number(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Inquiry::factory()->count(3)->create([
            'listing_id' => $this->listing->id,
            'buyer_id'   => $buyer->id,
            'read_at'    => null,
        ]);

        $this->actingAs($this->breeder, 'sanctum')
            ->getJson('/api/v1/breeder/inquiries/unread-count')
            ->assertStatus(200)
            ->assertJsonPath('data.unread_count', 3);
    }

    public function test_unread_count_excludes_read_inquiries(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Inquiry::factory()->create([
            'listing_id' => $this->listing->id,
            'buyer_id'   => $buyer->id,
            'read_at'    => now(),
        ]);

        $this->actingAs($this->breeder, 'sanctum')
            ->getJson('/api/v1/breeder/inquiries/unread-count')
            ->assertJsonPath('data.unread_count', 0);
    }
}
