<?php

namespace Tests\Feature\Sitter;

use App\Mail\SitterContactMail;
use App\Models\SitterProfile;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SitterProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $sitter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->sitter = User::factory()->create(['role' => 'sitter']);
        $this->sitter->assignRole('sitter');
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'full_name'        => 'Maria Popescu',
            'bio'              => 'I love taking care of dogs and cats.',
            'service_areas'    => ['Chișinău'],
            'services'         => ['boarding', 'dog_walking'],
            'rates'            => '€15/night boarding',
            'experience_years' => 5,
            'languages'        => ['ro', 'ru'],
        ], $overrides);
    }

    public function test_sitter_can_create_profile(): void
    {
        $this->actingAs($this->sitter, 'sanctum')
            ->postJson('/api/v1/sitter/profile', $this->validPayload())
            ->assertStatus(201)
            ->assertJsonPath('data.full_name', 'Maria Popescu')
            ->assertJsonPath('data.is_complete', true);
    }

    public function test_creating_profile_twice_returns_409(): void
    {
        SitterProfile::factory()->create(['user_id' => $this->sitter->id]);

        $this->actingAs($this->sitter, 'sanctum')
            ->postJson('/api/v1/sitter/profile', $this->validPayload())
            ->assertStatus(409);
    }

    public function test_sitter_can_update_profile(): void
    {
        SitterProfile::factory()->create(['user_id' => $this->sitter->id]);

        $this->actingAs($this->sitter, 'sanctum')
            ->putJson('/api/v1/sitter/profile', $this->validPayload(['full_name' => 'Updated Name']))
            ->assertStatus(200)
            ->assertJsonPath('data.full_name', 'Updated Name');
    }

    public function test_service_areas_max_3_enforced(): void
    {
        $this->actingAs($this->sitter, 'sanctum')
            ->postJson('/api/v1/sitter/profile', $this->validPayload([
                'service_areas' => ['Chișinău', 'Bălți', 'Orhei', 'Ungheni'],
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('service_areas');
    }

    public function test_buyer_cannot_create_sitter_profile(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $buyer->assignRole('buyer');

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/sitter/profile', $this->validPayload())
            ->assertStatus(403);
    }

    public function test_public_sitter_profile_does_not_include_email_or_phone(): void
    {
        $profile = SitterProfile::factory()->create(['user_id' => $this->sitter->id]);

        $body = $this->getJson("/api/v1/sitters/{$this->sitter->id}")
            ->assertStatus(200)
            ->getContent();

        $this->assertStringNotContainsString($this->sitter->email, $body);
        $this->assertStringNotContainsString('user_id', $body);
    }

    public function test_sitter_can_upload_portfolio_photo(): void
    {
        Storage::fake('s3');
        SitterProfile::factory()->create(['user_id' => $this->sitter->id]);

        $file = UploadedFile::fake()->image('portfolio.jpg')->size(100);
        // Fake JPEG magic bytes so the controller's signature check passes
        file_put_contents($file->getPathname(), "\xFF\xD8\xFF" . str_repeat('a', 50));

        $this->actingAs($this->sitter, 'sanctum')
            ->postJson('/api/v1/sitter/profile/photos', ['photo' => $file])
            ->assertStatus(201)
            ->assertJsonCount(1, 'data.portfolio_photos');
    }

    public function test_portfolio_photo_max_6_enforced(): void
    {
        Storage::fake('s3');
        $profile = SitterProfile::factory()->create(['user_id' => $this->sitter->id]);

        for ($i = 0; $i < 6; $i++) {
            $profile->portfolioPhotos()->create(['s3_key' => "sitters/{$profile->id}/portfolio/{$i}.jpg", 'sort_order' => $i]);
        }

        $file = UploadedFile::fake()->image('portfolio.jpg')->size(100);
        file_put_contents($file->getPathname(), "\xFF\xD8\xFF" . str_repeat('a', 50));

        $this->actingAs($this->sitter, 'sanctum')
            ->postJson('/api/v1/sitter/profile/photos', ['photo' => $file])
            ->assertStatus(422);
    }

    public function test_sitter_can_delete_portfolio_photo(): void
    {
        Storage::fake('s3');
        $profile = SitterProfile::factory()->create(['user_id' => $this->sitter->id]);
        $photo   = $profile->portfolioPhotos()->create(['s3_key' => "sitters/{$profile->id}/portfolio/1.jpg", 'sort_order' => 0]);

        $this->actingAs($this->sitter, 'sanctum')
            ->deleteJson("/api/v1/sitter/profile/photos/{$photo->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('sitter_portfolio_photos', ['id' => $photo->id]);
    }

    public function test_contact_form_sends_email_to_sitter(): void
    {
        Mail::fake();
        SitterProfile::factory()->create(['user_id' => $this->sitter->id]);

        $this->postJson("/api/v1/sitters/{$this->sitter->id}/contact", [
            'name'    => 'John Buyer',
            'email'   => 'john@example.com',
            'message' => 'Could you watch my dog next week?',
        ])->assertStatus(200);

        Mail::assertQueued(SitterContactMail::class, function ($mail) {
            return $mail->hasTo($this->sitter->email);
        });
    }

    public function test_contact_response_does_not_include_sitter_email(): void
    {
        Mail::fake();
        SitterProfile::factory()->create(['user_id' => $this->sitter->id]);

        $body = $this->postJson("/api/v1/sitters/{$this->sitter->id}/contact", [
            'name'    => 'John Buyer',
            'email'   => 'john@example.com',
            'message' => 'Could you watch my dog next week?',
        ])->assertStatus(200)->getContent();

        $this->assertStringNotContainsString($this->sitter->email, $body);
    }

    public function test_contact_form_rate_limited_after_5_submissions(): void
    {
        Mail::fake();
        SitterProfile::factory()->create(['user_id' => $this->sitter->id]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson("/api/v1/sitters/{$this->sitter->id}/contact", [
                'name'    => 'John Buyer',
                'email'   => 'john@example.com',
                'message' => 'Could you watch my dog next week?',
            ])->assertStatus(200);
        }

        $this->postJson("/api/v1/sitters/{$this->sitter->id}/contact", [
            'name'    => 'John Buyer',
            'email'   => 'john@example.com',
            'message' => 'Could you watch my dog next week?',
        ])->assertStatus(429);
    }

    public function test_sitter_can_list_contact_submissions(): void
    {
        $profile = SitterProfile::factory()->create(['user_id' => $this->sitter->id]);
        $profile->contactSubmissions()->create([
            'sender_name'  => 'Jane',
            'sender_email' => 'jane@example.com',
            'message'      => 'Hello there, are you available?',
            'sender_ip'    => '127.0.0.1',
        ]);

        $this->actingAs($this->sitter, 'sanctum')
            ->getJson('/api/v1/sitter/contact-submissions')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_sitter_contact_submissions_do_not_include_sender_ip(): void
    {
        $profile = SitterProfile::factory()->create(['user_id' => $this->sitter->id]);
        $profile->contactSubmissions()->create([
            'sender_name'  => 'Jane',
            'sender_email' => 'jane@example.com',
            'message'      => 'Hello there, are you available?',
            'sender_ip'    => '198.51.100.7',
        ]);

        $body = $this->actingAs($this->sitter, 'sanctum')
            ->getJson('/api/v1/sitter/contact-submissions')
            ->assertStatus(200)
            ->getContent();

        $this->assertStringNotContainsString('198.51.100.7', $body);
        $this->assertStringNotContainsString('sender_ip', $body);
    }

    public function test_profile_completeness_flag_false_when_required_fields_missing(): void
    {
        $profile = SitterProfile::factory()->create([
            'user_id' => $this->sitter->id,
            'bio'     => null,
        ]);

        $this->actingAs($this->sitter, 'sanctum')
            ->getJson('/api/v1/sitter/profile')
            ->assertStatus(200)
            ->assertJsonPath('data.is_complete', false);
    }

    public function test_profile_completeness_flag_true_when_all_required_fields_present(): void
    {
        SitterProfile::factory()->create(['user_id' => $this->sitter->id]);

        $this->actingAs($this->sitter, 'sanctum')
            ->getJson('/api/v1/sitter/profile')
            ->assertStatus(200)
            ->assertJsonPath('data.is_complete', true);
    }
}
