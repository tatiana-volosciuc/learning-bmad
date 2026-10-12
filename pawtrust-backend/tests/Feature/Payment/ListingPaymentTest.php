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
use Stripe\Exception\SignatureVerificationException;
use Tests\TestCase;

class ListingPaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $breeder;
    private BreederProfile $profile;
    private Listing $listing;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->breeder = User::factory()->create(['role' => 'breeder']);
        $this->breeder->assignRole('breeder');
        $this->profile = BreederProfile::factory()->create(['user_id' => $this->breeder->id]);
        $this->listing = Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
        ]);
    }

    public function test_listing_created_as_pending_payment_when_skip_payment_disabled(): void
    {
        config(['app.skip_listing_payment' => false]);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validListingPayload())
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'pending_payment');
    }

    public function test_listing_created_as_active_when_skip_payment_enabled(): void
    {
        config(['app.skip_listing_payment' => true]);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validListingPayload())
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'active');
    }

    public function test_breeder_can_initiate_payment_for_pending_listing(): void
    {
        $this->mockStripe();
        $this->listing->update(['status' => 'pending_payment']);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/payment/initiate")
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['checkout_url']]);
    }

    public function test_initiate_returns_checkout_url(): void
    {
        $this->mockStripe('https://checkout.stripe.com/test-url');
        $this->listing->update(['status' => 'pending_payment']);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/payment/initiate")
            ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.com/test-url');
    }

    public function test_breeder_cannot_pay_for_already_active_listing(): void
    {
        // listing is already 'active' from setUp
        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/payment/initiate")
            ->assertStatus(422);
    }

    public function test_breeder_cannot_pay_for_other_breeders_listing(): void
    {
        $otherBreeder = User::factory()->create(['role' => 'breeder']);
        $otherProfile = BreederProfile::factory()->create(['user_id' => $otherBreeder->id]);
        $otherListing = Listing::factory()->create([
            'breeder_profile_id' => $otherProfile->id,
            'status'             => 'pending_payment',
        ]);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson("/api/v1/listings/{$otherListing->id}/payment/initiate")
            ->assertStatus(403);
    }

    public function test_webhook_activates_listing_on_successful_payment(): void
    {
        $this->listing->update(['status' => 'pending_payment']);
        $sessionId = 'cs_test_abc123';

        $this->postWebhookEvent('checkout.session.completed', [
            'id'       => $sessionId,
            'metadata' => ['listing_id' => (string) $this->listing->id],
        ])->assertStatus(200);

        $this->assertDatabaseHas('listings', [
            'id'     => $this->listing->id,
            'status' => 'active',
        ]);
    }

    public function test_webhook_sets_listed_at_on_payment(): void
    {
        $this->listing->update(['status' => 'pending_payment', 'listed_at' => null]);

        $this->postWebhookEvent('checkout.session.completed', [
            'id'       => 'cs_test_def456',
            'metadata' => ['listing_id' => (string) $this->listing->id],
        ]);

        $this->assertNotNull($this->listing->fresh()->listed_at);
    }

    public function test_webhook_is_idempotent_for_same_session_id(): void
    {
        $sessionId = 'cs_test_idempotent';
        $this->listing->update([
            'status'                     => 'active',
            'stripe_checkout_session_id' => $sessionId,
        ]);

        // Second delivery of same event
        $this->postWebhookEvent('checkout.session.completed', [
            'id'       => $sessionId,
            'metadata' => ['listing_id' => (string) $this->listing->id],
        ])->assertStatus(200);

        $this->assertDatabaseHas('listings', ['id' => $this->listing->id, 'status' => 'active']);
    }

    public function test_webhook_returns_400_for_invalid_signature(): void
    {
        $this->mock(StripeService::class, function ($mock) {
            $mock->shouldReceive('constructWebhookEvent')
                ->andThrow(SignatureVerificationException::factory('Invalid signature'));
        });

        $this->withHeaders(['Stripe-Signature' => 'invalid'])
            ->postJson('/api/v1/webhooks/stripe', [])
            ->assertStatus(400);
    }

    public function test_webhook_ignores_unknown_event_types(): void
    {
        $this->postWebhookEvent('customer.subscription.deleted', [])
            ->assertStatus(200);

        $this->assertEquals('active', $this->listing->fresh()->status);
    }

    public function test_stripe_session_id_not_in_api_response(): void
    {
        $this->listing->update(['stripe_checkout_session_id' => 'cs_test_secret']);

        $body = $this->actingAs($this->breeder, 'sanctum')
            ->getJson('/api/v1/breeder/listings')
            ->getContent();

        $this->assertStringNotContainsString('stripe_checkout_session_id', $body);
        $this->assertStringNotContainsString('cs_test_secret', $body);
    }

    // --- Helpers ---

    private function mockStripe(string $url = 'https://checkout.stripe.com/test'): void
    {
        $this->mock(StripeService::class, function ($mock) use ($url) {
            $mock->shouldReceive('createCheckoutSession')
                ->andReturn(['id' => 'cs_test_fake', 'url' => $url]);
        });
    }

    private function postWebhookEvent(string $type, array $object): TestResponse
    {
        $event = Event::constructFrom([
            'id'   => 'evt_test',
            'type' => $type,
            'data' => ['object' => $object],
        ]);

        $this->mock(StripeService::class, function ($mock) use ($event) {
            $mock->shouldReceive('constructWebhookEvent')->andReturn($event);
        });

        return $this->withHeaders(['Stripe-Signature' => 'test'])
            ->postJson('/api/v1/webhooks/stripe', ['type' => $type]);
    }

    private function validListingPayload(): array
    {
        return [
            'title'       => 'Golden Retriever Puppy',
            'species'     => 'dog',
            'breed'       => 'Golden Retriever',
            'gender'      => 'male',
            'description' => 'Healthy puppy looking for a home.',
            'price'       => 500,
        ];
    }
}
