<?php

namespace Tests\Feature\Sitter;

use App\Models\SitterPortfolioPhoto;
use App\Models\SitterProfile;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitterDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function makeSitter(array $profileAttrs = []): SitterProfile
    {
        $user = User::factory()->create(['role' => 'sitter']);
        $user->assignRole('sitter');

        return SitterProfile::factory()->create(array_merge(['user_id' => $user->id], $profileAttrs));
    }

    public function test_public_can_browse_sitters_without_auth(): void
    {
        $this->makeSitter();

        $this->getJson('/api/v1/sitters')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_sitter_list_returns_paginated_results(): void
    {
        $this->makeSitter();
        $this->makeSitter();

        $this->getJson('/api/v1/sitters')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_filter_by_service_area_returns_matching_sitters(): void
    {
        $this->makeSitter(['service_areas' => ['Chișinău', 'Bălți']]);
        $this->makeSitter(['service_areas' => ['Cahul']]);

        $this->getJson('/api/v1/sitters?service_area=Chișinău')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_filter_by_service_area_is_case_insensitive(): void
    {
        $this->makeSitter(['service_areas' => ['Chisinau']]);

        $this->getJson('/api/v1/sitters?service_area=chisinau')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_filter_by_service_type_returns_matching_sitters(): void
    {
        $this->makeSitter(['services' => ['boarding', 'dog_walking']]);
        $this->makeSitter(['services' => ['day_care']]);

        $this->getJson('/api/v1/sitters?service=boarding')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_filter_by_service_type_excludes_non_matching(): void
    {
        $this->makeSitter(['services' => ['day_care']]);

        $this->getJson('/api/v1/sitters?service=boarding')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_combined_filters_work_together(): void
    {
        $this->makeSitter(['service_areas' => ['Chisinau'], 'services' => ['boarding']]);
        $this->makeSitter(['service_areas' => ['Chisinau'], 'services' => ['day_care']]);
        $this->makeSitter(['service_areas' => ['Cahul'],    'services' => ['boarding']]);

        $this->getJson('/api/v1/sitters?service_area=Chisinau&service=boarding')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_default_sort_is_most_recently_updated(): void
    {
        $older = $this->makeSitter();
        // Go through the query builder directly (not the Eloquent model) — Model::update()
        // always re-touches updated_at to "now", silently discarding any explicit value passed in.
        \DB::table('sitter_profiles')->where('id', $older->id)->update(['updated_at' => now()->subDay()]);

        $newer = $this->makeSitter();

        $ids = $this->getJson('/api/v1/sitters')
            ->assertStatus(200)
            ->json('data.*.id');

        $this->assertEquals($newer->id, $ids[0]);
    }

    public function test_empty_result_returns_empty_array_not_error(): void
    {
        $this->getJson('/api/v1/sitters?service_area=NonexistentCity')
            ->assertStatus(200)
            ->assertJson(['data' => []]);
    }

    public function test_sitter_card_does_not_include_email_or_phone(): void
    {
        $sitter = $this->makeSitter();

        $body = $this->getJson('/api/v1/sitters')
            ->assertStatus(200)
            ->getContent();

        $this->assertStringNotContainsString($sitter->user->email, $body);
        $this->assertStringNotContainsString('"phone"', $body);
        $this->assertStringNotContainsString('user_id', $body);
    }

    public function test_sitter_card_does_not_include_s3_key(): void
    {
        $profile = $this->makeSitter();
        SitterPortfolioPhoto::factory()->create([
            'sitter_profile_id' => $profile->id,
            's3_key'            => 'sitters/1/portfolio/test.jpg',
            'sort_order'        => 0,
        ]);

        $body = $this->getJson('/api/v1/sitters')
            ->assertStatus(200)
            ->getContent();

        $this->assertStringNotContainsString('s3_key', $body);
        $this->assertStringNotContainsString('sitters/1/portfolio/test.jpg', $body);
    }

    public function test_average_review_is_null_placeholder(): void
    {
        $this->makeSitter();

        $this->getJson('/api/v1/sitters')
            ->assertJsonPath('data.0.average_review', null);
    }
}
