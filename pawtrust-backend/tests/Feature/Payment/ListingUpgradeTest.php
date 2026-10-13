<?php

namespace Tests\Feature\Payment;

use App\Models\BreederProfile;
use App\Models\Listing;
use App\Models\User;
use App\Services\StripeService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Stripe\Event;
use Tests\TestCase;

class ListingUpgradeTest extends TestCase
{
    use RefreshDatabase;

    private User $breeder;
    private BreederProfile $profile;
    private Listing $standardListing;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->breeder = User::factory()->create(['role' => 'breeder']);
        $this->breeder->assignRole('breeder');
        $this->profile = BreederProfile::factory()->create(['user_id' => $this->breeder->id]);
        $this->standardListing = Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
            'is_featured'        => false,
            'listing_type'       => 'standard',
        ]);
    }

    private function mockStripe(string $url = 'https://checkout.stripe.com/upgrade-test'): void
    {
        $this->mock(StripeService::class, function ($mock) use ($url) {
            $mock->shouldReceive('createCheckoutSession')
                ->andReturn(['id' => 'cs_test_upgrade', 'url' => $url]);
        });
    }

    public function test_breeder_can_initiate_upgrade_for_active_standard_listing(): void
    {
        $this->mockStripe();

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$this->standardListing->id}/upgrade-to-featured")
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['checkout_url']]);
    }

    public function test_upgrade_returns_checkout_url(): void
    {
        $this->mockStripe('https://checkout.stripe.com/upgrade-url');

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$this->standardListing->id}/upgrade-to-featured")
            ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.com/upgrade-url');
    }

    public function test_cannot_upgrade_already_featured_listing(): void
    {
        $this->standardListing->update(['is_featured' => true, 'listing_type' => 'featured']);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$this->standardListing->id}/upgrade-to-featured")
            ->assertStatus(400);
    }

    public function test_cannot_upgrade_pending_payment_listing(): void
    {
        $this->standardListing->update(['status' => 'pending_payment']);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$this->standardListing->id}/upgrade-to-featured")
            ->assertStatus(422);
    }

    public function test_cannot_upgrade_other_breeders_listing(): void
    {
        $otherBreeder = User::factory()->create(['role' => 'breeder']);
        $otherProfile = BreederProfile::factory()->create(['user_id' => $otherBreeder->id]);
        $otherListing = Listing::factory()->create([
            'breeder_profile_id' => $otherProfile->id,
            'status'             => 'active',
            'is_featured'        => false,
        ]);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$otherListing->id}/upgrade-to-featured")
            ->assertStatus(403);
    }

    public function test_webhook_sets_is_featured_true_on_upgrade_payment(): void
    {
        $sessionId = 'cs_test_upgrade_abc';

        $this->postUpgradeWebhookEvent($sessionId, $this->standardListing->id)
            ->assertStatus(200);

        $this->assertTrue($this->standardListing->fresh()->is_featured);
    }

    public function test_upgrade_webhook_is_idempotent(): void
    {
        $sessionId = 'cs_test_upgrade_idempotent';
        $this->standardListing->update([
            'is_featured'                => true,
            'stripe_checkout_session_id' => $sessionId,
        ]);

        $this->postUpgradeWebhookEvent($sessionId, $this->standardListing->id)
            ->assertStatus(200);

        $this->assertTrue($this->standardListing->fresh()->is_featured);
    }

    public function test_featured_listings_appear_first_in_search_results(): void
    {
        $featuredListing = Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
            'is_featured'        => true,
            'listed_at'          => now()->subDay(),
        ]);
        $this->standardListing->update(['listed_at' => now()]);

        $ids = $this->getJson('/api/v1/listings')
            ->assertStatus(200)
            ->json('data.*.id');

        $this->assertEquals($featuredListing->id, $ids[0]);
    }

    public function test_standard_listing_does_not_appear_before_featured_without_payment(): void
    {
        $featuredListing = Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
            'is_featured'        => true,
            'listed_at'          => now()->subWeek(),
        ]);
        $this->standardListing->update(['listed_at' => now()]);

        $ids = $this->getJson('/api/v1/listings')->json('data.*.id');

        $featuredIndex = array_search($featuredListing->id, $ids);
        $standardIndex = array_search($this->standardListing->id, $ids);
        $this->assertLessThan($standardIndex, $featuredIndex);
    }

    private function postUpgradeWebhookEvent(string $sessionId, int $listingId): TestResponse
    {
        $event = Event::constructFrom([
            'id'   => 'evt_test_upgrade',
            'type' => 'checkout.session.completed',
            'data' => ['object' => [
                'id'       => $sessionId,
                'metadata' => [
                    'listing_id' => (string) $listingId,
                    'action'     => 'upgrade_to_featured',
                ],
            ]],
        ]);

        $this->mock(StripeService::class, function ($mock) use ($event) {
            $mock->shouldReceive('constructWebhookEvent')->andReturn($event);
        });

        return $this->withHeaders(['Stripe-Signature' => 'test'])
            ->postJson('/api/v1/webhooks/stripe', ['type' => 'checkout.session.completed']);
    }
}
