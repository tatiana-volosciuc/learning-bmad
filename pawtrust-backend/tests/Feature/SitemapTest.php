<?php

namespace Tests\Feature;

use App\Models\BreederProfile;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_sitemap_returns_xml_response(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/xml');
        $this->assertStringStartsWith('<?xml', trim($response->getContent()));
    }

    public function test_sitemap_includes_active_listing_url(): void
    {
        $breeder = User::factory()->create(['role' => 'breeder']);
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        $listing = Listing::factory()->create([
            'breeder_profile_id' => $profile->id,
            'status'             => 'active',
        ]);

        $content = $this->get('/sitemap.xml')->getContent();

        $this->assertStringContainsString('/listings/' . $listing->id, $content);
    }

    public function test_sitemap_excludes_inactive_listings(): void
    {
        $breeder = User::factory()->create(['role' => 'breeder']);
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        $listing = Listing::factory()->create([
            'breeder_profile_id' => $profile->id,
            'status'             => 'draft',
        ]);

        $content = $this->get('/sitemap.xml')->getContent();

        $this->assertStringNotContainsString('/listings/' . $listing->id, $content);
    }

    public function test_sitemap_includes_verified_breeder_profile_url(): void
    {
        $breeder = User::factory()->create(['role' => 'breeder']);
        BreederProfile::factory()->create(['user_id' => $breeder->id, 'verified_at' => now()]);

        $content = $this->get('/sitemap.xml')->getContent();

        $this->assertStringContainsString('/breeders/' . $breeder->id, $content);
    }

    public function test_robots_txt_is_accessible_and_disallows_api(): void
    {
        $content = $this->get('/robots.txt')->assertStatus(200)->getContent();

        $this->assertStringContainsString('Disallow: /api/', $content);
        $this->assertStringContainsString('Disallow: /admin/', $content);
    }
}
