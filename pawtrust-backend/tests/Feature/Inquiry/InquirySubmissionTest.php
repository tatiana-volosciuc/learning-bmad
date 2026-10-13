<?php

namespace Tests\Feature\Inquiry;

use App\Models\BreederProfile;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InquirySubmissionTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private User $breeder;
    private Listing $listing;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->buyer = User::factory()->create(['role' => 'buyer']);
        $this->buyer->assignRole('buyer');

        $this->breeder = User::factory()->create(['role' => 'breeder']);
        $this->breeder->assignRole('breeder');

        $profile = BreederProfile::factory()->create([
            'user_id' => $this->breeder->id,
            'phone'   => '+37369000000',
        ]);

        $this->listing = Listing::factory()->create([
            'breeder_profile_id' => $profile->id,
            'status'             => 'active',
        ]);
    }

    public function test_buyer_can_submit_inquiry_and_receives_contact_details(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire", [
                'message' => 'I am interested in adopting this puppy.',
            ])
            ->assertStatus(201)
            ->assertJsonStructure(['data' => ['inquiry_id', 'status', 'breeder_contact']]);
    }

    public function test_contact_details_include_phone_email_and_name(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire")
            ->assertStatus(201)
            ->assertJsonStructure(['data' => ['breeder_contact' => ['name', 'email', 'phone']]]);
    }

    public function test_inquiry_status_is_contact_revealed_on_creation(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire")
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'contact_revealed');
    }

    public function test_duplicate_inquiry_returns_409(): void
    {
        Inquiry::factory()->create([
            'listing_id' => $this->listing->id,
            'buyer_id'   => $this->buyer->id,
        ]);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire")
            ->assertStatus(409);
    }

    public function test_duplicate_inquiry_error_message_is_correct(): void
    {
        Inquiry::factory()->create([
            'listing_id' => $this->listing->id,
            'buyer_id'   => $this->buyer->id,
        ]);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire")
            ->assertJson(['message' => __('errors.duplicate_inquiry')]);
    }

    public function test_breeder_cannot_submit_inquiry(): void
    {
        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire")
            ->assertStatus(403);
    }

    public function test_admin_cannot_submit_inquiry(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->assignRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire")
            ->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_submit_inquiry(): void
    {
        $this->postJson("/api/v1/listings/{$this->listing->id}/inquire")
            ->assertStatus(401);
    }

    public function test_inquiry_on_inactive_listing_is_rejected(): void
    {
        $this->listing->update(['status' => 'sold']);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire")
            ->assertStatus(422);
    }

    public function test_message_is_optional(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire", [])
            ->assertStatus(201);
    }

    public function test_message_max_500_chars_enforced(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire", [
                'message' => str_repeat('a', 501),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    public function test_phone_and_email_not_present_in_listing_api_response(): void
    {
        $response = $this->getJson("/api/v1/listings/{$this->listing->id}")
            ->assertStatus(200)
            ->json('data.breeder');

        $this->assertArrayNotHasKey('phone', $response);
        $this->assertArrayNotHasKey('email', $response);
    }

    public function test_phone_and_email_not_present_on_public_breeder_profile(): void
    {
        $profile = $this->listing->breederProfile;

        $response = $this->getJson("/api/v1/breeders/{$profile->user_id}")
            ->assertStatus(200)
            ->json('data');

        $this->assertArrayNotHasKey('phone', $response);
        $this->assertArrayNotHasKey('email', $response);
    }
}
