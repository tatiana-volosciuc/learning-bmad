<?php

namespace Tests\Feature\Buyer;

use App\Models\BreederProfile;
use App\Models\BreederReview;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BuyerDashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private BreederProfile $profile;
    private Listing $listing;
    private Inquiry $inquiry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->buyer = User::factory()->create(['role' => 'buyer']);
        $this->buyer->assignRole('buyer');

        $breeder = User::factory()->create(['role' => 'breeder']);
        $breeder->assignRole('breeder');
        $this->profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        $this->listing = Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
        ]);
        $this->inquiry = Inquiry::factory()->create([
            'listing_id' => $this->listing->id,
            'buyer_id'   => $this->buyer->id,
            'status'     => 'contact_revealed',
        ]);
    }

    public function test_buyer_can_list_their_inquiries(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/buyer/inquiries')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_buyer_inquiry_list_includes_listing_photo_and_breeder_name(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/buyer/inquiries')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'status', 'submitted_at', 'listing', 'breeder', 'breeder_contact']]]);
    }

    public function test_buyer_can_view_inquiry_detail(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/buyer/inquiries/{$this->inquiry->id}")
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['id', 'message', 'breeder_contact']]);
    }

    public function test_buyer_cannot_view_other_buyers_inquiry(): void
    {
        $otherBuyer = User::factory()->create(['role' => 'buyer']);
        $otherBuyer->assignRole('buyer');

        $this->actingAs($otherBuyer, 'sanctum')
            ->getJson("/api/v1/buyer/inquiries/{$this->inquiry->id}")
            ->assertStatus(403);
    }

    public function test_buyer_can_list_their_reviews(): void
    {
        BreederReview::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'buyer_id'           => $this->buyer->id,
        ]);

        $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/buyer/reviews')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_buyer_can_save_a_listing(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/buyer/saved-listings/{$this->listing->id}/save")
            ->assertStatus(200)
            ->assertJsonPath('data.saved', true);
    }

    public function test_save_listing_is_idempotent(): void
    {
        $this->buyer->savedListings()->attach($this->listing->id);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/buyer/saved-listings/{$this->listing->id}/save")
            ->assertStatus(200)
            ->assertJsonPath('data.saved', true);
    }

    public function test_buyer_can_unsave_a_listing(): void
    {
        $this->buyer->savedListings()->attach($this->listing->id);

        $this->actingAs($this->buyer, 'sanctum')
            ->deleteJson("/api/v1/buyer/saved-listings/{$this->listing->id}/save")
            ->assertStatus(200)
            ->assertJsonPath('data.saved', false);
    }

    public function test_unsave_listing_is_idempotent(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->deleteJson("/api/v1/buyer/saved-listings/{$this->listing->id}/save")
            ->assertStatus(200)
            ->assertJsonPath('data.saved', false);
    }

    public function test_buyer_can_list_saved_listings(): void
    {
        $this->buyer->savedListings()->attach($this->listing->id);

        $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/buyer/saved-listings')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_saved_listings_include_is_saved_true(): void
    {
        $this->buyer->savedListings()->attach($this->listing->id);

        $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/v1/buyer/saved-listings')
            ->assertJsonPath('data.0.is_saved', true);
    }

    public function test_breeder_cannot_access_buyer_dashboard_endpoints(): void
    {
        $breeder = User::factory()->create(['role' => 'breeder']);
        $breeder->assignRole('breeder');

        $this->actingAs($breeder, 'sanctum')
            ->getJson('/api/v1/buyer/inquiries')
            ->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_buyer_dashboard(): void
    {
        $this->getJson('/api/v1/buyer/inquiries')
            ->assertStatus(401);
    }

    public function test_breeder_viewing_inquiry_detail_marks_it_read(): void
    {
        $breeder = $this->profile->user;

        $this->actingAs($breeder, 'sanctum')
            ->getJson("/api/v1/breeder/inquiries/{$this->inquiry->id}")
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['id', 'message']]);

        $this->assertNotNull($this->inquiry->fresh()->read_at);
    }

    public function test_breeder_cannot_view_other_breeders_inquiry_detail(): void
    {
        $otherBreeder = User::factory()->create(['role' => 'breeder']);
        $otherBreeder->assignRole('breeder');
        BreederProfile::factory()->create(['user_id' => $otherBreeder->id]);

        $this->actingAs($otherBreeder, 'sanctum')
            ->getJson("/api/v1/breeder/inquiries/{$this->inquiry->id}")
            ->assertStatus(403);
    }
}
