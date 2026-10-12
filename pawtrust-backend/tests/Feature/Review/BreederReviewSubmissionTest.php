<?php

namespace Tests\Feature\Review;

use App\Models\BreederProfile;
use App\Models\BreederReview;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BreederReviewSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private User $breeder;
    private BreederProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->buyer = User::factory()->create(['role' => 'buyer']);
        $this->buyer->assignRole('buyer');

        $this->breeder = User::factory()->create(['role' => 'breeder']);
        $this->breeder->assignRole('breeder');
        $this->profile = BreederProfile::factory()->create(['user_id' => $this->breeder->id]);
        $listing = Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
        ]);

        // Give the buyer a prior inquiry so the gate passes
        Inquiry::factory()->create([
            'listing_id' => $listing->id,
            'buyer_id'   => $this->buyer->id,
            'status'     => 'contact_revealed',
        ]);
    }

    public function test_buyer_with_inquiry_can_submit_review(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 5,
                'text'   => 'Excellent breeder, very professional.',
            ])
            ->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'rating', 'text', 'buyer_name', 'posted_at']]);
    }

    public function test_review_appears_on_public_breeder_profile_immediately(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 4,
                'text'   => 'Great experience overall.',
            ]);

        $this->getJson("/api/v1/breeders/{$this->breeder->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.review_summary.total_count', 1);
    }

    public function test_buyer_name_shown_as_first_name_and_initial_only(): void
    {
        $this->buyer->update(['name' => 'Maria Popescu']);

        $response = $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 3,
                'text'   => 'Decent experience with this breeder.',
            ])
            ->assertStatus(201)
            ->json('data.buyer_name');

        $this->assertEquals('Maria P.', $response);
        $this->assertStringNotContainsString('Popescu', $response);
    }

    public function test_buyer_id_not_in_review_response(): void
    {
        $body = $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 5,
                'text'   => 'Very happy with the process.',
            ])
            ->getContent();

        $this->assertStringNotContainsString('buyer_id', $body);
        $this->assertStringNotContainsString((string) $this->buyer->id, $body);
    }

    public function test_duplicate_review_returns_409(): void
    {
        BreederReview::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'buyer_id'           => $this->buyer->id,
        ]);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 5,
                'text'   => 'Another attempt.',
            ])
            ->assertStatus(409)
            ->assertJson(['message' => 'You have already reviewed this breeder.']);
    }

    public function test_buyer_without_inquiry_cannot_review(): void
    {
        $newBuyer = User::factory()->create(['role' => 'buyer']);
        $newBuyer->assignRole('buyer');

        $this->actingAs($newBuyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 5,
                'text'   => 'Great breeder I have never contacted.',
            ])
            ->assertStatus(422);
    }

    public function test_breeder_cannot_submit_review(): void
    {
        $otherBreeder = User::factory()->create(['role' => 'breeder']);
        $otherBreeder->assignRole('breeder');

        $this->actingAs($otherBreeder, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 5,
                'text'   => 'Self-promotion attempt.',
            ])
            ->assertStatus(403);
    }

    public function test_rating_must_be_between_1_and_5(): void
    {
        foreach ([0, 6] as $invalid) {
            $this->actingAs($this->buyer, 'sanctum')
                ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                    'rating' => $invalid,
                    'text'   => 'Rating boundary test.',
                ])
                ->assertStatus(422)
                ->assertJsonValidationErrors(['rating']);
        }
    }

    public function test_text_min_10_chars_enforced(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 4,
                'text'   => 'Short.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['text']);
    }

    public function test_text_max_500_chars_enforced(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 4,
                'text'   => str_repeat('a', 501),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['text']);
    }

    public function test_breeder_profile_aggregate_rating_updates_after_review(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 4,
                'text'   => 'Good experience overall.',
            ]);

        $average = $this->getJson("/api/v1/breeders/{$this->breeder->id}")
            ->assertStatus(200)
            ->json('data.review_summary.average_rating');

        // JSON encodes 4.0 as 4 — assert numeric equality, not float identity
        $this->assertEquals(4.0, $average);
    }

    public function test_breeder_profile_review_count_updates_after_review(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 4,
                'text'   => 'Good experience overall.',
            ]);

        $this->getJson("/api/v1/breeders/{$this->breeder->id}")
            ->assertJsonPath('data.review_summary.total_count', 1);
    }

    public function test_inquiry_exists_endpoint_returns_true_for_buyer_with_inquiry(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/buyer/inquiry-exists?breeder_profile_id={$this->profile->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.has_inquiry', true);
    }

    public function test_inquiry_exists_endpoint_returns_false_without_inquiry(): void
    {
        $newBuyer = User::factory()->create(['role' => 'buyer']);
        $newBuyer->assignRole('buyer');

        $this->actingAs($newBuyer, 'sanctum')
            ->getJson("/api/v1/buyer/inquiry-exists?breeder_profile_id={$this->profile->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.has_inquiry', false);
    }

    public function test_review_exists_endpoint_reflects_submitted_review(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/buyer/review-exists?breeder_profile_id={$this->profile->id}")
            ->assertJsonPath('data.has_reviewed', false);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/breeders/{$this->breeder->id}/reviews", [
                'rating' => 5,
                'text'   => 'Loved working with them.',
            ]);

        $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/buyer/review-exists?breeder_profile_id={$this->profile->id}")
            ->assertJsonPath('data.has_reviewed', true);
    }
}
