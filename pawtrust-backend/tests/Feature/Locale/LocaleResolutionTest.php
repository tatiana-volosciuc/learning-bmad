<?php

namespace Tests\Feature\Locale;

use App\Mail\BreederVerificationApprovedMail;
use App\Models\BreederProfile;
use App\Models\User;
use App\Models\VerificationRequest;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LocaleResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_authenticated_user_locale_used_for_api_responses(): void
    {
        $user = User::factory()->create(['role' => 'breeder', 'locale' => 'ru']);
        $user->assignRole('breeder');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/listings', [])
            ->assertStatus(422);

        $firstError = collect($response->json('errors'))->flatten()->first();
        $this->assertNotNull($firstError);
        $this->assertStringNotContainsStringIgnoringCase('required', $firstError);
    }

    public function test_accept_language_header_used_for_unauthenticated_requests(): void
    {
        $response = $this->withHeaders(['Accept-Language' => 'ru'])
            ->postJson('/api/v1/auth/login', [])
            ->assertStatus(422);

        $firstError = collect($response->json('errors'))->flatten()->first();
        $this->assertNotNull($firstError);
        $this->assertStringNotContainsStringIgnoringCase('required', $firstError);
    }

    public function test_invalid_locale_falls_back_to_ro(): void
    {
        $response = $this->withHeaders(['Accept-Language' => 'fr'])
            ->postJson('/api/v1/auth/login', [])
            ->assertStatus(422);

        $firstError = collect($response->json('errors'))->flatten()->first();
        $this->assertNotNull($firstError);
        $this->assertStringNotContainsStringIgnoringCase('required', $firstError);
    }

    public function test_validation_errors_returned_in_user_locale(): void
    {
        $roUser = User::factory()->create(['role' => 'breeder', 'locale' => 'ro']);
        $ruUser = User::factory()->create(['role' => 'breeder', 'locale' => 'ru']);
        $roUser->assignRole('breeder');
        $ruUser->assignRole('breeder');

        $roError = $this->actingAs($roUser, 'sanctum')
            ->postJson('/api/v1/listings', [])
            ->json('errors.title.0');

        $ruError = $this->actingAs($ruUser, 'sanctum')
            ->postJson('/api/v1/listings', [])
            ->json('errors.title.0');

        $this->assertNotNull($roError);
        $this->assertNotNull($ruError);
        $this->assertNotEquals($roError, $ruError, 'RO and RU validation messages should differ');
    }

    public function test_email_sent_in_user_locale_ro(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);
        $admin->assignRole('admin');
        $breeder = User::factory()->create(['role' => 'breeder', 'locale' => 'ro']);
        $breeder->assignRole('breeder');
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        $vr = VerificationRequest::factory()->create([
            'breeder_profile_id' => $profile->id,
            'status'             => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/verification-requests/{$vr->id}/review", [
                'status' => 'approved',
            ]);

        Mail::assertQueued(
            BreederVerificationApprovedMail::class,
            fn ($mail) => $mail->locale === 'ro'
        );
    }

    public function test_email_sent_in_user_locale_ru(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);
        $admin->assignRole('admin');
        $breeder = User::factory()->create(['role' => 'breeder', 'locale' => 'ru']);
        $breeder->assignRole('breeder');
        $profile = BreederProfile::factory()->create(['user_id' => $breeder->id]);
        $vr = VerificationRequest::factory()->create([
            'breeder_profile_id' => $profile->id,
            'status'             => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/verification-requests/{$vr->id}/review", [
                'status' => 'approved',
            ]);

        Mail::assertQueued(
            BreederVerificationApprovedMail::class,
            fn ($mail) => $mail->locale === 'ru'
        );
    }
}
