<?php

namespace Tests\Feature\Listing;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\BreederProfile;
use App\Models\Listing;

class ListingSearchTest extends TestCase
{
    use RefreshDatabase;

    /** @var string[] Disable transaction wrapping so InnoDB FTS cache is committed and searchable */
    protected $connectionsToTransact = [];

    private BreederProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();

        // Manually clean up between tests (no transaction rollback — needed for FULLTEXT to work)
        DB::table('listing_photos')->delete();
        DB::table('listings')->delete();
        DB::table('breeder_documents')->delete();
        DB::table('breeder_profiles')->delete();
        DB::table('users')->delete();

        $breeder = User::factory()->create(['role' => 'breeder']);
        $this->profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
    }

    public static function tearDownAfterClass(): void
    {
        // Force the next test class to run migrate:fresh since we left committed data in the DB
        RefreshDatabaseState::$migrated = false;
        parent::tearDownAfterClass();
    }

    public function test_returns_only_active_listings(): void
    {
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active']);
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'draft']);
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'sold']);

        $this->getJson('/api/v1/listings')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_filter_by_species(): void
    {
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active', 'species' => 'dog']);
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active', 'species' => 'cat']);

        $this->getJson('/api/v1/listings?species=dog')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.species', 'dog');
    }

    public function test_filter_by_price_range(): void
    {
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active', 'price' => 300]);
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active', 'price' => 600]);
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active', 'price' => 900]);

        $this->getJson('/api/v1/listings?price_min=400&price_max=700')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.price', '600.00');
    }

    public function test_filter_verified_only(): void
    {
        $verifiedBreeder = User::factory()->create(['role' => 'breeder']);
        $verified = BreederProfile::factory()->create([
            'user_id'     => $verifiedBreeder->id,
            'verified_at' => now(),
        ]);

        Listing::factory()->create(['breeder_profile_id' => $verified->id, 'status' => 'active']);
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active']);

        $this->getJson('/api/v1/listings?verified_only=1')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.verified', true);
    }

    /** @group mysql */
    public function test_keyword_search_matches_title(): void
    {
        Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
            'title'              => 'Beautiful Golden Retriever puppy',
            'breed'              => 'Golden Retriever',
        ]);
        Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
            'title'              => 'Persian kitten available',
            'breed'              => 'Persian',
        ]);

        $this->getJson('/api/v1/listings?q=golden')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.breed', 'Golden Retriever');
    }

    /** @group mysql */
    public function test_keyword_search_matches_breed(): void
    {
        Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
            'breed'              => 'Labrador Retriever',
            'description'        => 'Healthy pup',
        ]);
        Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
            'breed'              => 'Siamese',
            'description'        => 'Lovely cat',
        ]);

        $this->getJson('/api/v1/listings?q=labrador')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.breed', 'Labrador Retriever');
    }

    public function test_featured_listings_sorted_first(): void
    {
        Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
            'listing_type'       => 'standard',
            'is_featured'        => false,
            'title'              => 'Standard Listing',
        ]);
        Listing::factory()->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
            'listing_type'       => 'featured',
            'is_featured'        => true,
            'title'              => 'Featured Listing',
        ]);

        $this->getJson('/api/v1/listings')
            ->assertJsonPath('data.0.title', 'Featured Listing');
    }

    public function test_pagination_returns_correct_page_size(): void
    {
        Listing::factory()->count(25)->create([
            'breeder_profile_id' => $this->profile->id,
            'status'             => 'active',
        ]);

        $response = $this->getJson('/api/v1/listings');

        $response->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.total', 25)
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_response_excludes_contact_details(): void
    {
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active']);

        $this->getJson('/api/v1/listings')
            ->assertJsonMissing(['phone'])
            ->assertJsonMissing(['email'])
            ->assertJsonMissing(['health_certificate_key'])
            ->assertJsonMissing(['s3_key']);
    }

    public function test_response_excludes_health_certificate_key(): void
    {
        Listing::factory()->create([
            'breeder_profile_id'      => $this->profile->id,
            'status'                  => 'active',
            'health_certificate_key'  => 'certs/private.pdf',
        ]);

        $response = $this->getJson('/api/v1/listings');

        $response->assertOk();
        $body = $response->json();
        $encoded = json_encode($body);
        $this->assertStringNotContainsString('private.pdf', $encoded);
        $this->assertStringNotContainsString('health_certificate_key', $encoded);
    }

    public function test_empty_result_returns_200_with_empty_data(): void
    {
        $this->getJson('/api/v1/listings')
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.total', 0);
    }

    public function test_draft_listing_not_returned(): void
    {
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'draft']);

        $this->getJson('/api/v1/listings')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_verified_only_filter_excludes_unverified_breeders(): void
    {
        $verifiedBreeder = User::factory()->create(['role' => 'breeder']);
        $verified = BreederProfile::factory()->create([
            'user_id'     => $verifiedBreeder->id,
            'verified_at' => now(),
        ]);

        Listing::factory()->create(['breeder_profile_id' => $verified->id, 'status' => 'active']);
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active']);

        $this->getJson('/api/v1/listings?verified_only=1')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_verified_only_filter_returns_only_verified_breeders(): void
    {
        $verifiedBreeder = User::factory()->create(['role' => 'breeder']);
        $verified = BreederProfile::factory()->create([
            'user_id'     => $verifiedBreeder->id,
            'verified_at' => now(),
        ]);

        Listing::factory()->create(['breeder_profile_id' => $verified->id, 'status' => 'active']);
        Listing::factory()->create(['breeder_profile_id' => $this->profile->id, 'status' => 'active']);

        $response = $this->getJson('/api/v1/listings?verified_only=1')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // ListingCardResource returns verified as a top-level field
        $this->assertTrue($response->json('data.0.verified'));
    }
}
