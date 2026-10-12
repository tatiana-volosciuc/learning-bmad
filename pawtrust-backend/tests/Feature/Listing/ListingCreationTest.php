<?php

namespace Tests\Feature\Listing;

use App\Models\BreederProfile;
use App\Models\Listing;
use App\Models\ListingPhoto;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ListingCreationTest extends TestCase
{
    use RefreshDatabase;

    private User $breeder;
    private BreederProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->breeder = User::factory()->create(['role' => 'breeder']);
        $this->breeder->assignRole('breeder');
        $this->profile = BreederProfile::factory()->create([
            'user_id'  => $this->breeder->id,
            'location' => 'Chișinău, Moldova',
        ]);
    }

    public function test_breeder_can_create_listing(): void
    {
        config(['app.skip_listing_payment' => true]);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->assertStatus(201)
            ->assertJsonPath('data.species', 'dog');
    }

    public function test_buyer_cannot_create_listing(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $buyer->assignRole('buyer');

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->assertStatus(403);
    }

    public function test_breeder_must_have_profile_to_create_listing(): void
    {
        $breederNoProfile = User::factory()->create(['role' => 'breeder']);
        $breederNoProfile->assignRole('breeder');

        $this->actingAs($breederNoProfile, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->assertStatus(422);
    }

    public function test_listing_created_as_pending_payment_without_payment_bypass(): void
    {
        config(['app.skip_listing_payment' => false]);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->assertJsonPath('data.status', 'pending_payment');
    }

    public function test_listing_created_as_active_with_payment_bypass(): void
    {
        config(['app.skip_listing_payment' => true]);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->assertJsonPath('data.status', 'active');
    }

    public function test_listing_detail_excludes_health_certificate_key(): void
    {
        config(['app.skip_listing_payment' => true]);
        Storage::fake('s3');

        $listing = $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->json('data');

        $cert = UploadedFile::fake()->createWithContent('cert.pdf', '%PDF-1.4 fake content');

        $this->actingAs($this->breeder, 'sanctum')
            ->post("/api/v1/listings/{$listing['id']}/health-certificate", ['certificate' => $cert]);

        $this->getJson("/api/v1/listings/{$listing['id']}")
            ->assertJsonPath('data.health_certificate', 'on_file')
            ->assertJsonMissing(['health_certificate_key'])
            ->assertJsonMissing(['s3_key']);
    }

    public function test_listing_detail_shows_null_when_no_cert(): void
    {
        config(['app.skip_listing_payment' => true]);

        $listing = $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->json('data');

        $this->getJson("/api/v1/listings/{$listing['id']}")
            ->assertJsonPath('data.health_certificate', null);
    }

    public function test_photo_upload_validates_magic_bytes(): void
    {
        Storage::fake('s3');
        config(['app.skip_listing_payment' => true]);

        $listing = $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->json('data');

        $malicious = UploadedFile::fake()->createWithContent(
            'evil.jpg',
            '<?php system($_GET["cmd"]); ?>'
        );

        $this->actingAs($this->breeder, 'sanctum')
            ->withHeaders(['Accept' => 'application/json'])
            ->post("/api/v1/listings/{$listing['id']}/photos", [
                'photo'      => $malicious,
                'photo_type' => 'listing',
            ])
            ->assertStatus(422);
    }

    public function test_max_10_photos_per_listing(): void
    {
        Storage::fake('s3');
        config(['app.skip_listing_payment' => true]);

        $listing = $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->json('data');

        $listingModel = Listing::find($listing['id']);

        // Insert 10 photos directly
        for ($i = 0; $i < 10; $i++) {
            ListingPhoto::create([
                'listing_id' => $listingModel->id,
                's3_key'     => "listing-photos/{$listingModel->id}/photo{$i}.jpg",
                'photo_type' => 'listing',
                'sort_order' => $i,
            ]);
        }

        $photo = UploadedFile::fake()->image('photo11.jpg', 100, 100);

        $this->actingAs($this->breeder, 'sanctum')
            ->withHeaders(['Accept' => 'application/json'])
            ->post("/api/v1/listings/{$listing['id']}/photos", [
                'photo'      => $photo,
                'photo_type' => 'listing',
            ])
            ->assertStatus(422);
    }

    public function test_breeder_can_view_own_listings_list(): void
    {
        config(['app.skip_listing_payment' => true]);

        $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload());

        $this->actingAs($this->breeder, 'sanctum')
            ->getJson('/api/v1/breeder/listings')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_non_owner_cannot_update_listing(): void
    {
        config(['app.skip_listing_payment' => true]);

        $listing = $this->actingAs($this->breeder, 'sanctum')
            ->postJson('/api/v1/listings', $this->validPayload())
            ->json('data');

        $otherBreeder = User::factory()->create(['role' => 'breeder']);
        $otherBreeder->assignRole('breeder');
        BreederProfile::factory()->create(['user_id' => $otherBreeder->id]);

        $this->actingAs($otherBreeder, 'sanctum')
            ->putJson("/api/v1/listings/{$listing['id']}", ['title' => 'Hijacked'])
            ->assertStatus(403);
    }

    private function validPayload(): array
    {
        return [
            'title'       => 'Golden Retriever Puppy',
            'description' => 'Healthy and playful.',
            'species'     => 'dog',
            'breed'       => 'Golden Retriever',
            'gender'      => 'male',
            'price'       => 500,
        ];
    }
}
