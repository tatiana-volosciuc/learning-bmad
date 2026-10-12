<?php

namespace Tests\Feature\Inquiry;

use App\Models\BreederDocument;
use App\Models\BreederProfile;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InquiryDocumentAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private Inquiry $inquiry;
    private BreederDocument $document;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        Storage::fake('s3');

        $this->buyer = User::factory()->create(['role' => 'buyer']);
        $this->buyer->assignRole('buyer');

        $breeder = User::factory()->create(['role' => 'breeder']);
        $breeder->assignRole('breeder');
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        $listing = Listing::factory()->create(['breeder_profile_id' => $profile->id, 'status' => 'active']);

        $this->document = BreederDocument::factory()->create([
            'breeder_profile_id' => $profile->id,
            's3_key'             => 'breeder-documents/1/test-doc.pdf',
            'original_filename'  => 'health-cert.pdf',
        ]);

        $this->inquiry = Inquiry::factory()->create([
            'listing_id' => $listing->id,
            'buyer_id'   => $this->buyer->id,
            'status'     => 'contact_revealed',
        ]);
    }

    public function test_buyer_can_access_documents_after_inquiry(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/inquiries/{$this->inquiry->id}/documents")
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'document_type', 'filename', 'url', 'expires_at']]]);
    }

    public function test_response_includes_presigned_url_for_each_document(): void
    {
        $response = $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/inquiries/{$this->inquiry->id}/documents")
            ->assertStatus(200)
            ->json('data');

        $this->assertNotEmpty($response);
        $this->assertStringStartsWith('http', $response[0]['url']);
    }

    public function test_presigned_url_not_permanent_has_expires_at(): void
    {
        $response = $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/inquiries/{$this->inquiry->id}/documents")
            ->json('data.0');

        $this->assertNotNull($response['expires_at']);
        $this->assertGreaterThan(now()->timestamp, strtotime($response['expires_at']));
    }

    public function test_s3_key_not_present_in_response(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/inquiries/{$this->inquiry->id}/documents")
            ->assertJsonMissing(['s3_key']);
    }

    public function test_other_buyer_cannot_access_inquiry_documents(): void
    {
        $otherBuyer = User::factory()->create(['role' => 'buyer']);
        $otherBuyer->assignRole('buyer');

        $this->actingAs($otherBuyer, 'sanctum')
            ->getJson("/api/v1/inquiries/{$this->inquiry->id}/documents")
            ->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_inquiry_documents(): void
    {
        $this->getJson("/api/v1/inquiries/{$this->inquiry->id}/documents")
            ->assertStatus(401);
    }

    public function test_breeder_cannot_access_inquiry_documents_via_this_endpoint(): void
    {
        $breeder = $this->inquiry->listing->breederProfile->user;

        $this->actingAs($breeder, 'sanctum')
            ->getJson("/api/v1/inquiries/{$this->inquiry->id}/documents")
            ->assertStatus(403);
    }

    public function test_soft_deleted_documents_not_returned(): void
    {
        $this->document->delete();

        $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/inquiries/{$this->inquiry->id}/documents")
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_empty_document_list_returns_empty_array_not_error(): void
    {
        $this->document->delete();

        $this->actingAs($this->buyer, 'sanctum')
            ->getJson("/api/v1/inquiries/{$this->inquiry->id}/documents")
            ->assertStatus(200)
            ->assertExactJson(['data' => []]);
    }
}
